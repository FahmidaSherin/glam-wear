
const mongoose = require ('mongoose')

const addressSchema = new mongoose.Schema({
    user: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required:true
    },
    name : {
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    streetAddress : {
        type : String,
        required:true
    },
    city : {
        type : String, 
        required:true
    },
    state : {
        type : String, 
        required:true
    },
    postalCode: {
        type: String,
        required: true,
    },
    locality : {
        type: String,
        required:true
    },
    landmark: String,
    alterPhone : String,
    
    addressType: {
        type: String,
        required:true
    },
    status: {
        type:Boolean,
        default:false
    }
})


module.exports = mongoose.model('Address',addressSchema)