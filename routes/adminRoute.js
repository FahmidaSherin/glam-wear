// const { config } = require('dotenv')
const express=require('express')
const path=require('path')


const admin_route=express()


const config=require('../config/config')
const session= require('express-session')
const adminController=require('../controller/adminCon')
const couponcontroller = require ('../controller/couponCon')
const offerController = require('../controller/offerCon')
const salesController = require ('../controller/salesCon')

admin_route.use(session({
    secret:config.sessionSecret,
    resave:false,
    saveUninitialized:true
}))



admin_route.use(express.json())
admin_route.use(express.urlencoded({extended:true}))


admin_route.set('view engine','ejs')
admin_route.set('views', path.join(__dirname, '../views/admin'));


const multer=require('multer')
admin_route.use(express.static('public'))


const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/admin'))
    },
    filename:function(req,file,cb){
        const name=date.now()+'-'+file.originalname;
        cb(null,name)
    }
})

const upload=multer({storage:storage})
const auth=require('../middleware/adminAuth')
const product =require ('../routes/productRoute')

admin_route.get('/',auth.isLogout,adminController.loadLogin)
admin_route.post('/',adminController.adminVerify)
admin_route.get('/dashboard',adminController.loadDashboard)
admin_route.get('/dashboard/graph/value',adminController.graph)
admin_route.get('/custommer', auth.isLogin , adminController.listUsers)
admin_route.patch('/custommer/:id/:action', auth.isLogin, adminController.updateUserStatus)
admin_route.get('/categories',adminController.categoryDetails)
admin_route.get('/order',adminController.orderDetails)
admin_route.get('/singleorderview',adminController.singleView)
admin_route.post('/updatestatus',adminController.updateStatus)
admin_route.post('/logout',auth.isLogin,adminController.logout)
admin_route.get('/logout',auth.isLogin,adminController.logout)

admin_route.get('/coupons',couponcontroller.coupons)
admin_route.get('/addCoupons',couponcontroller.addCouponsLoad)
admin_route.post('/coupons',couponcontroller.addCoupons)
admin_route.get('/editCoupon',couponcontroller.editCouponsLoad )
admin_route.post('/editCoupon/:id',couponcontroller.editCoupons)
admin_route.delete('/coupons/:id', couponcontroller.deleteCoupon)

admin_route.get('/offers',offerController.offers)
admin_route.get('/addOffers',offerController.addOffersLoad)
admin_route.post('/offers',offerController.addOffers)
admin_route.get('/editOffer',offerController.editOffersLoad)
admin_route.post('/editOffer/:id',offerController.editOffers)
admin_route.delete('/offers/:id', offerController.deleteOffer)

admin_route.get('/salesReport', salesController.generateSalesReport)
admin_route.get('/customDateReport', salesController.generateSalesReport);
admin_route.get('/downloadPDF', salesController.downloadPDF)
admin_route.get('/downloadExcel', salesController.downloadExcel)





module.exports= admin_route;

