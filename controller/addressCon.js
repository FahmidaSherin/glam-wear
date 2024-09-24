const User = require('../model/userModel')
const Address = require('../model/addressModel')
const Cart = require('../model/cartModel')
const Product = require('../model/productModel')
const Order = require('../model/orderModel')
const Coupon = require('../model/couponModel')
const Wallet = require('../model/walletModel')
const validate = require('../middleware/validate')





//  Address load

const addressLoad = async (req, res) => {
    const id = req.session.user_id
    const user = await User.findById({ _id: id })

    const address = await Address.find({ user: id })
    try {
        res.render('users/address', { user: user, address: address })

    } catch (error) {
        console.log(error.message);
    }
}


// addAddress Load

const addAddressLoad = async (req, res) => {

    try {
        const id = req.session.user_id
        const user = await User.findById({ _id: id })
        return res.render('users/addAddress', { user: user })
    } catch (error) {
        console.log(error.message);
    }
}


// Add Address in address page

const addAddress = async (req, res) => {
    try {


        const newAddress = new Address({
            user: req.session.user_id,
            name: req.body.name,
            mobile: req.body.mobile,
            streetAddress: req.body.streetAddress,
            city: req.body.city,
            state: req.body.state,
            postalCode: req.body.postalCode,
            locality: req.body.locality,
            landmark: req.body.landmark,
            alterPhone: req.body.alterPhone,
            addressType: req.body.addressType
        })

        await newAddress.save()

        res.redirect('/address')

    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).send('Internal Server Error');
    }
}



// Edit Address pageLoad

const editAddressLoad = async (req, res) => {
    try {

        const id = req.query.id
        const user_id = req.session.user_id
        const user = await User.findOne({ _id: user_id });
        const address = await Address.findById({ _id: id });
        if (!address) {
            return res.status(404).send('Address not found');
        }
        res.render('users/editAddress', { user: user, address: address })
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}


// Edit Address in address page

const editAddress = async (req, res) => {
    try {
        const userid = req.session.user_id

        const user = await User.findById(userid)
        const id = req.body.id
        const address = await Address.findOne({ _id: id })


        const updateFields = {
            name: req.body.name,
            mobile: req.body.mobile,
            streetAddress: req.body.streetAddress,
            city: req.body.city,
            state: req.body.state,
            postalCode: req.body.postalCode,
            locality: req.body.locality,
            landmark: req.body.landmark,
            alterPhone: req.body.alterPhone,
            addressType: req.body.addressType
        }

        const updateAddress = await Address.findByIdAndUpdate(id, { $set: updateFields }, { new: true })
        res.redirect('/address')
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).send('Internal Server Error');
    }
}



// delete address in address page (profile)

const deleteAddress = async (req, res) => {
    try {
        const id = req.query.id;
        await Address.findByIdAndDelete(id);
        res.redirect('/address');
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).send('Internal Server Error');
    }
};



// show checkoutPage

const loadCheckout = async (req, res) => {
    try {
        await validate(req.session.user_id)

        const userId = req.session.user_id;


        const user = await User.findById(userId);

        const carts = await Cart.find({ userId }).populate('productId');

        const address = await Address.find({ user: userId });


        const wallet = await Wallet.findOne({ userId });

        const walletBalance = wallet ? wallet.balance : 0;

        const totalPrice = carts.reduce((acc, cartItem) => {
            const price = cartItem.productId.offerPrice || cartItem.productId.price;
            return acc + (price * cartItem.quantity);
        }, 0);


        const discount = req.session.discount || 0;
        const finalAmount = totalPrice - discount;

        res.render('users/checkout', {
            userId, address, user, cart: carts,
            totalPrice, finalAmount, discount,
            walletBalance
        });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};



//  Add Address in Checkout page

const checkoutAddress = async (req, res) => {
    try {
        const newAddress = new Address({
            user: req.session.user_id,
            name: req.body.name,
            mobile: req.body.mobile,
            streetAddress: req.body.streetAddress,
            city: req.body.city,
            state: req.body.state,
            postalCode: req.body.postalCode,
            locality: req.body.locality,
            landmark: req.body.landmark,
            alterPhone: req.body.alterPhone,
            addressType: req.body.addressType
        })

        await newAddress.save()

        res.redirect('/checkout')

    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).send('Internal Server Error');
    }
}



// Display the address details if the address exists in the database; it will show the address here

