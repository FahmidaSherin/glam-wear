const Coupon = require ('../model/couponModel')
const Cart = require ('../model/cartModel')
const User = require ('../model/userModel')

const coupons = async (req,res)=>{
    console.log('coupons........');
    
    try {
    console.log('inside the try of coupons........');
    const coupons = await Coupon.find()
       res.render ('coupons',{ coupons }) 
    } catch (error) {
    console.log('inside the catch of coupons........');

        console.error('Server error');
        
    }
}


const addCouponsLoad = async (req,res)=>{
    console.log('inside the addCouponsLoad........');
    
    try {
    console.log('inside the try of addCouponsLoad........');

        res.render('addCoupons')
    } catch (error) {
    console.log('inside the catch of addCouponsLoad........');

        console.error('Server error');
        
    }
    
}


const generateUniqueCode = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase(); 
};

const addCoupons = async (req,res)=>{
    console.log('inside the addCoupons........');

    try {
    console.log('inside the try of addCoupons........');

        const {couponName, discountType, discountValue, minOrderValue, maxDiscount, expirationDate, status}=req.body
console.log('req.body.............',req.body);

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
console.log('newCoupon....',newCoupon);

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
    console.log('inisde deleteCoupon');
    
    try {
    console.log('inisde the try of deleteCoupon');

        const couponId = req.params.id;
        console.log('couponId = ',couponId);
        const deleted = await Coupon.findByIdAndDelete(couponId);
        if (deleted) {
            res.status(200).json({ message: "Deleted successfully" });
        } else {
            res.status(404).json({ message: "Coupon not found" });
        }
    } catch (error) {
    console.log('inisde the cathc of deleteCoupon');

        console.error('Error deleting coupon:', error);
        res.status(500).send('Server Error');
    }
};


const applyCoupon = async (req, res) => {
    console.log('inside applyCoupon ');
    
    try {
    console.log('inside try of applyCoupon ');

        const { couponCode, totalAmount } = req.body;
        const userId = req.session.user_id; 
console.log('req.body in applyCoupon',req.body);

        if (!couponCode || !totalAmount || !userId) {
            console.log('inside if case of  !couponCode || !totalAmount || !userId applyCoupon ');
            return res.status(400).json({ message: 'Coupon code, total amount, or user ID missing' });
        }

        const amount = parseFloat(totalAmount);
        console.log('amount in applyCoupon',amount);
        
        if (isNaN(amount) || amount <= 0) {
            console.log('inside if case of  isNaN(amount) || amount <= 0 applyCoupon ');

            return res.status(400).json({ message: 'Invalid total amount' });
        }

        const coupon = await Coupon.findOne({ code: couponCode });
        console.log('coupon inside applyCoupon',coupon);
        
        if (!coupon) {
            console.log('inside if case of  !coupon applyCoupon ');

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
            console.log(`Percentage discount: ${discountValue}`);

        } else if (coupon.discountType === 'fixed') {
            discountValue = coupon.discountValue;
            console.log(`Fixed discount: ${discountValue}`);

        }

        const shippingCharge = 100;
        const finalAmount = Math.max(amount - discountValue + shippingCharge, 0);
        console.log('finalAmount in applycoupon',finalAmount);
        
    

        req.session.discount = discountValue;
        console.log('   req.session.discount in applyCoupon',   req.session.discount);
        
        res.status(200).json({
            message: 'Coupon applied successfully',
            couponId: coupon._id,
            discountValue,
            finalAmount,
            totalPrice: amount,
            shippingCharge  
        });

    } catch (error) {
        console.log('inside catch of applyCoupon ');
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// const availableCoupons = async (req,res) => {
//     console.log('inside availablecoupons in couponController');
    
//     try {
//         console.log('inside try of availablecoupons in couponController');
//         const { totalAmount } = req.query;
//         const currentDate = new Date()

//         const userId = req.session.user_id

//         const amount = parseFloat(totalAmount);
//         if (isNaN(amount) || amount <= 0) {
//             return res.status(400).json({ message: 'Invalid total amount' });
//         }

//         const coupons = await Coupon.find({
//             expirationDate : {$gte: currentDate},
//             status :true,
//             minOrderValue: { $lte: amount },
//             usedBy: { $ne: userId } 
//         }).select('code code discountType discountValue');

//         console.log('Available coupons:', coupons);
//         res.status(200).json({ coupons });
//     } catch (error) {
//         console.log('inside catch of availablecoupons in couponController');
//         console.error('Error fetching available coupons:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// }

const availableCoupons = async (req, res) => {
    console.log('inside availableCoupons in couponController');
    
    try {
        console.log('inside try of availableCoupons in couponController');
        const { totalAmount } = req.query;
        const currentDate = new Date();

        const userId = req.session.user_id;

        const amount = parseFloat(totalAmount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Invalid total amount' });
        }

        // Fetch coupons that are valid, not expired, and not used by the current user
        const coupons = await Coupon.find({
            expirationDate: { $gte: currentDate },
            status: true,
            minOrderValue: { $lte: amount },
            usedBy: { $ne: userId } 
        }).select('code discountType discountValue');

        // Format the discount display based on the discountType
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

        console.log('Available coupons:', formattedCoupons);
        res.status(200).json({ coupons: formattedCoupons });
    } catch (error) {
        console.log('inside catch of availableCoupons in couponController');
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

