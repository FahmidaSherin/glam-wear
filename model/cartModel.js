const mongoose = require ('mongoose')

const cartSchema = new mongoose.Schema({

    productId: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Product',
        required : true
    },
    quantity: {
        type : Number,
        default: 1,
        min : [1]
    },
    price : {
        type : Number, 
        required:true
    },
    userId : {
        type : mongoose.Schema.Types.ObjectId, 
        required : true
    }
    

})

module.exports = mongoose.model('Cart',cartSchema)