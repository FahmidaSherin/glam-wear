const User = require('../model/userModel')
const Product = require('../model/productModel')
const Cart = require('../model/cartModel')
const Address = require('../model/addressModel')
const Wishlist = require('../model/wishlistModel')
const validate = require('../middleware/validate')
const { session } = require('passport')





const addToCart = async (req, res) => {
    try {
        const validate = await(req,session.user_id);
        const { productId } = req.body;
        const userId = req.session.user_id;
        const user = await User.findById(userId);

        if (!user) {
            return res.json({ status: false, message: 'User not found' });
        }

        const product = await Product.findById(productId);
        console.log("product", product);
        if (!product) {
            return res.status(404).json({ status: false, message: 'Product not found' });
        }

        if (product.quantity <= 0) {
            return res.status(200).json({ status: false, message: 'Product out of stock' });
        }

        const cartItem = await Cart.findOne({ userId, productId: product._id });

        if (cartItem && cartItem.quantity >= product.quantity) {
            return res.status(200).json({ status: false, message: 'Maximum quantity per person reached' });
        }

        const maxQuantityPerPerson = product.quantity;
        const quantityToAdd = Math.min(1, maxQuantityPerPerson);
        console.log("quantityToAdd", quantityToAdd);

        const priceToAdd = product.offerPrice || product.price;

        const alreadyExist = await Cart.findOne({ userId: userId, productId: productId });
        if (alreadyExist) {
            await Cart.updateOne(
                { userId: userId, productId: productId },
                { $inc: { quantity: quantityToAdd, price: priceToAdd } }
            );
            await Wishlist.deleteOne({ userId: userId, productId: productId });
            return res.json({ status: true, message: 'Product is already in the cart, quantity increased' });
        } else {
            const newCart = new Cart({
                userId: userId,
                productId: productId,
                price: priceToAdd,
                quantity: quantityToAdd
            });

            await newCart.save();
            await Wishlist.deleteOne({ userId: userId, productId: productId });
        }

        res.json({ status: true, message: 'Product added to cart successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// const addToCart = async (req, res) => {
//     try {
//         const { productId } = req.body;
//         const userId = req.session.user_id;

//         if (!userId) {
//             return res.status(401).json({ status: false, message: 'User not authenticated' });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ status: false, message: 'User not found' });
//         }

//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).json({ status: false, message: 'Product not found' });
//         }

//         if (product.quantity <= 0) {
//             return res.status(200).json({ status: false, message: 'Product out of stock' });
//         }

//         const cartItem = await Cart.findOne({ userId, productId: product._id });

//         const maxQuantityPerPerson = product.quantity;
//         const quantityToAdd = Math.min(1, maxQuantityPerPerson);

//         const priceToAdd = product.offerPrice || product.price;

//         if (cartItem) {
//             // Update quantity if it already exists in the cart
//             if (cartItem.quantity + quantityToAdd > maxQuantityPerPerson) {
//                 return res.status(200).json({ status: false, message: 'Maximum quantity per person reached' });
//             }

//             await Cart.updateOne(
//                 { userId: userId, productId: productId },
//                 { $inc: { quantity: quantityToAdd } }
//             );
//             await Wishlist.deleteOne({ userId: userId, productId: productId });

//             return res.json({ status: true, message: 'Product quantity increased in cart' });
//         } else {
//             // Add new item to the cart
//             const newCart = new Cart({
//                 userId: userId,
//                 productId: productId,
//                 price: priceToAdd, // Set the price based on offerPrice or original price
//                 quantity: quantityToAdd
//             });

//             await newCart.save();
//             await Wishlist.deleteOne({ userId: userId, productId: productId });

//             return res.json({ status: true, message: 'Product added to cart successfully' });
//         }
//     } catch (error) {
//         console.error('Error adding to cart:', error);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// };



const cartLoaded = async (req, res) => {
    try {
        const userId = req.session.user_id;
        console.log('userId', userId);
        const carts = await Cart.find({ userId }).populate('productId');
        console.log('carts', carts);

        const cartItemCount = carts.reduce((acc, cartItem) => acc + cartItem.quantity, 0);
        const totalPrice = carts.reduce((acc, cartItem) => {
            const productPrice = cartItem.productId.offerPrice || cartItem.productId.price;
            return acc + (productPrice * cartItem.quantity);
        }, 0);
        console.log('totalPrice', totalPrice);

        res.render('users/cart', { cart: carts, cartItemCount: cartItemCount, totalPrice: totalPrice });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal server error');
    }
};



const updateCartItemQuantity = async (req, res) => {
    console.log('Updating cart item quantity');

    try {
        console.log('inside the try of updateCartItemQuantity');
        
        console.log('req.params',req.params);
        console.log('req.body',req.body);
        
        const { productId } = req.params;
        const { quantity } = req.body;
        const userId = req.session.user_id;

        if (!quantity || quantity <= 0) {
        console.log('inside the try of if  if (!quantity || quantity <= 0) in updateCartItemQuantity');
            
            return res.status(400).json({ status: false, message: 'Invalid quantity' });
        }

        const product = await Product.findById(productId);
        console.log('product in updateCartItemQuantity',product);
        
        if (!product) {
        console.log('inside the try of if  if (!product) in updateCartItemQuantity');

            return res.status(404).json({ status: false, message: 'Product not found' });
        }


        if (quantity > product.quantity) {
        console.log('inside the try of if  if (quantity > product.quantity) in updateCartItemQuantity');

            console.log(`Stock limit exceeded. Available stock: ${product.quantity}, Requested: ${quantity}`);
            return res.json({
                status: false,
                quantity: quantity -1,
                message1: `maximum quantity is reached`,
                availableStock: product.quantity
            });
        }

        const result = await Cart.updateOne(
            { userId, productId },
            { $set: { quantity } }
        );

        if (result.nModified === 0) {
        console.log('inside the try of if  if (result.nModified === 0) in updateCartItemQuantity');

            return res.status(404).json({ status: false, message: 'Cart item not found' });
        }

        const updatedCart = await Cart.find({ userId }).populate('productId');
        const totalPrice = updatedCart.reduce((acc, cartItem) => acc + (cartItem.productId.price * cartItem.quantity), 0);
        const productTotal = updatedCart.find(cartItem => cartItem.productId._id.toString() === productId).productId.price * quantity;

        res.json({
            status: true,
            message: 'Cart item quantity updated successfully',
            cart: updatedCart,
            totalPrice,
            productTotal
        });
    } catch (error) {
        console.log('inside thecatch (error)  in updateCartItemQuantity');

        console.error("Error updating cart item quantity:", error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


// cart Removed

const cartRemove = async (req, res) => {
    try {
        const productId = req.body.productId
        const userId = req.session.user_id

        await Cart.deleteOne({ userId, productId })
        res.json({ status: true })

    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.json({ status: false });
    }
}


const getCartCount = async (req, res) => {
    try {

        const userId = req.session.user_id
        const cartItems = await Cart.find({ userId }).populate('productId')
        const cartCount = cartItems.reduce((count, cartItem) => count + cartItem.quantity, 0)
        const uniqueProductCount = cartItems.length
        res.status(200).json({ cartCount, uniqueProductCount })
    } catch (error) {
        console.error('Error fetching cart count:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}



module.exports = {
    addToCart,
    cartLoaded,
    updateCartItemQuantity,
    cartRemove,
    getCartCount
}