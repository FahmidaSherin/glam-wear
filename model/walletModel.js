


const mongoose=require('mongoose')

const walletSchema= new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
     },
     balance: {
        type: Number,
        required: true,
        default: 0
     },
     transaction: [{
        
        amount: {
           type: Number,
           required: true
        },
        transactionsMethod: {
           type: String,
           required: true,
           enum: ["Debit", "Razorpay", "Refferal", "Remarks","Refund" ,"Credit"]
        },
        date:{
           type:Date,
           default: Date.now 
        },
        remarks: {  
         type: String,
         default: ''
     }
        
     }]
  
  
  }, {
     timestamps: true
  
})

module.exports=mongoose.model('Wallet',walletSchema)


