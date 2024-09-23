const User = require('../model/userModel')

const Category = require('../model/categoryModel')
const Product = require('../model/productModel')



// Category List

const categoryList = async (req, res) => {
    try {
        const pageNumber = parseInt(req.query.page) || 1;
        const pageSize = 10; 
        const skip = (pageNumber - 1) * pageSize;
        const categories = await Category.find({}).sort({ createdAt: -1}).skip(skip).limit(pageSize)
        res.render('categories', { categories, currentPage: pageNumber })
    } catch (error) {
        console.log(error.message);
    }
}



// Add Category

const addCategory = async (req, res) => {
    try {
        const { categoryName, categoryDescription } = req.body;
        const categoryExist = await Category.findOne({ name: categoryName }).collation({ locale: 'en', strength: 2 });
        console.log('categoryExist',categoryExist);
        if (categoryExist) {
            return res.send({msg:"Category already exists."});
        }
        const newCategory = new Category({
            name: categoryName,
            description: categoryDescription
        });

        const savedCategory = await newCategory.save();
        res.send({status:true});
    } catch (error) { 
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};



// Edit Category

const editCategory = async (req, res) => {
    const categoryId = req.params.id
    const editedName = req.body.name
    const editedDescription = req.body.desc
    console.log(editedDescription);
    try {

        const updateCategory = await Category.findByIdAndUpdate(categoryId,
            { name: editedName, description: editedDescription },
            { new: true });
        console.log(updateCategory);
        console.log(' category edited successfull');
        res.redirect('/admin/categories')
    } catch (error) {
        console.log("error ", error);
        console.log(error.message);
    }
}


const updateCategoryStatus = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);

        console.log('Category:', category);

        category.status = !category.status;
        await category.save();

        await Product.updateMany(
            { category: categoryId },
            { status: category.status }
        );

        res.json({ status: category.status });
    } catch (error) {
           console.error('Backend error:', error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



const deleteCategory = async (req, res) => {
    try {

        const categoryId = req.params.id;
        console.log("deleteion");
        console.log("parmas : ", req.params);
        const deleted = await Category.findOneAndDelete({ _id: categoryId });
        res.status(200).json({ message: "deleted successfully" });

    } catch (error) {
        console.error(error.message)
    }
}




module.exports = {
    categoryList,
    addCategory,
    editCategory,
    deleteCategory,
    updateCategoryStatus
}