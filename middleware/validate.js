const Cart = require('../model/cartModel')
const Product = require('../model/productModel')


const validate = async (userId) => {
    try {
        const cart = await Cart.findOne({ userId })

        if(cart & cart.productId.length !== 0) {
            for(const key of cart.productId) {
                const prodcut =await Product.findOne({ _id : key.productId})

                if(!prodcut || prodcut.status == false || prodcut.quantity <=0 || key.quantity <= 0 ) {
                    await Cart.findOneAndUpdate (
                        {userId},
                        {$pull : {productId: key.productId }}
                    )
                }
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = validate;