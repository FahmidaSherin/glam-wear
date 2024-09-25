const User = require('../model/userModel')
const Otp = require('../model/otpModel')
const bcrypt = require('bcrypt')
const nodemailer = require("nodemailer")
const randomstring = require('randomstring')
const { ObjectId } = require('mongodb')
const Product = require('../model/productModel')
const Category = require('../model/categoryModel')
const Address = require('../model/addressModel')
const Wishlist = require('../model/wishlistModel')
const Cart = require('../model/cartModel')
const passport = require('passport');
const googleStrategy = require('passport-google-oauth20').Strategy
const Offer = require('../model/offerModel')
const Wallet = require('../model/walletModel')
require('dotenv').config()

const securePassword = async (password) => {
    try {

        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}


const loadRegister = async (req, res) => {
    const Refferal = req.query.ref; // Ensure this is defined
    try {
        res.render('users/register', { Refferal }); // Pass Refferal here
    } catch (error) {
        console.error(error); // Log any errors for debugging
        res.status(500).send("Internal Server Error"); // Handle errors
    }
}


// const insertUser = async (req, res) => {
//     try {
//         const spassword = await securePassword(req.body.password)

//         const user = new User({
//             name: req.body.name,
//             email: req.body.email,
//             mobile: req.body.mobile,
//             password: spassword,
//             is_admin: 0
//         })
//         req.session.ref = req.query.ref
//         const email = req.body.email

//         if (!user) {
//             res.render('users/register', { message: "Your registration has failed"})
//         } else {
//             const existingUser = await User.findOne({ email: email })
//             if (existingUser) {
//                 res.render('users/register', { message: "This email is already registered", Refferal: req.session.ref || '' })
//             } else {
//                 if (!email.endsWith('.com')) {
//                     console.log("0");
//                     res.render('users/register', { message: "Email must end with .com", Refferal: req.session.ref || '' })
//                 } else {
//                     const password = req.body.password;
//                     const confirmPassword = req.body.confirmPassword;
//                     if (password !== confirmPassword) {
//                         console.log("1");
//                         res.render('users/register', { message: "Your passwords do not match", Refferal: req.session.ref || '' });
//                     } else {
//                         if (password.length < 4) {
//                             console.log("2");
//                             res.render('users/register', { message: "Password must be at least 4 characters long" , Refferal: req.session.ref || ''});
//                         } else if (!password.match(/[a-z]/i) || !password.match(/[0-9]/) || !password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)) {
//                             console.log("3");
//                             res.render('users/register', { message: "Password must contain at least one letter and one number", Refferal: req.session.ref || '' });
//                         } else {
//                             const userData = await user.save()
//                             req.session.userData = userData;
//                             req.session.user_id = userData._id

//                             const refUserId = req.session.ref;
//                             // Get referrer ID from session
//                             if (refUserId) {

//                                 const referrer = await User.findById(refUserId);

//                                 if (referrer) {

//                                     // Find or create a wallet for the referrer
//                                     let referrerWallet = await Wallet.findOne({ userId: referrer._id });

//                                     if (!referrerWallet) {

//                                         referrerWallet = new Wallet({ userId: referrer._id });
//                                     }
//                                     // Add Rs. 50 to the referrer’s wallet
//                                     referrerWallet.balance += 700;
//                                     referrerWallet.transaction.push({
//                                         amount: 700,
//                                         transactionsMethod: "Refferal",
//                                         remarks: "Bonus for Refferal",
//                                     });
//                                     await referrerWallet.save();
//                                 }
//                             }

//                             const otp = generateOTP()
//                             console.log(otp);
//                             console.log(req.body.name,"name and email", req.body.email)
//                             await sendVerifyMail(req.body.name, req.body.email, otp)
//                             const OTP = new Otp({
//                                 userid: userData._id,
//                                 otp: otp
//                             })
//                             await OTP.save()
                            
//                             delete req.session.ref;
//                             res.redirect('/otp')
//                         }
//                     }
//                 }
//             }
//         }
//     } catch (error) {
//         res.render('users/register', { message: "An error occurred during registration. Please try again." });
//     }
// }



// for send mail


const insertUser = async (req, res) => {
    try {
        const { name, email, mobile, password, confirmPassword } = req.body;
        req.session.ref = req.query.ref;

        if (!name || !email || !mobile || !password || !confirmPassword) {
            return res.render('users/register', { message: "All fields are required", Refferal: req.session.ref || '' });
        }

        if (!/^[a-zA-Z\s]+$/.test(name)) {
            return res.render('users/register', { message: "Name can only contain letters", Refferal: req.session.ref || '' });
        }

        if (!/^\d{10}$/.test(mobile)) {
            return res.render('users/register', { message: "Invalid mobile number", Refferal: req.session.ref || '' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.render('users/register', { message: "Invalid email format", Refferal: req.session.ref || '' });
        }

        if (!email.endsWith('.com')) {
            return res.render('users/register', { message: "Email must end with .com", Refferal: req.session.ref || '' });
        }

        if (password !== confirmPassword) {
            return res.render('users/register', { message: "Your passwords do not match", Refferal: req.session.ref || '' });
        }

        if (password.length < 4) {
            return res.render('users/register', { message: "Password must be at least 4 characters long", Refferal: req.session.ref || '' });
        }
        if (!password.match(/[a-z]/i) || !password.match(/[0-9]/) || !password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)) {
            return res.render('users/register', { message: "Password must contain at least one letter, one number, and one special character", Refferal: req.session.ref || '' });
        }

        const spassword = await securePassword(password);

        const user = new User({
            name,
            email,
            mobile,
            password: spassword,
            is_admin: 0
        });

        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.render('users/register', { message: "This email is already registered", Refferal: req.session.ref || '' });
        }

        const userData = await user.save();
        req.session.userData = userData;
        req.session.user_id = userData._id;

        const refUserId = req.session.ref;
        if (refUserId) {
            const referrer = await User.findById(refUserId);
            if (referrer) {
                let referrerWallet = await Wallet.findOne({ userId: referrer._id });
                if (!referrerWallet) {
                    referrerWallet = new Wallet({ userId: referrer._id });
                }
                referrerWallet.balance += 700;
                referrerWallet.transaction.push({
                    amount: 700,
                    transactionsMethod: "Refferal",
                    remarks: "Bonus for Refferal",
                });
                await referrerWallet.save();
            }
        }

        const otp = generateOTP();
        console.log(otp);
        console.log(req.body.name, "name and email", req.body.email);
        await sendVerifyMail(req.body.name, req.body.email, otp);
        const OTP = new Otp({
            userid: userData._id,
            otp: otp
        });
        await OTP.save();

        delete req.session.ref;
        res.redirect('/otp');

    } catch (error) {
        console.error(error);
        res.render('users/register', { message: "An error occurred during registration. Please try again." });
    }
}


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'shirinmunzz@gmail.com',
        pass: 'semb vfbr noej meyj'
    }
})

