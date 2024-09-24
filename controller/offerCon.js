const Coupon = require('../model/couponModel')
const Offer = require('../model/offerModel')
const Product = require('../model/productModel')
const Category = require('../model/categoryModel')

const offers = async (req, res) => {
    try {
        const offers = await Offer.find({})
            .populate({
                path: 'productId',
                select: 'name'
            })
            .populate({
                path: 'categoryId',
                select: 'name'
            })
            .exec();
        res.render('offers', { offers })
    } catch (error) {
        console.error('server error')
    }
}

const addOffersLoad = async (req, res) => {

    try {
        const products = await Product.find()
        const categories = await Category.find()
        res.render('addOffers', { products, categories })
    } catch (error) {

        console.error('Server error');

    }

}


const addOffers = async (req, res) => {
    try {
        const { offerName, discount, startDate, endDate, offerType, productId, categoryId } = req.body

        const newOffer = new Offer({
            offerName,
            discountValue: discount,
            startDate,
            endDate,
            offerType,
            productId: offerType === 'Product' ? productId : [],
            categoryId: offerType === 'Category' ? categoryId : []
        })


        await newOffer.save()

        if (offerType === 'Product') {

            const productIds = Array.isArray(productId) ? productId : [productId];
            for (let id of productIds) {
                const product = await Product.findById(id);

                if (!product) {
                    continue;
                }

                const discountedPrice = product.price - (product.price * discount / 100);

                await Product.findByIdAndUpdate(id, {
                    offerPrice: discountedPrice,
                    appliedOffer: newOffer._id
                });
            }
        }

        if (offerType === 'Category') {
            const productsInCategory = await Product.find({ category: { $in: categoryId } });

            for (let product of productsInCategory) {
                const discountedPrice = product.price - (product.price * discount / 100);

                await Product.findByIdAndUpdate(product._id, {
                    offerPrice: discountedPrice,
                    appliedOffer: newOffer._id
                });
            }
        }

        res.redirect('/admin/offers')
    } catch (error) {

        console.error('Server Error');
        console.error('Error adding coupon:', error);
        res.status(500).send('Server Error');
    }
}


const editOffersLoad = async (req, res) => {
    try {
        const offerId = req.query.offerId
        const offer = await Offer.findById(offerId)
            .populate('productId', 'name')
            .populate('categoryId', 'name')
            .exec();
        const products = await Product.find();
        const categories = await Category.find();
        if (!offer) {
            return res.status(404).send('Offer not found')
        }
        res.render('editOffers', { offer, products, categories })
    } catch (error) {
        console.error('Error loading coupon for edit:', error);
        res.status(500).send('Server Error');
    }
}

const editOffers = async (req, res) => {

    try {
        const offerId = req.params.id;
        const { offerName, discount, startDate, endDate, offerType, productId, categoryId } = req.body;

        const offer = await Offer.findByIdAndUpdate(
            offerId,
            {
                offerName,
                discountValue: discount,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                offerType,
                productId: offerType === 'Product' ? productId : null,
                categoryId: offerType === 'Category' ? categoryId : null
            },
            { new: true }
        );

        if (!offer) {
            return res.status(404).send('Offer not found');
        }

        if (offerType === 'Product') {
            const productIds = Array.isArray(productId) ? productId : [productId];
            for (let id of productIds) {
                const product = await Product.findById(id);
                if (!product) {
                    continue;
                }

                const discountedPrice = product.price - (product.price * discount / 100);

                await Product.findByIdAndUpdate(id, {
                    offerPrice: discountedPrice,
                    appliedOffer: offer._id
                });
            }
        }

        if (offerType === 'Category') {
            const productsInCategory = await Product.find({ category: { $in: categoryId } });
            for (let product of productsInCategory) {
                const discountedPrice = product.price - (product.price * discount / 100);

                await Product.findByIdAndUpdate(product._id, {
                    offerPrice: discountedPrice,
                    appliedOffer: offer._id
                });
            }
        }

        res.redirect('/admin/offers');
    } catch (error) {
        console.error('Error inside editOffers:', error);
        res.status(500).send('Internal Server Error');
    }
};


const deleteOffer = async (req, res) => {
    try {
        const offerId = req.params.id

        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        if (offer.offerType === 'Product') {
            const productIds = offer.productId;
            await Product.updateMany(
                { _id: { $in: productIds } },
                { $unset: { offerPrice: "", appliedOffer: "" } }
            );
        }

        if (offer.offerType === 'Category') {
            const categoryIds = offer.categoryId;
            await Product.updateMany(
                { category: { $in: categoryIds } },
                { $unset: { offerPrice: "", appliedOffer: "" } }
            );
        }


        const deleted = await Offer.findByIdAndDelete(offerId)
        if (deleted) {
            res.status(200).json({ message: 'Deleted Successfully' })
        } else {
            res.status(404).json({ message: 'Offer not found' })
        }
    } catch (error) {

        console.error('Error deleting offer:', error);
        res.status(500).send('Server Error');
    }
}


module.exports = {
    offers,
    addOffersLoad,
    addOffers,
    editOffersLoad,
    editOffers,
    deleteOffer
}