const User = require('../model/userModel')
const bcrypt = require('bcrypt')
const config = require('../config/config')
const Category = require('../model/categoryModel')
const Product = require('../model/productModel')
const Order = require('../model/orderModel')
const Coupon = require('../model/couponModel')



//admin login page
const loadLogin = async (req, res) => {
    try {
        const message = req.flash('msg');
        res.render('login', { message })

    } catch (error) {
        console.log(error.message);
    }
}

//admin data post
const adminVerify = async (req, res) => {
    try {

        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email })
        if (userData) {

            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {

                if (userData.is_admin === 0) {
                    req.flash('msg', 'your not admin')
                    res.redirect('/admin')
                } else {
                    req.session.admin_id = userData._id
                    res.redirect('/admin/dashboard')
                }

            } else {
                req.flash('msg', 'email and password incorrect')
                res.redirect('/admin')
            }

        } else {
            req.flash('msg', 'email and password incorrect')
            res.redirect('/admin')
        }


    } catch (error) {
        console.log(error.message);
    }
}




const loadDashboard = async (req, res) => {
    try {
        const userData = await User.findById(req.session.admin_id);

        const { top10Products, top10Categories } = await top10ProductsCategories();


        const orders = await Order.find();


        const revenue = orders.reduce((total, order) => total + order.totalAmount, 0);

        const salesCount = orders.length;

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        let nextDay = new Date(currentDate);
        nextDay.setDate(currentDate.getDate() + 1);

        const dailyOrders = await Order.find({
            shippingDate: {
                $gte: currentDate,
                $lte: nextDay
            }
        });

        const dailyRevenue = dailyOrders.reduce((total, order) => total + order.totalAmount, 0);

        res.render('dashboard', {
            admin: userData,
            orders,
            revenue,
            salesCount,
            dailyRevenue,
            top10Products,
            top10Categories
        });

    } catch (error) {
        console.error('Error found:', error);
        res.status(500).send('Internal Server Error');
    }
};

