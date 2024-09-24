const express = require('express')
const user_route = express.Router()
const session = require('express-session')
const config = require('../config/config')
const auth = require('../middleware/userAuth');
const multer = require('multer')
const path = require('path')
const { sendVerificationEmail, verifyOTP, generateOTP } = require('../controller/userCon');
const productCon = require('../controller/productCon')
const cartCon = require('../controller/cartCon')
const orderCon = require ( '../controller/orderCon')
const paymentCon = require ('../controller/paymentCon')
const CouponCon=require('../controller/couponCon')
const googleLogin = require('../passport-setuo')
const Cart = require('../model/cartModel')
const User = require('../model/userModel')
const Wishlist = require('../model/wishlistModel')
const passport = require('passport')


const userCon = require('../controller/userCon')
const addressCon = require('../controller/addressCon');

user_route.get('/',auth.isLogout,userCon.loadHome)
user_route.get('/home',auth.isLogout,userCon.loadHome)
user_route.get('/userhome',auth.isLogin,auth.isBlocked,userCon.loadHome)

user_route.get('/auth/google', googleLogin.googleAuth);
user_route.get("/auth/google/callback", googleLogin.googleCallback, googleLogin.setupSession);

user_route.get('/register',auth.isLogout, userCon.loadRegister);
user_route.post('/register', userCon.insertUser);

user_route.get('/login',auth.isLogout,userCon.loginLoad)
user_route.post('/login',userCon.verifyLogin)

user_route.get('/logout',auth.isLogin,userCon.userLogout)

 user_route.get('/verify',userCon.sendVerifyMail)
user_route.get('/otp', userCon.otpLoad) 
user_route.post('/verify-otp', userCon.verifyOTP);
user_route.post('/resend-otp',userCon.resendOTP)

user_route.get('/shop', userCon.shopLoad)
user_route.get('/singleProduct/:productId', userCon.singleProductLoad)

user_route.get('/profile',auth.isLogin, userCon.profileLoad)
user_route.get('/editProfile', userCon.editProfileLoad)
user_route.post('/editProfile', userCon.updateProfile)

user_route.get('/address', auth.isLogin,addressCon.addressLoad)
user_route.get('/addAddress',auth.isLogin, addressCon.addAddressLoad)
user_route.post('/addAddress',addressCon.addAddress)
user_route.get('/editAddress',auth.isLogin, addressCon.editAddressLoad)
user_route.post('/editAddress',addressCon.editAddress)
user_route.get('/deleteAddress',auth.isLogin, addressCon.deleteAddress);

user_route.get('/accountDetails',auth.isLogin,userCon.accountDetailsLoad)
user_route.post('/changePassword',userCon.changePassword)
user_route.get('/sortProducts',productCon.sortProducts)

user_route.get('/cart',auth.isLogin,cartCon.cartLoaded)
user_route.post('/cart/add',cartCon.addToCart)
user_route.post('/cart/updateQuantity/:productId',cartCon.updateCartItemQuantity)
user_route.post('/removecart',cartCon.cartRemove)
user_route.get('/cartItemCount',auth.isLogin,cartCon.getCartCount)

user_route.get('/checkout',auth.isLogin,addressCon.loadCheckout)
user_route.post('/checkoutAddress',addressCon.checkoutAddress)
user_route.get('/getAddressDetails',auth.isLogin,addressCon.getAddressDetails)
user_route.post('/editCheckout',addressCon.editCheckout)
  
user_route.post('/placeorderwallet',paymentCon.placeOrderWallet)

user_route.post('/placeOrder', addressCon.placeOrder);
user_route.get('/thankyou',auth.isLogin,addressCon.loadThenkyou)
user_route.get('/orders',  auth.isLogin, orderCon.orderList)
user_route.put('/cancelOrder/:orderId', orderCon.cancelOrder)
user_route.post('/returnOrder',orderCon.returnOrder)
user_route.get('/singleOrder', auth.isLogin, orderCon.viewOrder)
user_route.get('/order-status',orderCon.getOrderStatus)
user_route.get('/download-invoice',orderCon.downloadInvoice)

user_route.post ('/applyCoupon',CouponCon.applyCoupon)
user_route.get('/availableCoupons',CouponCon.availableCoupons)
user_route.post('/removeCoupon', CouponCon.removeCoupon);

user_route.post('/razorpayPayment',paymentCon.razorpayPayment)
user_route.post('/verifypayment',paymentCon.verifypayment)
user_route.post('/rezoerpayRetry',paymentCon.rezorpayRetry);
user_route.post('/paymentStatusChange',orderCon.paymentStatusCheng);
user_route.get('/wallet',paymentCon.walletView)
user_route.post('/addWallet',auth.isLogin,paymentCon.walletAdd)
user_route.post('/razrpywllt',auth.isLogin,paymentCon.razrpywllt)
user_route.post('/vrfywllt',auth.isLogin,paymentCon.vrfywllt)

user_route.get('/wishlist',auth.isLogin,userCon.wishList)
user_route.post('/wishlist',auth.isLogin,userCon.addToWishlist)
user_route.post('/wishlist/remove' , auth.isLogin,userCon.removeFromWishlist)

user_route.get('/search',productCon.search)

user_route.get('/contact',userCon.contacts)




module.exports = user_route;