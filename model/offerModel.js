const mongoose = require('mongoose')


const offerSchema = new mongoose.Schema({
    offerName : {
        type : String,
        required:true
    },
    discountValue : {
        type : Number,
        required:true
    },
    startDate : {
        type:Date,
        required : true
    },
    endDate : {
        type : Date,
        required : true
    },
    offerType : {
        type : String,
        enum : ['Category','Product','Referral'],
        required :true
    },
    productId : [{
        type : mongoose.Schema.Types.ObjectId,
        ref:'Product'
    }],
    categoryId : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Category'
    }]
},{
    timestamps: true
})


module.exports = mongoose.model('Offer',offerSchema)