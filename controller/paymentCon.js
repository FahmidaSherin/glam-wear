
const Razorpay = require('razorpay')
const instance = require('../config/razorpay')
const Order = require('../model/orderModel')
const Cart = require('../model/cartModel')
const User = require('../model/userModel')
const Product = require('../model/productModel')
const Address = require('../model/addressModel')
const crypto = require('crypto')
const mongoose = require('mongoose')
const Wallet = require('../model/walletModel')
const Coupon = require('../model/couponModel')
const orderModel = require('../model/orderModel')




const razorpayPayment = async (req, res) => {
    try {
        const { user, amount, deliveryAddress, couponCode } = req.body;
        console.log('Request Body:', req.body);
        console.log('Coupon Code:', couponCode);



        if (!user || !amount) {
            return res.status(400).json({ success: false, msg: 'Invalid request parameters' });
        }

        const userId = req.session.user_id;
        console.log('Session user ID:', userId)


        if (!mongoose.Types.ObjectId.isValid(user)) {
            return res.status(400).json({ success: false, msg: 'Invalid User ID' });
        }

        const addressCheck = await Address.findOne({ _id: deliveryAddress });
        console.log('Address Check:', addressCheck);

        if (!addressCheck) {
            return res.status(400).json({ success: false, msg: 'Address not found' });
        }

        const userDoc = await User.findOne({ _id: user });
        console.log('User Doc:', userDoc);

        if (!userDoc) {
            return res.status(400).json({ success: false, msg: 'User not found' });
        }

        let discount = 0;
        let finalAmount = amount;
        let coupon = null;
        const shippingCharge = 100;
       

        if (couponCode) {
            console.log('Coupon code provided, processing...');
            coupon = await Coupon.findOne({ code: couponCode });
            if (coupon) {
                console.log('Coupon found:', coupon);
                const currentDate = new Date();
                if (coupon.expirationDate < currentDate || !coupon.status) {
                    return res.status(400).json({ success: false, msg: 'Coupon expired or inactive' });
                }
                if (amount < coupon.minOrderValue) {
                    return res.status(400).json({ success: false, msg: `Minimum order value for this coupon is ${coupon.minOrderValue}` });
                }

                if (coupon.discountType === 'percentage') {
                    console.log('coupon.discountType === percentage', coupon.discountType);
                    discount = (amount * coupon.discountValue) / 100;
                } else if (coupon.discountType === 'fixed') {
                    console.log('coupon.discountType === fixed', coupon.discountType);

                    discount = coupon.discountValue;
                }

                finalAmount = Math.max(amount - discount, 0);
                console.log(`Coupon applied. Discount: ${discount}, Final Amount: ${finalAmount}`);
            } else {
                console.log('Invalid coupon code');
                return res.status(400).json({ success: false, msg: 'Invalid coupon code' });
            }
        }

        
        finalAmount += shippingCharge;

        const amountInPaise = finalAmount * 100;

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: 'muhammedmhdt@gmail.com1' + Date.now()
        };

        const order = await instance.orders.create(options);

        const responseData = {
            success: true,
            msg: 'Order Created',
            orderId: order.id,
            amount: finalAmount,
            key_id: process.env.RAZORPAY_ID_KEY,
            name: userDoc.name,
            email: userDoc.email
        };

        console.log('Response Data:', responseData);
        res.status(200).json(responseData);

    } catch (error) {
        console.error('Error in Razorpay order creation:', error.message);
        res.status(500).json({ success: false, msg: 'Internal Server Error' });
    }
};


