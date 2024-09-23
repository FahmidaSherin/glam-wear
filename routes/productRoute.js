const express = require ('express')
const product_route = express()
const productController = require ('../controller/productCon')
const multer=require('multer')
const path = require('path')
const fs = require('fs');



product_route.use(express.static('public'))
product_route.use (express.json())
product_route.use (express.urlencoded ({extended:true}))
product_route.set('view engine','ejs')
// product_route.set('views','./views/admin');

product_route.set('views', path.join(__dirname, '../views/admin'));


const storage=multer.diskStorage({
    destination:function(req,file,cb){
       cb(null,path.join(__dirname,'../public/upload'))
    },
    filename:function(req,file,cb){
        const name=Date.now()+'-'+file.originalname;
        cb(null,name)
    }
 })  

 const upload=multer({storage:storage })







product_route.get ('/products',productController.productLists)
product_route.get ('/addProduct',productController.productsLoad)
product_route.post('/addProduct',upload.array('image',4),productController.addProducts)
product_route.get('/editProduct',productController.editLoad)
product_route.post('/editProduct/:productId',upload.array('image',4),productController.editProduct)
// product_route.post('/addimgedit',productController.addimgedit)
product_route.delete('products/images/:imageName',productController.deleteEditProduct)
product_route.delete('/products/:id', productController.deleteProduct);
product_route.post('/products/:id/updateStatus', productController.updateProductStatus);





module.exports = product_route