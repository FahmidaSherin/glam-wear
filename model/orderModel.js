const mongoose=require('mongoose')

const orderSchema= new mongoose.Schema({
    orderUniqueId: {
        type: String,
        required: true,
        unique: true 
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    orderedItem:[{
        productId:{
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Product',
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        productStatus:{
            type: String,
            default:"processing",
            required: true
        },
        price:{
            type:Number,
            required:true
        },
        
    }],
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'failed'], 
        default: 'pending',
    },

    orderAmount: {
        type: Number,
        required: true,

    },
    deliveryAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Address",
        required: true,
    },
    orderStatus: {
        type: String,
        required: true,
        default:"processing"
    },
    deliveryDate:{
        type:Date,
        default: null
    },
    shippingDate:{
        type:Date,
        default: Date.now()
    },
    paymentMethod: {
        type: String,
        required: true,
   
    },
    coupons: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon" 
    },
    discountAmount: { 
        type: Number,
        default: 0
    },
    shippingCharge: {  // Added this field
        type: Number,
        default: 100  // Set a default value if needed
    },
    totalAmount: {
        type: Number,
        required: true
    },
    finalAmount: { 
        type: Number,
        required: true
    }
},

{
    timestamps:true

})

module.exports=mongoose.model('Order',orderSchema)