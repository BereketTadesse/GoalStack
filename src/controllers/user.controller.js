import User from '../models/user.model.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

const getBaseUrl = (req) => {
    if (process.env.APP_URL) return process.env.APP_URL;

    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `${proto}://${host}`;
};

const creatuser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const verificationUrl = `${getBaseUrl(req)}/api/users/verify/${token}`;

        const user = await User.create({ name, email, password, verificationToken: token });

        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify your email',
                text: `Please verify your email by clicking on the link: ${verificationUrl}`,
                html: `<h1>Verify Email</h1><p>Please click <a href="${verificationUrl}">here</a> to verify.</p>`
            });

            res.status(201).json({
                message: 'Success! Please check your email to verify your account.',
                userId: user._id
            });
        } catch (mailError) {
            await User.findByIdAndDelete(user._id);

            return res.status(500).json({
                message: 'Error sending email.',
                errorDetail: mailError.message,
                errorStack: mailError.code
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            errorMessage: error.message
        });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        console.log('Token received from URL:', token);

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            console.log('No user found with that token!');
            return res.status(400).send('<h1>Invalid or expired token</h1>');
        }

        console.log('User found:', user.name);

        user.isVerified = true;
        user.verificationToken = undefined;

        await user.save();
        console.log('User status after save:', user.isVerified);

        res.status(200).send('<h1>Email Verified! You can now login.</h1>');
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).send('Server Error');
    }
};

const loginuser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'please register first' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        if (user.isVerified === false) {
            return res.status(400).json({ message: 'Please verify your email before logging in' });
        }

        if (user && isMatch) {
            const token = user.generateToken();
            res.cookie('jwt', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            res.json({ success: true, name: user.name });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            errorName: error.name,
            errorMessage: error.message,
            stackTrace: error.stack,
            fullError: error
        });
    }
};

const getuser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.status(200).json({ user });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            errorName: error.name,
            errorMessage: error.message,
            stackTrace: error.stack,
            fullError: error
        });
    }
};

const logoutuser = async (req, res) => {
    try {
        res.cookie('jwt', '', {
            httpOnly: true,
            expires: new Date(0)
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({
            success: false,
            errorName: error.name,
            errorMessage: error.message,
            stackTrace: error.stack,
            fullError: error
        });
    }
};

const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.profilePicture = `/${req.file.path.replace(/\\/g, '/')}`;
        await user.save();
        res.status(200).json({ message: 'Profile picture uploaded successfully', profilePicture: req.file.path });
    } catch (error) {
        res.status(500).json({
            success: false,
            errorName: error.name,
            errorMessage: error.message,
            stackTrace: error.stack,
            fullError: error
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No user found with that email' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.forgotPasswordToken = resetToken;
        user.forgotPasswordTokenExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        const frontendBaseUrl = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');
        const resetUrl = `${frontendBaseUrl}/reset-password/${resetToken}`;
        const message = `You requested a password reset. Please click: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request',
                text: message,
                html: `<h1>Reset Password</h1><p>Click <a href="${resetUrl}">here</a> to reset your password. Valid for 15 mins.</p>`
            });
            res.status(200).json({ message: 'Reset link sent to email!' });
        } catch (err) {
            user.forgotPasswordToken = undefined;
            user.forgotPasswordTokenExpires = undefined;
            await user.save();
            return res.status(500).json({
                message: 'Email could not be sent',
                errorDetail: err.message,
                errorCode: err.code
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        const user = await User.findOne({
            forgotPasswordToken: token,
            forgotPasswordTokenExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        user.password = newPassword;
        user.forgotPasswordToken = undefined;
        user.forgotPasswordTokenExpires = undefined;
        await user.save();

        res.status(200).json({
            message: 'Password reset successfully'
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export { creatuser, loginuser, logoutuser, getuser, uploadProfilePicture, verifyEmail, forgotPassword, resetPassword };
