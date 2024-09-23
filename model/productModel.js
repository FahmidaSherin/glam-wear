const mongoose = require('mongoose')
const Category = require('../model/categoryModel')
const productSchema = new mongoose.Schema ({

    name:{
        type:String,
        required:true

    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    offerPrice: {
        type: Number,
    },
    appliedOffer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer' 
    },
    image:{
        type:Array,
        required:true
    },
    size:{
        type:Number,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        default:true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

})

// module.exports = mongoose.model ('Product',productSchema)
const Product = mongoose.model('Product', productSchema);

module.exports = Product;