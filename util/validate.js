const Cart = require('../model/cartModel');
const Product = require('../model/productModel');

const validate = async (userId) => {
    try {
        const cartItems = await Cart.find({ userId }).populate('productId');

        if (cartItems.length > 0) {
            for (const cartItem of cartItems) {
                const product = cartItem.productId;

                // Check if the product exists and meets the conditions (active, in stock, etc.)
                if (!product || product.status === false || product.quantity <= 0 || cartItem.quantity > product.quantity) {
                    // If product is invalid or unavailable, remove it from the cart
                    await Cart.findOneAndDelete({ _id: cartItem._id });
                }
            }
        }
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = validate;