const graph = async (req, res) => {
    try {
        const { value } = req.query;
        let pipeline = [];

        if (value === 'monthly') {

            const startOfYear = new Date(new Date().getFullYear(), 0, 1);

            const endOfYear = new Date(new Date().getFullYear(), 11, 31);



            pipeline = [
                {
                    $match: {
                        shippingDate: { $gte: startOfYear, $lte: endOfYear }
                    }
                },
                {
                    $group: {
                        _id: { $month: '$shippingDate' },
                        month: { $first: { $month: '$shippingDate' } },
                        monthlyTotalAmount: { $sum: '$finalAmount' },
                        monthlyOrderCount: { $sum: 1 }
                    }
                },
                {
                    $sort: {
                        '_id': 1
                    }
                }
            ];



        } else if (value === 'yearly') {

            const tenYearsAgo = new Date();
            tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 9);

            pipeline = [
                {
                    $match: {
                        shippingDate: { $gte: tenYearsAgo }
                    }
                },
                {
                    $group: {
                        _id: { $year: '$shippingDate' },
                        yearlyTotalAmount: { $sum: '$finalAmount' },
                        yearlyOrderCount: { $sum: 1 }
                    }
                },
                {
                    $sort: {
                        '_id': 1
                    }
                }
            ];
        } else if (value === 'weekly') {

            const startOfYear = new Date(new Date().getFullYear(), 0, 1);
            const endOfYear = new Date(new Date().getFullYear(), 11, 31);

            pipeline = [
                {
                    $match: {
                        shippingDate: { $gte: startOfYear, $lte: endOfYear }
                    }
                },
                {
                    $group: {
                        _id: { $isoWeek: '$shippingDate' },
                        week: { $first: { $isoWeek: '$shippingDate' } },
                        weeklyTotalAmount: { $sum: '$finalAmount' },
                        weeklyOrderCount: { $sum: 1 }
                    }
                },
                {
                    $sort: {
                        '_id': 1
                    }
                }
            ];
        }
        const data = await Order.aggregate(pipeline);
        res.json(data);
    } catch (error) {
        console.error('Error found in graph', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const top10ProductsCategories = async (req, res) => {
    try {
        const top10Products = await Order.aggregate([
            { $unwind: "$orderedItem" },
            {
                $group: {
                    _id: "$orderedItem.productId",
                    totalSold: { $sum: "$orderedItem.quantity" },
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    _id: 1,
                    count: "$totalSold",
                    name: "$productDetails.name",
                    image: "$productDetails.image",
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        const top10Categories = await Order.aggregate([
            { $unwind: "$orderedItem" },
            {
                $lookup: {
                    from: "products",
                    localField: "orderedItem.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $group: {
                    _id: "$product.category",
                    totalSold: { $sum: "$orderedItem.quantity" }
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            {
                $project: {
                    categoryName: "$category.name",
                    count: "$totalSold"
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        return { top10Products, top10Categories };
    } catch (error) {
        console.error("Error fetching top 10 products and categories:", error);
        throw error;
    }
}

const listUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;
        const users = await User.find().sort({ _id: -1 }).skip(skip).limit(limit);

        const totalUsers = await User.countDocuments();
        res.render('custommer', {
            users, currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
            limit
        });
    } catch (error) {
        console.log(error.message);
    }
}


// Block or unblock  users

const updateUserStatus = async (req, res) => {
    try {
        const userId = req.params.id
        const action = req.params.action

        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        if (action === 'block') {
            user.is_blocked = 1
        } else if (action === 'unblock') {
            user.is_blocked = 0
        } else {
            return res.status(400).json({ error: 'Invalid action' })
        }
        await user.save()

        res.status(200).json({ message: `User ${action === 'block' ? 'blocked' : 'unublocked'} successfully` })
    } catch (error) {
        console.error('Error updating user status ', error)
        res.status(500).json({ error: ' Internal Server Error' })
    }
}


// Category Details

const categoryDetails = async (req, res) => {
    try {

        const pageNumber = parseInt(req.query.page) || 1;
        const pageSize = 5;
        const skip = (pageNumber - 1) * pageSize;
        const categorys = await Category.find({}).sort({ createdAt: -1 }).skip(skip).limit(pageSize)
        const totalCategoriesCount = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategoriesCount / pageSize);
        res.render('categories', { categorys: categorys, currentPage: pageNumber, totalPages })
    } catch (error) {
        console.log(error.message);
    }
}


// Category updatedCategory

const updatedCategory = async (req, res) => {
    try {

        const categoryId = req.query.categoryId
        const category = await Category.findById({ categoryId })
        res.render('categories', { category: category })

    } catch (error) {
        console.log(error.message);
    }
}


const orderDetails = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;


        const orders = await Order.find({}).populate('userId')
            .populate('deliveryAddress')
            .populate({ path: 'orderedItem.productId', model: 'Product' })
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments();

        const formattedOrders = orders.map(order => {
            const date = new Date(order.createdAt)
            const formattedDate = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')

            const discountAmount = order.discountAmount || 0;
            const shippingCharge = order.shippingCharge || 0;
            const finalAmount = order.orderAmount - discountAmount + shippingCharge;
            return {
                ...order.toObject(),
                formattedCreatedAt: formattedDate,
                discountAmount: discountAmount,
                finalAmount: finalAmount,
                shippingCharge: shippingCharge,
                orderUniqueId: order.orderUniqueId
            }
        })
        res.render('order', {
            orderDetails: formattedOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            limit
        })
    } catch (error) {
        console.log(error.message);
    }
}

const singleView = async (req, res) => {
    try {
        const orderId = req.query.orderId.replace(/\s+/g, '');
        const orderDetails = await Order.findOne({ _id: orderId })
            .populate('userId')
            .populate({ path: 'orderedItem.productId', model: 'Product' })
            .populate('deliveryAddress');

        orderDetails.orderedItem = orderDetails.orderedItem.map(item => {
            let price = parseFloat(item.productId.price) || 0;
            const quantity = parseInt(item.quantity) || 0;

            if (item.productId.offerPrice) {
                price = parseFloat(item.productId.offerPrice);
            }

            const finalAmountForItem = price * quantity;


            item.finalAmountForItem = finalAmountForItem;
            return item;
        });

        const totalOrderAmount = orderDetails.orderedItem.reduce((total, item) => {
            return total + item.finalAmountForItem;
        }, 0);

        const shippingCharge = 100

        let finalAmount = totalOrderAmount + shippingCharge;

        let discount = 0;
        if (orderDetails.coupons) {
            const coupon = await Coupon.findOne({ _id: orderDetails.coupons });
            if (coupon) {
                if (coupon.discountType === 'percentage') {
                    discount = (totalOrderAmount * coupon.discountValue) / 100;
                } else if (coupon.discountType === 'fixed') {
                    discount = coupon.discountValue;
                }
                finalAmount = Math.max(finalAmount - discount, 0);
            }
        }


        res.render('singleView', {
            orderDetails: orderDetails,
            finalAmount: finalAmount,
            discount: discount,
            shippingCharge: shippingCharge
        });
    } catch (error) {
        console.log(error.message);
    }
};










const updateStatus = async (req, res) => {
    try {
        const { status, orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.orderStatus === 'delivered' && status !== 'returned') {
            return res.status(400).json({ success: false, message: 'Cannot change the status of a delivered order, except to "returned".' });
        }

        const updateData = {
            orderStatus: status,
        };

        if (status === 'delivered' && order.paymentMethod === 'cash_on_delivery') {
            updateData.deliveryDate = new Date();
            updateData.paymentStatus = 'paid';
        }

        const orderStatus = await Order.updateOne(
            { _id: orderId },
            { $set: updateData }
        );


        res.status(200).json({ success: true });
    } catch (error) {
        console.log('Error in updating order status:', error);
        res.status(500).json({ success: false });
    }
};


const logout = async (req, res) => {
    try {
        req.session.admin_id = null;
        res.redirect('/admin/');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}



module.exports = {
    loadLogin,
    loadDashboard,
    graph,
    listUsers,
    updateUserStatus,
    categoryDetails,
    updatedCategory,
    orderDetails,
    singleView,
    updateStatus,
    logout,
    adminVerify
}