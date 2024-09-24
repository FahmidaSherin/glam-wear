const Order = require('../model/orderModel')
const Product = require('../model/productModel')
const moment = require('moment')
const PDFDocument = require('pdfkit')
const excelJS = require('exceljs')
const fs = require('fs')


function getDateRange(reportType) {
    let startDate;
    let endDate = moment().endOf('day');
    let title = 'Sales Report'; // Default title

    switch (reportType) {
        case 'daily':
            startDate = moment().startOf('day');
            title = 'Daily Sales Report';
            break;
        case 'weekly':
            startDate = moment().startOf('week');
            title = 'Weekly Sales Report';
            break;
        case 'monthly':
            startDate = moment().startOf('month');
            title = 'Monthly Sales Report';
            break;
        case 'yearly':
            startDate = moment().startOf('year');
            title = 'Yearly Sales Report';
            break;
        case 'custom':
            // Custom date range, title set in generateSalesReport
            startDate = null;
            endDate = null;
            break;
        default:
            startDate = null;
            endDate = null;
    }

    return { startDate, endDate, title };
}


// Generate sales report
const generateSalesReport = async (req, res) => {
    const reportType = req.query.reportType || 'daily';
    const { startDate, endDate, title } = getDateRange(reportType);
    const currentPage = parseInt(req.query.page, 10) || 1;
    const itemsPerPage = 10;

    try {
        let filter = {};



        if (reportType === 'custom') {
            const customStartDate = moment(req.query.startDate);
            const customEndDate = moment(req.query.endDate);



            filter = {
                createdAt: {
                    $gte: customStartDate.startOf('day').toDate(),
                    $lte: customEndDate.endOf('day').toDate(),
                },
                paymentStatus: { $nin: ['pending', 'failed'] }
            };
        } else if (startDate && endDate) {
            filter = {
                createdAt: {
                    $gte: startDate.toDate(),
                    $lte: endDate.toDate(),
                },
                paymentStatus: { $nin: ['pending', 'failed'] }
            };
        }

        const totalCount = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / itemsPerPage);


        const orders = await Order.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: '$orderAmount' },
                    totalDiscount: { $sum: '$discountAmount' },
                    totalCouponAmount: { $sum: '$discountAmount' }// Assuming 'discount' field
                },
            },
        ]);

        const detailedOrders = await Order.find(filter)
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .sort({ createdAt: -1 })
            .populate('userId')
            .populate('coupons');

        const formattedOrders = detailedOrders.map(order => ({
            ...order._doc,
            shippingDate: moment(order.shippingDate).format('YYYY-MM-DD'),
            couponCode: order.coupons ? order.coupons.code : 'N/A',
            discountAmount: order.discountAmount,
        }));

        res.render('salesReport', {
            reportType,
            report: orders,
            orders: formattedOrders,
            currentPage,
            totalPages,
            startDate: req.query.startDate || '',
            endDate: req.query.endDate || '',
            title: title || 'Custom Sales Report',
        });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).send('Server Error');
    }
}



function addSummary(doc, reportType, totalOrders, totalAmount) {
    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.fontSize(14).text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, { align: 'left' });
    doc.moveDown();
    doc.fontSize(12).text(`Total Orders: ${totalOrders}`);
    doc.text(`Total Amount: ${totalAmount.toFixed(2)}`);
    doc.moveDown(2);
}


function addOrderDetails(doc, detailedOrders) {
    doc.fontSize(14).text('Order Details', { align: 'center' });
    doc.moveDown();

    detailedOrders.forEach((order, index) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`Order #${index + 1}`, { underline: true });
        doc.fontSize(10).font('Helvetica').moveDown();

        doc.text(`Order ID: ${order.orderUniqueId || 'N/A'}`);
        doc.text(`Name: ${order.userId ? order.userId.name : 'N/A'}`);
        doc.text(`Amount: ${order.orderAmount.toFixed(2)}`);
        doc.text(`Order Status: ${order.orderStatus || 'N/A'}`);
        doc.text(`Payment Status: ${order.paymentStatus || 'N/A'}`);
        doc.text(`Order Date: ${moment(order.createdAt).format('YYYY-MM-DD')}`);
        doc.text(`Coupon Code: ${order.coupons ? order.coupons.code : 'N/A'}`);

        if (order.coupons) {
            const discountValue = order.coupons.discountValue;
            const isPercentage = order.coupons.discountType === 'percentage';

            const discountText = isPercentage ? `${Math.round(discountValue)}%` : ` ₹${discountValue.toFixed(2)}`;
            doc.text(`Discount: ${discountText}`);
        } else {
            doc.text('Discount: N/A');
        }

        doc.text(`Final Amount: ${order.finalAmount.toFixed(2)}`);

        doc.moveDown();
    });
}