const verifypayment = async (req, res) => {
    console.log('inside the verifypayment');

    try {
        console.log('req.body.....................', req.body);

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body


        const data = razorpay_order_id + "|" + razorpay_payment_id;
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
            .update(data.toString())
            .digest("hex");


        console.log('Secret Key:', process.env.RAZORPAY_SECRET_KEY);



        if (razorpay_signature === generated_signature) {

            res.status(200).json({ success: true, message: 'Payment is successful', razorpay_payment_id })

        } else {
            await Order.updateOne({ orderId: razorpay_order_id }, { paymentStatus: 'pending' });
            console.log('Signature verification failed');
            res.status(400).json({ success: false, message: 'Payment verification failed' })

        }
    } catch (error) {
        await Order.updateOne({ orderId: req.body.razorpay_order_id }, { paymentStatus: 'pending' });
        console.error('Error in verifying payment :', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}


// retryPayment from orderPage

const rezorpayRetry = async (req, res) => {
    try {
        const { id } = req.body;
        const Order = await orderModel.findOne({ _id: id }).populate("userId");

        const shippingCharge = 100;
        const totalAmount = Order.finalAmount 

        const options = {
            amount: totalAmount*100,
            currency: 'INR',
            receipt: 'muhammedmhdt@gmail.com1' + Date.now()
        };

        const order = await instance.orders.create(options);
        const responseData = {
            success: true,
            msg: 'Order Created',
            orderId: order.id,
            amount: totalAmount,
            key_id: process.env.RAZORPAY_ID_KEY,
            name: Order.userId.name,
            email: Order.userId.email,
            ok:true
        };

        console.log('Response Data:', responseData);
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error in Razorpay order creation:', error.message);
        res.status(500).json({ success: false, msg: 'Internal Server Error' });
    }
}



// amount credit into wallet using razorpay

const razrpywllt = async (req, res) => {

    try {

        const { user, amount } = req.body;
        console.log('Request Body razrpywllt:', req.body);

        if (!user || !amount) {
            return res.status(400).json({ success: false, msg: 'Invalid request parameters' });
        }

        if (!mongoose.Types.ObjectId.isValid(user)) {
            return res.status(400).json({ success: false, msg: 'Invalid User ID' });
        }

        const userDoc = await User.findOne({ _id: user });
        if (!userDoc) {
            return res.status(400).json({ success: false, msg: 'User not found' });
        }

        const amountInPaise = amount * 100;
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: 'muhammedmhdt@gmail.com1' + Date.now()
        };


        const order = await instance.orders.create(options);
        if (!order) {
            return res.status(500).json({ success: false, msg: 'Failed to create order' });
        }

        const responseData = {
            success: true,
            msg: 'Order Created',
            orderId: order.id,
            amount: amountInPaise,
            key_id: process.env.RAZORPAY_ID_KEY,
            name: userDoc.name,
            email: userDoc.email
        };

        console.log('Response Data razrpywllt:', responseData);

        res.status(200).json(responseData);

    } catch (error) {
        console.error('Error in razorpayPayment:', error.message);
        res.status(500).json({ success: false, msg: 'Internal Server Error' });
    }
};

const vrfywllt = async (req, res) => {

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;


        const data = razorpay_order_id + "|" + razorpay_payment_id;

        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
            .update(data.toString())
            .digest("hex");

        if (razorpay_signature === generated_signature) {

            res.status(200).json({ success: true, message: 'Payment is successful', razorpay_payment_id });
        } else {

            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {

        console.error('Error in verifying payment:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// add amount into wallet

const walletAdd = async (req, res) => {

    try {
        console.log('try case in walletAdd');
        console.log('req.body in wlletAdd', req.body);

        const addMoney = parseFloat(req.body.amount);

        if (isNaN(addMoney) || addMoney <= 0) {
            return res.status(400).send('Invalid amount');
        }


        console.log('Wallet', Wallet);

        let wallet = await Wallet.findOne({ userId: req.body.user });

        if (!wallet) {
            wallet = new Wallet({
                userId: req.body.user,
                balance: addMoney,
                transaction: [{ amount: addMoney, transactionsMethod: 'Credit', date: new Date() }]
            });
        } else {
            wallet.balance += addMoney;
            wallet.transaction.push({ amount: addMoney, transactionsMethod: 'Credit', date: new Date() });
        }

        await wallet.save();


        return res.status(200).json({ success: true, msg: 'Money added successfully', newBalance: wallet.balance });
    } catch (error) {
        console.error('Error updating wallet:', error);
        return res.status(500).json({ success: false, msg: 'Internal Server Error' });
    }
};

const generateUniqueOrderId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
};


const walletView = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ userId: req.session.user_id });
        const userID = req.session.user_id;
        if (!wallet) {
            return res.render('users/wallet', { wallet: { balance: 0, transaction: [] }, userID, currentPage: 1, totalPages: 1, limit: 5  });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5; 
        const skip = (page - 1) * limit;

        const totalTransactions = wallet.transaction.length;
        const paginatedTransactions = wallet.transaction
        .sort((a, b) => b.date - a.date)
        .slice(skip, skip + limit);

        const totalPages = Math.ceil(totalTransactions / limit);

        
        res.render('users/wallet', { wallet: { balance: wallet.balance, transaction: paginatedTransactions },
            userID,
            currentPage: page,
            totalPages,
            limit,
         });
    } catch (error) {
        console.error(error);
    }
};



// wallet payment


const placeOrderWallet = async (req, res) => {
    console.log('inside the placeOrder wallet');
    try {
        console.log('inside thetry case of  placeOrder wallet');
        const { deliveryAddress, couponCode } = req.body;
        console.log('req.body in walletPlaceOrder>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', req.body);
        const userId = req.session.user_id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const wallet = await Wallet.findOne({ userId: userId });
        console.log('wallet in walletPlaceOrder>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', wallet);
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        const cartItems = await Cart.find({ userId: userId }).populate('productId');
        console.log('cartItems in walletPlaceOrder>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', cartItems);
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        const orderedItems = cartItems.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            price: item.productId.offerPrice || item.productId.price,
            productName: item.productId.name
        }));

        let subtotal = 0;
        let discount = 0;
        let finalOrderAmount = 0;
        let coupon = null;
        const shippingCharge = 100;

        orderedItems.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        // Debugging: Log subtotal
        console.log('Subtotal:', subtotal);

        if (couponCode) {
            console.log('inside the if (couponCode) case of placeOrder wallet');
        
            coupon = await Coupon.findOne({ code: couponCode });
            if (coupon) {
                const currentDate = new Date();
                
                // Check if coupon is valid
                if (coupon.expirationDate < currentDate || !coupon.status) {
                    return res.status(400).json({ message: 'Coupon expired or inactive' });
                }
        
                // Check if the order meets the minimum order value requirement
                if (subtotal < coupon.minOrderValue) {
                    return res.status(400).json({ message: `Minimum order value for this coupon is ${coupon.minOrderValue}` });
                }
        
                // Calculate discount based on the coupon type
                if (coupon.discountType === 'percentage') {
                    if (!isNaN(coupon.discountValue) && coupon.discountValue > 0) {
                        discount = (subtotal * coupon.discountValue) / 100;
                    } else {
                        return res.status(400).json({ message: 'Invalid discount value for percentage coupon' });
                    }
                } else if (coupon.discountType === 'fixed') {
                    if (!isNaN(coupon.discountValue) && coupon.discountValue > 0) {
                        discount = coupon.discountValue;
                    } else {
                        return res.status(400).json({ message: 'Invalid discount value for fixed coupon' });
                    }
                } else {
                    return res.status(400).json({ message: 'Invalid coupon type' });
                }
        
                // Ensure discount does not exceed the maximum allowed by the coupon
                discount = Math.min(discount, coupon.maxDiscount || discount);
            } else {
                return res.status(400).json({ message: 'Invalid coupon code' });
            }
        }
        // Apply discount and add shipping charge
        finalOrderAmount = subtotal - discount + shippingCharge;

        // Debugging: Log values
        console.log('Discount:', discount);
        console.log('Final Order Amount (before shipping):', subtotal - discount);
        console.log('Final Order Amount (after shipping):', finalOrderAmount);
        console.log('Wallet Balance:', wallet.balance);

        if (wallet.balance < finalOrderAmount) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        wallet.balance -= finalOrderAmount;
        wallet.transaction.push({
            amount: finalOrderAmount,
            transactionsMethod: 'Debit',
            remarks: 'Order Payment'
        });

        for (let item of orderedItems) {
            const { productId, quantity } = item;
            await Product.updateOne({ _id: productId }, { $inc: { quantity: -quantity } });
        }

        const order = new Order({
            orderUniqueId: generateUniqueOrderId(),
            userId: userId,
            orderedItem: orderedItems,
            orderAmount: subtotal,
            discountAmount: discount,
            finalAmount: finalOrderAmount,
            totalAmount: subtotal,
            deliveryAddress: deliveryAddress,
            paymentMethod: 'wallet',
            orderStatus: 'processing',
            deliveryDate: null,
            shippingDate: new Date(),
            coupons: coupon ? coupon._id : null,
            shippingCharge: shippingCharge,
            paymentStatus: 'paid'
        });

        await order.save();
        await wallet.save();

        if (coupon) {
            coupon.usedBy.push(userId);
            await coupon.save();
        }

        await Cart.deleteMany({ userId: userId });

        res.json({ success: true, orderId: order._id });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};




module.exports = {
    razorpayPayment,
    verifypayment,

    razrpywllt,
    vrfywllt,
    walletView,
    walletAdd,
    placeOrderWallet,
    rezorpayRetry
}