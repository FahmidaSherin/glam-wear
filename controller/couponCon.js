const Coupon = require ('../model/couponModel')
const Cart = require ('../model/cartModel')
const User = require ('../model/userModel')

const coupons = async (req,res)=>{
    
    try {
    const coupons = await Coupon.find()
       res.render ('coupons',{ coupons }) 
    } catch (error) {

        console.error('Server error');
        
    }
}


const addCouponsLoad = async (req,res)=>{
    
    try {

        res.render('addCoupons')
    } catch (error) {

        console.error('Server error');
        
    }
    
}


const generateUniqueCode = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase(); 
};

const addCoupons = async (req,res)=>{

    try {

        const {couponName, discountType, discountValue, minOrderValue, maxDiscount, expirationDate, status}=req.body

        let couponCode
        let isUnique = false 
        while (!isUnique) {
            couponCode = generateUniqueCode();
            const existingCoupon = await Coupon.findOne({ code: couponCode });
            if (!existingCoupon) {
                isUnique = true;
            }
        }

        const newCoupon = new Coupon ({
            couponName,
            code : couponCode,
            discountType,
            discountValue: Number(discountValue),
            minOrderValue: Number(minOrderValue),
            maxDiscount: Number(maxDiscount),
            expirationDate:  new Date(expirationDate),
            status: status === 'true'
        })

        await newCoupon.save()
        res.redirect('/admin/coupons')
    } catch (error) {

        console.error('Server Error');
        console.error('Error adding coupon:', error);
        res.status(500).send('Server Error');
    }
}

const editCouponsLoad =async (req,res)=>{
    try {
        const couponId = req.query.couponId;
        const coupon = await Coupon.findById(couponId)
        
        if(!coupon) {
            return res.status(404).send('Coupon not found')
        }
        res.render('editCoupons',{ coupon })
    } catch (error) {
        console.error('Error loading coupon for edit:', error);
        res.status(500).send('Server Error');
        
    }
}



const editCoupons = async (req,res)=>{
    try {
        const couponId = req.params.id
        const {couponName, couponCode, discountType, discountValue, minOrderValue, maxDiscount, expirationDate, status } = req.body

        await Coupon.findByIdAndUpdate(couponId, {
            couponName,
            code : couponCode,
            discountType,
            discountValue : Number(discountValue),
            minOrderValue : Number(minOrderValue),
            maxDiscount : Number (maxDiscount),
            expirationDate : new Date(expirationDate),
            status : status === 'true'
        })
        
        res.redirect('/admin/coupons')

    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).send('Server Error');  
    }
}


const deleteCoupon = async (req, res) => {
    
    try {

        const couponId = req.params.id;
        const deleted = await Coupon.findByIdAndDelete(couponId);
        if (deleted) {
            res.status(200).json({ message: "Deleted successfully" });
        } else {
            res.status(404).json({ message: "Coupon not found" });
        }
    } catch (error) {

        console.error('Error deleting coupon:', error);
        res.status(500).send('Server Error');
    }
};


const applyCoupon = async (req, res) => {
    
    try {
        const { couponCode, totalAmount } = req.body;
        const userId = req.session.user_id; 

        if (!couponCode || !totalAmount || !userId) {
            return res.status(400).json({ message: 'Coupon code, total amount, or user ID missing' });
        }

        const amount = parseFloat(totalAmount);
        
        if (isNaN(amount) || amount <= 0) {

            return res.status(400).json({ message: 'Invalid total amount' });
        }

        const coupon = await Coupon.findOne({ code: couponCode });
        
        if (!coupon) {

            return res.status(404).json({ message: 'Coupon not found' });
        }

        const currentDate = new Date();
        if (coupon.expirationDate < currentDate || !coupon.status) {
            return res.status(400).json({ message: 'Coupon expired or inactive' });
        }

        if (amount < coupon.minOrderValue) {
            return res.status(400).json({ message: `Minimum order value for this coupon is ${coupon.minOrderValue}` });
        }

        if (coupon.usedBy.includes(userId)) {
            return res.status(400).json({ message: 'Coupon has already been used by this user' });
        }

        let discountValue = 0;
        if (coupon.discountType === 'percentage') {
            discountValue = (amount * coupon.discountValue) / 100;

        } else if (coupon.discountType === 'fixed') {
            discountValue = coupon.discountValue;

        }

        const shippingCharge = 100;
        const finalAmount = Math.max(amount - discountValue + shippingCharge, 0);
        
    

        req.session.discount = discountValue;
        
        res.status(200).json({
            message: 'Coupon applied successfully',
            couponId: coupon._id,
            discountValue,
            finalAmount,
            totalPrice: amount,
            shippingCharge  
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};



const availableCoupons = async (req, res) => {
    
    try {
        const { totalAmount } = req.query;
        const currentDate = new Date();

        const userId = req.session.user_id;

        const amount = parseFloat(totalAmount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Invalid total amount' });
        }

        const coupons = await Coupon.find({
            expirationDate: { $gte: currentDate },
            status: true,
            minOrderValue: { $lte: amount },
            usedBy: { $ne: userId } 
        }).select('code discountType discountValue');

        const formattedCoupons = coupons.map(coupon => {
            return {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountDisplay: coupon.discountType === 'percentage' 
                    ? `${coupon.discountValue}%` 
                    : `₹${coupon.discountValue.toFixed(2)}` // Adjust if using different currency
            };
        });

        res.status(200).json({ coupons: formattedCoupons });
    } catch (error) {
        console.error('Error fetching available coupons:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const removeCoupon = async (req,res) => {
    try {
        req.session.discount = null;
        res.status(200).json({ message: 'Coupon removed successfully' });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ message: 'Server Error' });
    }
}
module.exports ={
    coupons,
    addCouponsLoad,
    addCoupons,
    editCouponsLoad,
    editCoupons,
    deleteCoupon,
    applyCoupon,
    availableCoupons,
    removeCoupon

}

