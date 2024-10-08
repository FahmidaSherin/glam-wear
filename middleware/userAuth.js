
const User = require('../model/userModel')

const isLogin = async (req, res, next) => {
    try {

        if (req.session.user_id) {
            next()
        }
        else {
            res.redirect('/home')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.redirect('/home')

        } else {
            next()
        }
    } catch (error) {
        console.log(error.message);
    }

}


const isBlocked = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });
        if (!userData) {
            next();
        } else {
            if (userData.is_blocked) {
                req.session.user_id = null;
                res.redirect('/home');
            } else {
                next();
            }
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const isError = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.render('users/error')
        } else {
            next()
        }
    } catch (error) {

    }
}

module.exports = {
    isLogin,
    isLogout,
    isBlocked,
    isError
}