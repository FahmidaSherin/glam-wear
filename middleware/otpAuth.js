const User = require('../model/userModel')


const checkAuthenticated = (req, res, next) => {
    if (req.session.user_id) {
        User.findById(req.session.user_id)
            .then((user) => {
                if (user && user.is_verified) {
                    next();  // Proceed if the user is verified
                } else {
                    res.redirect('/otp');  // Redirect to OTP if not verified
                }
            })
            .catch((err) => {
                console.error(err);
                res.redirect('/login');
            });
    } else {
        res.redirect('/login');
    }
};


module.exports = checkAuthenticated