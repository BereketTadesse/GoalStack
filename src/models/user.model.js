import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const userSchema = new mongoose.Schema({
    name:{
        type : String,
        required : true,
        unique : true,
        trim : true,
        maxlength : 50
    
    },
    email:{
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
        maxlength : 100
    },
    password:{
        type : String,
        required: true,
        trim : true,
        minlength : 8,
        maxlength : 100
    },
    isVerified:{
        type : Boolean,
        default : false
    },
verificationToken: String,
verificationTokenExpires: Date,
forgotPasswordToken: String,
forgotPasswordTokenExpires: Date},
{
    timestamps: true
});
userSchema.pre('save', async function() {
    // 1. If password isn't changed, stop here
    if (!this.isModified('password')) return; 

    // 2. Hash the password and replace the plain text one
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // No next() needed! Mongoose sees this is an async function 
    // and will wait until it's done.
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateToken = function() {
    return jwt.sign(
        {id:this._id},
        process.env.JWT_SECRET,{expiresIn:'1d'
            
        });
};

export default mongoose.model('user',userSchema);