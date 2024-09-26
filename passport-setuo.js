
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require("./model/userModel");
require('dotenv').config();


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENTID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'https://glamwear.site/auth/google/callBack',
},

async (accessToken, refreshToken, profile, done) => {
    try {
       
        console.log('lloooooo');
        
        const { id: googleId, email, displayName: name } = profile;

        console.log('profile in passport-setuo',profile);
        

        let user = await User.findOne({ email: profile._json.email });

        if (!user) {
                  
            user = await User.create({
                googleId,
                email: profile._json.email,
                name,
                password:googleId,
       
                mobile:'08958093553'
            });
            console.log('user in if case googleAuth',user)
        }
        
        console.log('user in out of if case googleAuth',user)


       
        return done(null, user);
    } catch (error) {
        console.error("Error during Google authentication:", error);
        return done(error, null);
    }
}
)
);

passport.serializeUser((user, done) => {
done(null, user.id);
console.log('passport...........................');

});

passport.deserializeUser(async (id, done) => {
try {
const user = await User.findById(id);
console.log('3hijnn11111111111111')

done(null, user);
} catch (error) {
done(error, null);
}
});


module.exports = {
googleAuth: passport.authenticate("google", { scope: ["profile", "email"],  prompt: "select_account" }),

googleCallback: passport.authenticate("google", {
failureRedirect: "/login",

}),

setupSession: (req, res, next) => {
    console.log('setupSession');

if (req.isAuthenticated()) {
console.log('passport11111111111111')
 
    req.session.user_id = req.user._id;
} 
console.log(req.session.user_id);
console.log('passport22222222222222222222222222222')

res.redirect("/userhome");
    },
};






