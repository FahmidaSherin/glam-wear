
const mongoose=require('mongoose')
const Cart = require('./model/cartModel')


const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;



require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/MyProject')

const express=require('express')
 const session = require('express-session');

const path=require('path')

const flash = require('connect-flash')
const noCache=require('nocache')
const app=express();

app.use(noCache())
app.use(session({
    secret:'sessionSecret',
    resave:false,
    saveUninitialized:false
}))
app.use(flash())



app.set('view engine','ejs')



app.set('views', path.join(__dirname, './views'));
app.use(express.static(path.join(__dirname,'public')))
app.use(express.json());
app.use(express.urlencoded({extended:true}))


app.use(async (req, res, next) => {
    res.locals.cartCount = 0; 

    if (req.session.user_id) {
        try {
            const cartItems = await Cart.find({ userId: req.session.user_id });
            res.locals.cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
            
        } catch (error) {
            console.error('Error fetching cart count:', error);
        }
    }

    next();
});


const adminRoute=require('./routes/adminRoute')
const userRoutes = require('./routes/userRoute');
const categoryRoute = require('./routes/categoryRoute');

const productRoute = require('./routes/productRoute');
app.use('/', userRoutes);
app.use('/admin',adminRoute);
app.use('/admin',categoryRoute)
app.use('/admin',productRoute)


app.use((err,res,next)=>{
    res.status(404).render('users/error.ejs')
})

app.listen(3000, () => console.log('It\'s running '));
