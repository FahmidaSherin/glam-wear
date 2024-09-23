const User = require('../model/userModel')
const Category = require('../model/categoryModel')
const Product = require('../model/productModel')
const Order = require('../model/orderModel')
const Address = require('../model/addressModel')
const Wallet = require('../model/walletModel')
const axios = require('axios');
const orderModel = require('../model/orderModel')
const PDFDocument = require('pdfkit');
const path = require('path')


const orderList = async (req, res) => {
    try {
        const userId = req.session.user_id;
        console.log('userId', userId);
        const page = parseInt(req.query.page) || 1; // Current page
        const limit = parseInt(req.query.limit) || 5; // Number of orders per page
        const skip = (page - 1) * limit;


        const totalOrders = await Order.countDocuments({ userId: userId });
        const totalPages = Math.ceil(totalOrders / limit);

        const order = await Order.find({ userId: userId }).populate('orderedItem.productId').sort({ createdAt: -1 }).skip(skip)
        .limit(limit);
        const users = await User.findOne({ _id: userId });
        console.log('users', users);
        res.render('users/orders', { order: order, users: users, currentPage: page,
            totalPages: totalPages,limit: limit });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Internal Server Error');
    }
};


// const viewOrder = async (req, res) => {

//     try {
//         const userId = req.session.user_id
//         const user = await User.findOne({ _id: userId })
//         const orderId = req.query.orderId.replace(/\s+/g, '');
//         const orderDetails = await Order.findOne({ _id: orderId }).populate('userId')
//             .populate({ path: 'orderedItem.productId', model: 'Product' })
//             .populate('deliveryAddress')
//             .populate('coupons')

//             console.log('OrderDetails:::::::::',orderDetails);

//             const shippingCharge = 100
//         const products = orderDetails.orderedItem
//         res.render('users/singleOrder', { orderDetails: orderDetails, user: userId,       finalAmount: orderDetails.finalAmount,
//             discount: orderDetails.discountAmount,
//             couponCode: orderDetails.coupons ? orderDetails.coupons.code : null,
//             shippingCharge:shippingCharge
//           })
//     } catch (error) {
//         console.log(error.message);
//     }
// }

const viewOrder = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const user = await User.findOne({ _id: userId });
        const orderId = req.query.orderId.replace(/\s+/g, '');

        
        const orderDetails = await Order.findOne({ _id: orderId })
            .populate('userId')
            .populate({ path: 'orderedItem.productId', model: 'Product' })
            .populate('deliveryAddress')
            .populate('coupons');

        console.log('OrderDetails:::::::::', orderDetails);

        const shippingCharge = 100;
        const products = orderDetails.orderedItem;
        
        res.render('users/singleOrder', {
            orderDetails: orderDetails,
            user: userId,
            finalAmount: orderDetails.finalAmount,
            discount: orderDetails.discountAmount,
            couponCode: orderDetails.coupons ? orderDetails.coupons.code : null,
            shippingCharge: shippingCharge
        });
    } catch (error) {
        console.log(error.message);
    }
};


// const cancelOrder = async (req, res) => {

//     const orderId = req.params.orderId;
//     // console.log('orderId',orderId);
//     const newStatus = req.body.status;
//     // console.log('newStatus',newStatus);
//     try {

//         const updatedOrder = await Order.findByIdAndUpdate(orderId, { orderStatus: newStatus }, { new: true });
//         if (!updatedOrder) {
//             return res.status(404).json({ error: 'Order not found' });
//         }

//         res.status(200).json(updatedOrder);
//     } catch (error) {
//         console.error('Error updating order status:', error);
//         res.status(500).json({ error: 'Failed to update order status' });
//     }
// };


// const returnOrder = async (req, res) => {
//     console.log('inside returnOrder');
    
//     const { orderId, returnReason, otherReason } = req.body;
//     console.log('Request body:', req.body);

//     if (!orderId) {
//         console.log('Order ID is required');
//         return res.status(400).json({ error: 'Order ID is required' });
//     }

//     try {
//         console.log('Fetching order from database');
//         const order = await Order.findById(orderId);
//         console.log('Order:', order);

//         if (!order) {
//             console.log('Order not found');
//             return res.status(404).json({ error: 'Order not found' });
//         }

//         console.log('Payment Method:', order.paymentMethod);
//         console.log('Order Status:', order.orderStatus);

//         if (order.paymentMethod.toLowerCase() !== 'razorpay') {
//             console.log('Order was not paid via Razorpay');
//             return res.status(400).json({ message: 'Order was not paid via Razorpay.' });
//         }

//         if (order.orderStatus === 'returned') {
//             console.log('Order is already returned');
//             return res.status(400).json({ message: 'Order is already returned.' });
//         }

//         if (order.orderStatus !== 'delivered') {
//             console.log('Only delivered orders can be returned');
//             return res.status(400).json({ message: 'Only delivered orders can be returned.' });
//         }

//         const refundAmount = order.finalAmount;
//         console.log('Refund Amount:', refundAmount);

       

