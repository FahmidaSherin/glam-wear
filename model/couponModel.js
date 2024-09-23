const mongoose = require('mongoose')
const couponSchema = new mongoose.Schema({

    code : {
        type : String,
        required : true,
        unique:true

    },
    discountType : {
        type : String,
        enum : ['percentage','fixed'],
        required:true
    },
    discountValue : {
        type : Number,
        required : true
    },
    minOrderValue : {
        type : Number,
        default : 0
    },
    expirationDate :{
        type : Date,
        required : true
    },
    status : {
        type : Boolean,
        default : true
    },
    couponName :{
        type : String,
        required : true
    },
    usedBy: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
},{timestamps : true})


module.exports = mongoose.model('Coupon',couponSchema)
