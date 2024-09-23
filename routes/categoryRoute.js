const express = require('express')
const category_route = express()
const categoryController=require ('../controller/categoryCont')

category_route.use(express.json())
category_route.use(express.urlencoded({extended:true}))



category_route.get('/categories',categoryController.categoryList)
category_route.post('/categories',categoryController.addCategory)
category_route.put('/categories/:id/edit', categoryController.editCategory);
category_route.delete('/categories/:id',categoryController.deleteCategory)
category_route.post('/categories/:id/updateStatus',categoryController.updateCategoryStatus)



module.exports= category_route;