//         console.log('Fetching wallet for user:', order.userId);
//         let wallet = await Wallet.findOne({ userId: order.userId });
//         console.log('Wallet:', wallet);

//         if (!wallet) {
//             console.log('Wallet not found');
//             wallet = new Wallet({ userId: order.userId, balance: 0, transaction: [] });
//         }

//         order.orderStatus = 'returned';
//         order.returnReason = returnReason || otherReason;
//         await order.save();

//         wallet.balance += refundAmount;
//         console.log('Updated Wallet Balance:', wallet.balance);

//         wallet.transaction.push({
//             amount: refundAmount,
//             transactionsMethod: 'Remarks',
//             date: new Date(),
//             remarks: 'Order return refund'
//         });

//         await wallet.save();
//         console.log('Updated Wallet:', wallet);

//         res.status(200).json({ message: 'Order returned successfully and amount refunded to wallet.' });
//     } catch (error) {
//         console.error('Error in returnOrder:', error);
//         res.status(500).json({ message: 'Failed to return order', error: error.message });
//     }
// };
const cancelOrder = async (req, res) => {
    const orderId = req.params.orderId;

    try {
        // Fetch the order to update its status
        const order = await Order.findById(orderId).populate('orderedItem.productId');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update product quantities and prepare refund details
        const productsToRefund = [];
        let totalRefundAmount = 0;

        for (const item of order.orderedItem) {
            const product = await Product.findById(item.productId);
            if (product) {
                // Increase stock by the ordered quantity
                product.quantity += item.quantity; 
                await product.save();

                // Check payment status for refund
                if (order.paymentStatus === 'paid') {
                    productsToRefund.push(item);
                    totalRefundAmount += item.price * item.quantity; // Calculate refund amount
                }
            }
        }

        // Refund logic if payment status is paid
        if (order.paymentStatus === 'paid' && totalRefundAmount > 0) {
            let wallet = await Wallet.findOne({ userId: order.userId });
            if (!wallet) {
                // If the wallet doesn't exist, create a new one
                wallet = new Wallet({ userId: order.userId, balance: 0, transaction: [] });
            }
            // Update the wallet balance
            wallet.balance += totalRefundAmount;
            wallet.transaction.push({
                amount: totalRefundAmount,
                transactionsMethod: 'Remarks',
                date: new Date(),
                remarks: 'Order cancellation refund'
            });
            await wallet.save();
        }

        // Update the order status to cancelled
        order.orderStatus = 'cancelled';
        await order.save();

        res.status(200).json({ message: 'Order cancelled successfully.', refundedAmount: totalRefundAmount });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
};


const returnOrder = async (req, res) => {
    console.log('inside returnOrder');

    const { orderId, returnReason, otherReason } = req.body;
    console.log('Request body:', req.body);

    if (!orderId) {
        console.log('Order ID is required');
        return res.status(400).json({ error: 'Order ID is required' });
    }

    try {
        console.log('Fetching order from database');
        const order = await Order.findById(orderId);
        console.log('Order:', order);

        if (!order) {
            console.log('Order not found');
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log('Order Status:', order.orderStatus);

        // Check if the order is already returned
        if (order.orderStatus === 'returned') {
            console.log('Order is already returned');
            return res.status(400).json({ message: 'Order is already returned.' });
        }

        // Check if the order is not delivered
        if (order.orderStatus !== 'delivered') {
            console.log('Only delivered orders can be returned');
            return res.status(400).json({ message: 'Only delivered orders can be returned.' });
        }

        // Calculate the refund amount
        const refundAmount = order.finalAmount;
        console.log('Refund Amount:', refundAmount);

        // Fetch the user's wallet
        console.log('Fetching wallet for user:', order.userId);
        let wallet = await Wallet.findOne({ userId: order.userId });
        console.log('Wallet:', wallet);

        if (!wallet) {
            console.log('Wallet not found');
            wallet = new Wallet({ userId: order.userId, balance: 0, transaction: [] });
        }

        for (const item of order.orderedItem) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.quantity += item.quantity; // Increase stock by the returned quantity
                await product.save();
                console.log(`Updated stock for product ${product.name}:`, product.quantity);
            }
        }
        // Update order status and reason
        order.orderStatus = 'returned';
        order.returnReason = returnReason || otherReason;
        await order.save();

        // Add refund to wallet
        wallet.balance += refundAmount;
        console.log('Updated Wallet Balance:', wallet.balance);

        // Add the transaction to wallet history
        wallet.transaction.push({
            amount: refundAmount,
            transactionsMethod: 'Remarks',
            date: new Date(),
            remarks: 'Order return refund'
        });

        await wallet.save();
        console.log('Updated Wallet:', wallet);

        res.status(200).json({ message: 'Order returned successfully and amount refunded to wallet.' });
    } catch (error) {
        console.error('Error in returnOrder:', error);
        res.status(500).json({ message: 'Failed to return order', error: error.message });
    }
};





