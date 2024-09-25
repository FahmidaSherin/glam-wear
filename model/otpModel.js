const mongoose=require('mongoose')

const OTPSchema=new mongoose.Schema({

    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },

    otp:{
        type:String
    },
    isVerified: {
        type: Boolean,
        default: false // Default to false until verified
    },
    createdAt:{
        type:Date,
        expires:60,
        default:Date.now
    },

})

OTPSchema.index({createdAt:1},{expireAfterSeconds:60})

module.exports=mongoose.model('Otp',OTPSchema)