const sendVerifyMail = async (name, email, otp) => {
    try {

        // Compose Email
        const mailOption = {
            from: 'shirinmunzz@gmail.com',
            to: email,
            subject: 'Your OTP',
            text: `Your OTP (One-Time Password) is:${otp}`,
        }

        // Send Email
        transporter.sendMail(mailOption, function (error, info) {

            if (error) {
            }
            else {
            }
        })

    } catch (error) {
        console.log(error.message + '   email send');
    }
}



const verifyMail = async (req, res) => {
    try {

        const updateInfo = await User.updateOne({ _id: req.query.id }, { $set: { is_varified: 0 } })
        res.render('email_verified')

    } catch (error) {
        console.log(error.message);
    }
}



const generateOTP = () => {
    return randomstring.generate({
        length: 6,
        charset: 'numeric'
    })
}




const verifyOTP = async (req, res) => {

    try {
        const { otp } = req.body;

        req.session.user_id = req.session.userData;
        const user_id = req.session.user_id;
        if (!user_id) {
            throw new Error("User ID not found in session.");
        }
        const user = await Otp.findOne({ userid: user_id._id });
        if (!user) {
            throw new Error("User not found.");
        }
        if (otp === user.otp) {
            console.log(otp,'otp');
            console.log(user.otp, 'user.otp');
            user.isVerified = true;
            await user.save();
            req.session.user_id = null
            const refUser = req.session.ref;
            delete req.session.ref
            res.redirect('/login');
        } else {
            res.render('users/otp', { error: 'Invalid OTP. Please try again.' });
        }
    } catch (error) {
        console.log("Error in verifyOTP:", error.message);
        res.render('users/otp', { error: 'An error occurred while verifying OTP.' });
    }
};




const resendOTP = async (req, res) => {
    try {
        const newOTP = generateOTP()
        console.log(newOTP, 'resend OTP')
        const user = await User.findOne({ _id: req.session.userData._id })
        const deleteOTP = await Otp.deleteOne({ userid: req.session.userData._id })
        console.log('this is deleteotp',deleteOTP);
        const NOTP = new Otp({
            userid: req.session.userData._id,
            otp: newOTP
        })
        await NOTP.save()
        user.otp = newOTP
        await user.save();

        sendVerifyMail(user.name, user.email, user._id, newOTP)
        res.redirect('/otp')
    } catch (error) {
        console.log('Error in resendOTP');
        res.status(500).send("An error occured while resendin OTP")
    }
}