const downloadPDF = async (req, res) => {
    const reportType = req.query.reportType || 'daily';
    const { startDate, endDate } = getDateRange(reportType);

    try {
        let filter = { paymentStatus: 'paid'};

        if (reportType === 'custom') {
            filter.createdAt = {
                $gte: moment(req.query.startDate).startOf('day').toDate(),
                $lte: moment(req.query.endDate).endOf('day').toDate(),
            };
        } else if (startDate && endDate) {
            filter.createdAt = {
                $gte: startDate.toDate(),
                $lte: endDate.toDate(),
            };
        }

        const detailedOrders = await Order.find(filter)
            .populate('userId')
            .populate({
                path: 'coupons',
                select: 'discountValue code discountType',
            })
            .sort({ createdAt: -1 });

        const totalOrders = detailedOrders.length;
        const totalAmount = detailedOrders.reduce((sum, order) => sum + order.orderAmount, 0);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=salesReport.pdf');

        res.on('finish', () => {
        });

        doc.pipe(res);

        addSummary(doc, reportType, totalOrders, totalAmount);
        addOrderDetails(doc, detailedOrders);

        doc.end();

    } catch (error) {
        console.error('Error downloading PDF:', error);
        res.status(500).send('Server Error');
    }
};


const downloadExcel = async (req, res) => {
    const reportType = req.query.reportType || 'daily';
    const { startDate, endDate } = getDateRange(reportType);

    try {
        let filter = { paymentStatus: 'paid', };

        if (reportType === 'custom') {
            filter.createdAt = {
                $gte: moment(req.query.startDate).startOf('day').toDate(),
                $lte: moment(req.query.endDate).endOf('day').toDate(),
            };
        } else if (startDate && endDate) {
            filter.createdAt = {
                $gte: startDate.toDate(),
                $lte: endDate.toDate(),
            };
        }

        const detailedOrders = await Order.find(filter)
            .populate('userId')
            .populate({
                path: 'coupons',
                select: 'discountValue code discountType',
            })
            .sort({ createdAt: -1 });

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 30 },
            { header: 'User Name', key: 'userName', width: 20 },
            { header: 'Order Amount', key: 'orderAmount', width: 15 },
            { header: 'Order Status', key: 'orderStatus', width: 15 },
            { header: 'Payment Status', key: 'paymentStatus', width: 15 },
            { header: 'Order Date', key: 'orderDate', width: 15 },
            { header: 'Coupon Code', key: 'couponCode', width: 20 },
            { header: 'Discount', key: 'discount', width: 15 },
            { header: 'Final Amount', key: 'finalAmount', width: 15 },
        ];

        detailedOrders.forEach((order) => {
            const discountValue = order.coupons ? order.coupons.discountValue : 0;
            const isPercentage = order.coupons ? order.coupons.discountType === 'percentage' : false;

            const discountText = order.coupons
                ? (isPercentage ? `${Math.round(discountValue)}%` : ` ₹${discountValue.toFixed(2)}`)
                : 'nil';

            worksheet.addRow({
                orderId: order.orderUniqueId,
                userName: order.userId ? order.userId.name : 'N/A',
                orderAmount: order.orderAmount.toFixed(2),
                orderStatus: order.orderStatus || 'N/A',
                paymentStatus: order.paymentStatus || 'N/A',
                orderDate: moment(order.createdAt).format('YYYY-MM-DD'),
                couponCode: order.coupons ? order.coupons.code : 'N/A',
                discount: discountText,
                finalAmount: order.finalAmount.toFixed(2),
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=salesReport.xlsx');
        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) {
        console.error('Error downloading Excel:', error);
        res.status(500).send('Server Error');
    }
};


module.exports = {
    generateSalesReport,
    downloadPDF,
    downloadExcel,
};
