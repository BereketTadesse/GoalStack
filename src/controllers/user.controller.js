import User from '../models/user.model.js';
import multer from 'multer';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

const creatuser = async(req,res)=>{
    try {
        const{name,email,password} = req.body;

        if(!name||!email||!password){
            return res.status(400).json({message:'All fields are required'});
        };
        const userExists = await User.findOne({email});
        
        if(userExists){return res.status(400).json({message:'User already exists'}); } 
        

        const token = crypto.randomBytes(20).toString('hex');

        const user = await User.create({name,email,password,verificationToken:token}); 
        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify your email',
                text: `Please verify your email by clicking on the link: http://localhost:3000/api/users/verify/${token}`
            });
            res.status(201).json({ 
                message: 'Success! Please check your email to verify your account.',
                userId: user._id 
            });
        } catch (mailError) {
            // If email fails, we should probably delete the user so they can try again
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({ message: 'Error sending email. Try again later.' });
        }
    } catch (error) {
    // This sends EVERYTHING back to Postman
    res.status(500).json({
        success: false,
        errorName: error.name,        // e.g., "ReferenceError"
        errorMessage: error.message,  // e.g., "post is not defined"
        stackTrace: error.stack,      // This shows the exact line number in your file
        fullError: error              // Some extra details from MongoDB
    });
}
}
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        console.log("Token received from URL:", token); // Debug 1

        // 1. Find user with this token
        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            console.log("No user found with that token!"); // Debug 2
            return res.status(400).send('<h1>Invalid or expired token</h1>');
        }

        console.log("User found:", user.name); // Debug 3

        // 2. Update the fields
        user.isVerified = true;
        user.verificationToken = undefined; 

        // 3. Save and confirm
        await user.save();
        console.log("User status after save:", user.isVerified); // Debug 4

        res.status(200).send('<h1>Email Verified! You can now login.</h1>');
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).send('Server Error');
    }
};

const loginuser = async(req,res)  =>{
    try {
        const {email,password} = req.body;
        const user = await User.findOne({email});

        if(!user){return res.status(400).json({message:'please register first'});}

        const isMatch = await user.matchPassword(password);

        if(!isMatch){return res.status(400).json({message:'Invalid email or password'});}
        if(user.isVerified === false){
            return res.status(400).json({message:'Please verify your email before logging in'});
        }

        if (user && isMatch){
            const token = user.generateToken();
        res.cookie('jwt', token, {
                httpOnly: true, // Prevents JavaScript access (Very Secure)
                secure: process.env.NODE_ENV === 'production', // Only over HTTPS in production
                sameSite: 'strict', // Prevents CSRF attacks
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.json({ success: true, username: user.username });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            errorName: error.name,        // e.g., "ReferenceError"
            errorMessage: error.message,  // e.g., "post is not defined"
            stackTrace: error.stack,      // This shows the exact line number in your file
            fullError: error              // Some extra details from MongoDB
        }); 
    }
};

const getuser = async(req,res)=>{
    try {
            const user = await User.findById(req.user._id).select('-password');
            if(user){
            res.status(200).json({user});  } 
            else{
                res.status(404).json({message:'User not found'});
            }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            errorName: error.name,        // e.g., "ReferenceError"
            errorMessage: error.message,  // e.g., "post is not defined"            

            stackTrace: error.stack,      // This shows the exact line number in your file
            fullError: error              // Some extra details from MongoDB
        });         
    }
};
const logoutuser = async(req,res) =>{
    try {
        const {email} = req.body;
        res.cookie('jwt', '', {
                httpOnly: true,
                expires: new Date(0) // Sets expiration to the past to "kill" it
            });
            res.status(200).json({ message: "Logged out successfully" });

    } catch (error) {
        res.status(500).json({
            success: false,
            errorName: error.name,        // e.g., "ReferenceError"
            errorMessage: error.message,  // e.g., "post is not defined"
            stackTrace: error.stack,      // This shows the exact line number in your file
            fullError: error              // Some extra details from MongoDB
        }); 
    }
}

const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const user = await User.findById(req.user._id);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
         
        user.profilePicture = `/${req.file.path.replace(/\\/g, '/')}`; // Save the file path to the user's profile
        await user.save();
        res.status(200).json({ message: "Profile picture uploaded successfully", profilePicture: req.file.path });
    } catch (error) {
        res.status(500).json({
            success: false,
            errorName: error.name,        // e.g., "ReferenceError"
            errorMessage: error.message,  // e.g., "post is not defined"
            stackTrace: error.stack,      // This shows the exact line number in your file
            fullError: error              // Some extra details from MongoDB
        }); 
    }
};


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No user found with that email" });
        }

        // 1. Create a random Reset Token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // 2. Save the token (hashed) and expiry (15 mins) to DB
        user.forgotPasswordToken = resetToken;
        user.forgotPasswordTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes from now
        await user.save();

        // 3. Send the Email
        const resetUrl = `http://localhost:3000/api/users/resetpassword/${resetToken}`;
        const message = `You requested a password reset. Please click: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request',
                html: `<h1>Reset Password</h1><p>Click <a href="${resetUrl}">here</a> to reset your password. Valid for 15 mins.</p>`
            });
            res.status(200).json({ message: "Reset link sent to email!" });
        } catch (err) {
            user.forgotPasswordToken = undefined;
            user.forgotPasswordTokenExpires = undefined;
            await user.save();
            return res.status(500).json({ message: "Email could not be sent" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const {token} = req.params;
        const {newPassword} = req.body;
        const user = await User.findOne({
            forgotPasswordToken: token,
            forgotPasswordTokenExpires: { $gt: Date.now() } }); 
            
        if(!user)return res.status(400).json({message:"Invalid or expired token"});// Check if token is still valid

        user.password = newPassword,
        user.forgotPasswordToken = undefined
        user.forgotPasswordTokenExpires = undefined;
        await user.save();

        res.status(200).json({
            message: "Password reset successfully",
        })
        
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
export {creatuser,loginuser,logoutuser,getuser,uploadProfilePicture,verifyEmail,forgotPassword,resetPassword};