const otpLoad = (req, res) => {
    try {
        const error = req.flash('error');
        res.render('users/otp', { error });
    } catch (error) {
        console.log(error.message);
    }
}



const loginLoad = (req, res) => {
    try {
        const message = req.flash('message')
        res.render('users/login', { message })
    } catch (error) {
        console.log(error.message);
    }
}



const verifyLogin = async (req, res) => {
    try {
        const err = req.flash('error')
        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({ email: email })

        if (userData) {

            if (userData.is_blocked === 1) {
                req.flash('message', 'you have been blocked')
                return res.redirect('/login')
            }

            const passwordMatch = await bcrypt.compare(password, userData.password)

            if (passwordMatch) {
                req.session.user_id = userData._id
                res.redirect('/userhome')
            }
            else {
                req.flash('message', 'password does not match')
                res.redirect('/login')
            }
        }
        else {
            req.flash('message', 'user not found')
            res.redirect('/login')
        }



    } catch (error) {
        console.log("error in verifyLogin", error);
    }
}



const loadHome = async (req, res) => {
    try {

        const user = req.session.user_id;
        const products = await Product.find({});
        if (user) {
            const userData = await User.findOne({ _id: user })

            const cartItems = await Cart.find({ userId: user })
            const totalCount = cartItems.reduce((total, item) => total + item.quantity, 0)

            const wishlistItems = await Wishlist.find({ userId: user })
            const wishlistCount = wishlistItems.length
            res.render('users/userhome', { user: userData, cartCount: totalCount, wishlistCount: wishlistCount, products })
        } else {
            res.render('users/home', { user: null, products })
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error')
    }
}




const userLogout = async (req, res) => {
    try {
        req.session.user_id = null
        req.session.destroy();
        res.redirect('/home')
    } catch (error) {
        console.log(error.message);
    }
}





const shopLoad = async (req, res) => {
    try {

        const showAll = req.query.showAll === 'true'; // Check if we need to show all products
        const limit = 8;

        const message = req.flash('message');

        const categoryId = req.query.category;

        let productsQuery = { status: true };


        if (categoryId) {

            productsQuery.category = categoryId;
        }
        const query = req.query.q;

        const products = showAll
            ? await Product.find(productsQuery).populate('category').sort({ createdAt: -1 }) // Load all products
            : await Product.find(productsQuery).populate('category').sort({ createdAt: -1 }).limit(limit); // Load limited products

        const totalProducts = await Product.countDocuments(productsQuery);



        if (req.query.q) {
            const query = req.query.q
            const searchRegex = new RegExp(query, 'i')

            products = await Product.find({
                ...productsQuery,
                $or: [
                    { name: searchRegex },
                    { description: searchRegex }
                ]
            })
        }
        const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
        const newProducts = await Product.find({ createdAt: { $gte: oneDayAgo } }).populate('category').limit(10);

        const categories = await Category.find();

        const activeOffers = await Offer.find({
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        const expiredOffers = await Offer.find({
            endDate: { $lt: new Date() }
        });
        // Map offers for quick lookup
        const offersByProductId = {};

        const offersByCategoryId = {};


        activeOffers.forEach(offer => {
            if (offer.offerType === 'Product') {
                offer.productId.forEach(id => {
                    offersByProductId[id] = offer;
                });
            } else if (offer.offerType === 'Category') {
                offer.categoryId.forEach(id => {
                    offersByCategoryId[id] = offer;
                });
            }
        });

        if (expiredOffers.length > 0) {
            for (let expiredOffer of expiredOffers) {
                if (expiredOffer.offerType === 'Product') {
                    const productIds = expiredOffer.productId;
                    await Product.updateMany(
                        { _id: { $in: productIds } },
                        { $unset: { offerPrice: "", appliedOffer: "" } }
                    );
                } else if (expiredOffer.offerType === 'Category') {
                    const categoryIds = expiredOffer.categoryId;
                    await Product.updateMany(
                        { category: { $in: categoryIds } },
                        { $unset: { offerPrice: "", appliedOffer: "" } }
                    );
                }

                // Optionally, you could delete the expired offer if it's no longer needed
                await Offer.findByIdAndDelete(expiredOffer._id);
            }
        }


        // Apply offers to products
        products.forEach(product => {
            if (offersByProductId[product._id]) {
                const offer = offersByProductId[product._id];
                product.offerPrice = product.price - (product.price * offer.discountValue / 100);
                product.appliedOffer = offer._id;
            }
            else if (offersByCategoryId[product.category._id]) {
                const offer = offersByCategoryId[product.category._id];
                product.offerPrice = product.price - (product.price * offer.discountValue / 100);
                product.appliedOffer = offer._id;
            } else {
            }
        });



        const userId = req.session.user_id;
        let cartCount = 0;

        if (userId) {
            const cartItems = await Cart.find({ userId });
            cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
        }

        res.render('users/shop', {
            products, newProducts, message, categories, query: '', cartCount, query: req.query?.q, totalProducts,
            showAll,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


// single product load

const singleProductLoad = async (req, res) => {
    try {
        const productId = req.params.productId
        const product = await Product.findById(productId).populate('category');
        const products = await Product.find()
        res.render('users/singleProduct', { product, products })

    } catch (error) {
        console.log(error.message)
    }
}




const profileLoad = async (req, res) => {
    try {
        const user = req.session.user_id;
        const userData = await User.findById({ _id: user });
        res.render('users/profile', { user: userData });
    } catch (error) {
        console.log(error.message);
    }
}



//  edit ProfileLoad

const editProfileLoad = async (req, res) => {
    try {

        const id = req.session.user_id;
        const user = await User.findById({ _id: id });
        if (!user) {
            return res.status(400).send('User not found');
        }


        res.render('users/editProfile', { user: user });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};



//  Profile updated

const updateProfile = async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(401).send('User not authenticated');
        }
        const { name, email, mobile } = req.body;
        const user = await User.findById(req.session.user_id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        user.name = name;
        user.mobile = mobile;

        await user.save();
        res.redirect('/profile');
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).send('Internal Server Error');
    }
};



// AccountDetails Load

const accountDetailsLoad = async (req, res) => {
    try {
        res.render('users/accountDetails')
    } catch (error) {
        console.log(error.message);
    }
}



const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body
        if (newPassword !== confirmNewPassword) {
            return res.status(400).send('New password and confirm new password do not match');
        }
        const userid = req.session.user_id
        const user = await User.findById(userid)
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).send('Current password is incorrect');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        await user.save()
        res.redirect('/accountDetails')
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).send('Internal Server Error');
    }
}


// load wishlist

const wishList = async (req, res) => {

    try {

        const userId = req.session.user_id

        const wishlist = await Wishlist.find({ userId }).populate('productId')
        res.render('users/wishlist', { userId: userId, wishlist: wishlist })

    } catch (error) {
        console.log('wishlist page load error');
    }
}



const addToWishlist = async (req, res) => {

    try {

        const { productId } = req.body
        const userId = req.session.user_id

        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }
        const existingWishlistItem = await Wishlist.findOne({ productId, userId })

        if (existingWishlistItem) {
            return res.status(200).json({ message: 'Product is already in your wishlist' })
        }
        const newWishlistItem = new Wishlist({
            productId,
            userId
        })
        await newWishlistItem.save()

        const stockStatus = product.quantity > 0 ? 'In Stock' : 'Out of Stock'

        return res.status(201).json({
            message: 'Product added to your wishlist ',
            stockStatus: stockStatus
        })
    } catch (error) {
        console.error('Error adding product to wishlist :', error);
        return res.status(500).json({ message: 'An error occured while adding the product to your wishlist' })

    }
}


const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body
        const userId = req.session.user_id

        await Wishlist.findOneAndDelete({ productId, userId })

        res.json({ status: true, message: 'Product removed from your wishlist' })
    } catch (error) {
        console.error('Error removing prodcut from wishlist :', error);
        res.status(500).json({ status: false, message: 'An error occurred while removing the product from your wishlist' })

    }
}


const contacts = async (req, res) => {
    try {
        res.render('users/contact')
    } catch (error) {
        console.error('Error removing prodcut from wishlist :', error);
        res.status(500).json({ status: false, message: 'An error occurred while rendering the contact page' })
    }
}




module.exports = {
    loginLoad,
    loadRegister,
    insertUser,
    verifyLogin,
    userLogout,
    insertUser,
    loadHome,
    otpLoad,
    verifyMail,
    verifyOTP,
    resendOTP,
    sendVerifyMail,

    shopLoad,
    singleProductLoad,

    profileLoad,
    editProfileLoad,
    updateProfile,
    accountDetailsLoad,
    changePassword,

    wishList,
    addToWishlist,
    removeFromWishlist,

    contacts

}