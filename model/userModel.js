const mongoose=require("mongoose")

   const userSchema= new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique: true,
    
    },
    googleId :{
        type:String
    },
    password:{
        type:String,
        required:true
    },
    is_admin:{
        type:Number,
        required:true,
        default:0

    },
    is_varified:{
        type:Number,
        default:0
    },
    is_blocked:{
        type:Number,
        default:0
    },
    token: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports=mongoose.model('User',userSchema)