const getAddressDetails = async (req, res) => {
    try {
        const addressId = req.query.id;
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }
        res.json(address);
    } catch (error) {
        console.error('Error fetching address details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



// edit Address in chackloutpage

const editCheckout = async (req, res) => {
    try {
        const addressId = req.body.addressId;
        const updateFields = {
            name: req.body.name,
            mobile: req.body.mobile,
            streetAddress: req.body.streetAddress,
            city: req.body.city,
            state: req.body.state,
            postalCode: req.body.postalCode,
            locality: req.body.locality,
            landmark: req.body.landmark,
            alterPhone: req.body.alterPhone,
            addressType: req.body.addressType
        };
        const updatedAddress = await Address.findByIdAndUpdate(addressId, updateFields, { new: true });
        res.status(201).json(updatedAddress);
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




// load Thankyou page

const loadThenkyou = async (req, res) => {

    const orderId = req.query.orderId;
    try {
        const order = await Order.findOne({ _id: orderId })
            .populate({
                path: 'orderedItem.productId',
                select: 'name image'
            });

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('users/thankyou', { order });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};



// for create unique id

const generateUniqueOrderId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


const placeOrder = async (req, res) => {
    try {

        const { deliveryAddress, paymentMethod, couponCode, paymentStatus } = req.body;

        const userId = req.session.user_id;
        const cart = await Cart.find({ userId }).lean();

        if (!cart || cart.length === 0) {
            return res.redirect('/cart?message=Your cart is empty');
        }

        const orderedItems = cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.offerPrice ? item.offerPrice : item.price,
        }));


        for (let item of orderedItems) {
            const { productId, quantity } = item;
            await Product.updateOne({ _id: productId }, { $inc: { quantity: -quantity } });
        }

        const orderAmount = cart.reduce((acc, item) => {
            return acc + (item.price * item.quantity);
        }, 0);


        let subtotal = 0
        let discount = 0;
        let finalAmount = 0;
        let coupon = null;
        const shippingCharge = 100;

        orderedItems.forEach(item => {
            subtotal += item.price * item.quantity;
        });


        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode });
            if (coupon) {
                const currentDate = new Date();
                if (coupon.expirationDate < currentDate || !coupon.status) {
                    return res.status(400).json({ message: 'Coupon expired or inactive' });
                }
                if (subtotal < coupon.minOrderValue) {
                    return res.status(400).json({ message: `Minimum order value for this coupon is ${coupon.minOrderValue}` });
                }

                if (coupon.discountType === 'percentage') {
                    discount = (subtotal * coupon.discountValue) / 100;

                } else if (coupon.discountType === 'fixed') {
                    discount = coupon.discountValue;
                }

                finalAmount = Math.max(subtotal - discount, 0);

            } else {
                return res.status(400).json({ message: 'Invalid coupon code' });
            }
        } else {
            finalAmount = subtotal;
        }

        finalAmount += shippingCharge;


        let finalPaymentStatus = paymentStatus;

        if (!paymentStatus) {
            // Set payment status to 'pending' for 'Cash on Delivery' and 'razorpay'
            if (paymentMethod === 'cash_on_delivery') {
                finalPaymentStatus = 'pending';
            } else if (paymentMethod === 'walletpayment') {
                finalPaymentStatus = 'paid';
            } else if (paymentMethod === 'razorpay') {
                finalPaymentStatus = 'pending'; // Assuming Razorpay status is pending until payment is verified
            }
        }

        const order = new Order({
            orderUniqueId: generateUniqueOrderId(),
            userId: userId,
            orderedItem: orderedItems,
            orderAmount: subtotal,
            discountAmount: discount,
            finalAmount: finalAmount,
            totalAmount: orderAmount,
            deliveryAddress: deliveryAddress,
            paymentMethod: paymentMethod,
            orderStatus: 'processing',
            deliveryDate: null,
            shippingDate: new Date(),
            coupons: coupon ? coupon._id : null,
            paymentStatus: finalPaymentStatus,
            shippingCharge: shippingCharge
        });


        await order.save();

        if (coupon) {
            coupon.usedBy.push(userId);
            await coupon.save();
        }

        await Cart.deleteMany({ userId: userId });
        res.json({ success: true, order: order._id });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};







module.exports = {
    addressLoad,
    addAddressLoad,
    addAddress,
    editAddressLoad,
    editAddress,
    deleteAddress,

    loadCheckout,
    checkoutAddress,
    getAddressDetails,
    editCheckout,



    placeOrder,
    loadThenkyou
}