const paymentStatusCheng=async(req,res)=>{
    const {id}=req.body;
    const data=await orderModel.findOneAndUpdate({_id:id},{paymentStatus:"paid"},{new:true});
    res.status(200).json({message:"succefully changed payment status"});
}

const getOrderStatus = async (req, res) => {
    const orderId = req.query.orderId;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(200).json({ status: order.orderStatus });
    } catch (error) {
        console.error('Error fetching order status:', error);
        res.status(500).json({ error: 'Failed to fetch order status' });
    }
};

const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.query.orderId?.trim();
        if (!orderId) {
            return res.status(400).send('Invalid order ID');
        }

        const orderDetails = await Order.findOne({ _id: orderId })
            .populate('userId')
            .populate({ path: 'orderedItem.productId', model: 'Product' })
            .populate('deliveryAddress')
            .populate('coupons');

        if (!orderDetails) {
            return res.status(404).send('Order not found');
        }
        if (orderDetails.orderStatus === 'cancelled') {
            return res.status(400).send('Cannot download invoice for a canceled order.');
        }

        const doc = new PDFDocument();
        
        res.setHeader('Content-disposition', `attachment; filename=invoice_${orderDetails.orderUniqueId}.pdf`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Invoice', { align: 'center' });
        doc.moveDown();

        // Order Details
        doc.fontSize(12).text(`Order ID: ${orderDetails.orderUniqueId}`);
        doc.text(`Date: ${orderDetails.createdAt.toLocaleDateString()}`);
        doc.text(`Payment Method: ${orderDetails.paymentMethod}`);
        doc.text(`Order Status: ${orderDetails.orderStatus}`);
        doc.moveDown();

        // Shipping Information
        const address = orderDetails.deliveryAddress;
        doc.text('Shipping Information:', { underline: true });
        doc.text(`Name: ${address?.name || 'N/A'}`);
        doc.text(`Phone: ${address?.mobile || 'N/A'}`);
        doc.text(`Address: ${address?.streetAddress || 'N/A'}, ${address?.locality || ''}, ${address?.city || ''}, ${address?.state || ''}, ${address?.postalCode || ''}`);
        doc.moveDown();

        // Ordered Items - Table Header
        doc.text('Ordered Items:', { underline: true });
        const tableTop = doc.y;
        // const itemCodeX = 50;
        const descriptionX = 50;
        const quantityX = 300;
        const priceX = 380;
        const totalX = 460;

        // Draw table headers with a background color
        doc.fontSize(10).fillColor('white').rect(descriptionX, tableTop, 500, 20).fill('gray');
        doc.fillColor('white').text('Description', descriptionX, tableTop + 5, { width: 250, align: 'center' });
        doc.text('Quantity', quantityX, tableTop + 5, { width: 60, align: 'center' });
        doc.text('Price', priceX, tableTop + 5, { width: 60, align: 'center' });
        doc.text('Total', totalX, tableTop + 5, { width: 60, align: 'center' });
        doc.fillColor('black');

        // Draw a line below the headers
       doc.moveTo(descriptionX, tableTop + 20).lineTo(550, tableTop + 20).stroke();

        // Table content
       let y = tableTop + 25;
        orderDetails.orderedItem.forEach(item => {
            const itemTotal = item.price * item.quantity;

            // Draw table row with alternate row background color
            if ((orderDetails.orderedItem.indexOf(item) % 2) === 0) {
                doc.rect(descriptionX, y - 2, 500, 20).fill('#f5f5f5'); // Light gray background for alternate rows
            }
            doc.fontSize(10).fillColor('black');
            doc.text(`${item.productId?.name || 'Unknown Product'}`, descriptionX, y, { width: 250, align: 'center' });
            doc.text(`${item.quantity}`, quantityX, y, { width: 60, align: 'center' });
            doc.text(`₹${item.price}`, priceX, y, { width: 60, align: 'center' });
            doc.text(`₹${itemTotal}`, totalX, y, { width: 60, align: 'center' });

            y += 20; // Move to the next line
        });
        // Draw a line below the table
        doc.moveTo(descriptionX, y).lineTo(550, y).stroke();

        y += 10; // Add some space after the table

        // Order Summary
        doc.text(`Subtotal: ₹${orderDetails.orderAmount}`, 400, y, { align: 'right' });
        y += 15;
        if (orderDetails.discountAmount > 0) {
            doc.text(`Discount: -₹${orderDetails.discountAmount}`, 400, y, { align: 'right' });
            y += 15;
        }
        doc.text(`Shipping Charge: ₹${orderDetails.shippingCharge}`, 400, y, { align: 'right' });
        y += 15;
        doc.text(`Total: ₹${orderDetails.finalAmount}`, 400, y, { underline: true, align: 'right' });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating invoice PDF');
    }
};




module.exports = {
    orderList,
    cancelOrder,
    returnOrder,
    viewOrder,
    paymentStatusCheng,
    getOrderStatus,
    downloadInvoice
}