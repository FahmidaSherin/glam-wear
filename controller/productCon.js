const User = require('../model/userModel')
const Category = require('../model/categoryModel')
const Product = require('../model/productModel')


const productsLoad = async (req, res) => {
    try {
        const categories = await Category.find({ status: true });
        res.render('addProduct', { Data: categories });
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
}

// Add Products
const addProducts = async (req, res) => {

    try {

        if (!req.files || req.files.length === 0) {
            throw new Error('No files uploaded.');
        }

        const productImages = req.files.map(file => {
            return file.filename
        })
        const { productName, productCategory, productPrice, productQuantity, productSize, productDescription } = req.body;
        const newProduct = new Product({
            name: productName,
            category: productCategory,
            price: productPrice,
            image: productImages,
            quantity: productQuantity,
            size: productSize,
            description: productDescription
        });

        await newProduct.save();
        res.redirect('/admin/products');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error" + error.message);
    }
}

const productLists = async (req, res) => {
    try {
        const pageNumber = parseInt(req.query.page) || 1;
        const pageSize = 5;
        const skip = (pageNumber - 1) * pageSize;
        const Products = await Product.find({}).populate("category").sort({ createdAt: -1 }).skip(skip).limit(pageSize);
        const totalProductsCount = await Product.countDocuments()
        const totalPages = Math.ceil(totalProductsCount / pageSize)
        res.render('products', { Products, currentPage: pageNumber, totalPages });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}




const editLoad = async (req, res) => {
    try {
        const productId = req.query.productId;
        const product = await Product.findById(productId)
        const categories = await Category.find({ status: true })
        res.render('editProduct', { categories, product, productId, i: 0 });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
}




const editProduct = async (req, res) => {

    const productId = req.params.productId;

    const { productName, productCategory, productPrice, productQuantity, productSize, productDescription } = req.body;

    const images = req.files.map(file => file.filename)
    let old = await Product.findOne({ _id: productId });
    let image = []
    for (let i = 0; i < old.image.length; i++) {
        if (old.image[i] !== req.body.kk[i]) {
            images.forEach(e => {
                if (e.split('-')[1] == req.body.kk[i].split('-')[1]) {
                    image[i] = e
                }
            })
        } else {
            image[i] = old.image[i]
        }
    }

    try {

        const updateProduct = await Product.findOneAndUpdate({ _id: productId }, {
            $set:
            {
                name: productName,
                category: productCategory,
                price: productPrice,
                image: image,
                quantity: productQuantity,
                size: productSize,
                description: productDescription,
            }

        }, { new: true })

        if (!updateProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (req.file) {
            updateProduct.image = req.file.filename;
            await updateProduct.save();
        }
        res.redirect('/admin/products')
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}



const deleteEditProduct = async (req, res) => {
    try {
        const imageName = req.params.imageName;
        const imagePath = path.join(__dirname, 'upload', imageName);
        if (fs.existsSync(imagePath)) {
            fs.unlink(imagePath, async (err) => {
                if (err) {
                    console.error('Error deleting image:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                try {
                    const productId = req.params.productId;
                    const product = await Product.findById(productId);
                    if (!product) {
                        return res.status(404).json({ error: 'Product not found' });
                    }
                    product.image = product.image.filter(image => image !== imageName);
                    await product.save();

                    res.status(200).json({ message: 'Image deleted successfully' });
                } catch (error) {
                    console.error('Error updating database:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            });

        } else {
            res.status(404).json({ error: 'Image not found' });
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}




const updateProductStatus = async (req, res) => {

    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        const isConfirmed = req.query.confirm === 'true';

        if (isConfirmed) {
            product.status = !product.status;
            await product.save();
            res.json({ success: true, status: product.status });
        } else {
            res.status(200).json({ success: true, message: "Are you sure you want to update the product status?" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};



const deleteProduct = async (req, res) => {
    try {

        const productId = req.params.id;
        const deleted = await Product.findOneAndDelete({ _id: productId });
        res.status(200).json({ message: "deleted successfully" });

    } catch (error) {
        console.error(error.message)
    }
}



const sortProducts = async (req, res) => {
    try {
        const fetchNewProducts = async () => {
            try {
                const newProducts = await Product.find({ isNew: true }).populate('category');
                return newProducts;
            } catch (error) {
                console.error('Error fetching new products:', error);
                throw error;
            }
        };

        let products = await Product.find().populate('category'); // Ensure products are populated with category
        if (req.query.q) {
            const query = req.query.q;
            const searchRegex = new RegExp(query, 'i');

            products = await Product.find({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex }
                ]
            }).populate('category');
        }

        const newProducts = await fetchNewProducts();
        const { sortBy } = req.query;

        // Sort products based on 'sortBy' query parameter
        if (sortBy === 'az') {
            products = products.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'za') {
            products = products.sort((a, b) => b.name.localeCompare(a.name));
        } else if (sortBy === 'priceLowToHigh') {
            products = products.sort((a, b) => (a.offerPrice || a.price) - (b.offerPrice || b.price));
        } else if (sortBy === 'priceHighToLow') {
            products = products.sort((a, b) => (b.offerPrice || b.price) - (a.offerPrice || a.price));
        }

        const categories = await Category.find();
        const showAll = req.query.showAll === 'true';

        res.render('users/shop', { products, newProducts, categories, query: req.query.q , showAll });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




const search = async (req, res) => {
    try {
        const query = req.query.q
        const searchRegex = new RegExp(query, 'i')

        const showAll = req.query.showAll === 'true';


        const products = await Product.find({
            $or: [
                { name: searchRegex },
                { description: searchRegex }
            ]
        })

        const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
        const newProducts = await Product.find({ createdAt: { $gte: oneDayAgo } }).populate('category').limit(10);
        const categories = await Category.find();

        res.render('users/shop', { products, newProducts, categories, query, showAll })
    } catch (error) {
        console.error('Error during search', error);
        res.status(500).send('Internal Server Error')
    }
}


module.exports = {
    productsLoad,
    addProducts,
    productLists,
    editLoad,
    editProduct,
    deleteEditProduct,
    deleteProduct,
    updateProductStatus,
    sortProducts,
    search

};


