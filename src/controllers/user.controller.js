import User from '../models/user.model.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

const getBaseUrl = (req) => {
  if (process.env.APP_URL) return process.env.APP_URL;

  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
};

// ✅ Centralized cookie options (dev vs prod)
const getJwtCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProd, // Render HTTPS => true in prod; localhost => false in dev
    sameSite: isProd ? 'none' : 'lax', // cross-site in prod, workable in dev
    maxAge: 24 * 60 * 60 * 1000 // ✅ 1 day
  };
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
      const emailHtml = `
        <div style="background-color:#f3f4f6;padding:32px 16px;font-family:Arial,sans-serif;color:#0b2b55;">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:36px 28px;border:1px solid #e2e8f0;">
            <div style="text-align:center;">
              <div style="display:inline-block;border:1px solid #0b2b55;color:#0b2b55;padding:10px 18px;border-radius:8px;font-weight:700;letter-spacing:1px;">
                GOALSTACK
              </div>
              <h1 style="margin:22px 0 8px;font-size:32px;line-height:1.2;color:#0b2b55;">Verify Your Email</h1>
              <p style="margin:0 0 24px;font-size:16px;color:#4f6c93;">Welcome! Confirm your account to get started.</p>
            </div>
            <div style="background:#e9eff7;border:1px solid #c8d4e5;border-radius:10px;padding:18px 16px;margin:0 0 24px;">
              <p style="margin:0;font-size:15px;color:#1b365d;">
                Click the button below to verify your email address and activate your account.
              </p>
            </div>
            <div style="text-align:center;margin:0 0 20px;">
              <a href="${verificationUrl}" style="display:inline-block;background:#0b2b55;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:10px;">
                Verify Email
              </a>
            </div>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5d7392;">
              If the button does not work, copy and paste this link into your browser:<br />
              <a href="${verificationUrl}" style="color:#0b2b55;word-break:break-all;">${verificationUrl}</a>
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        email: user.email,
        subject: 'Verify your email',
        text: `Please verify your email by clicking on the link: ${verificationUrl}`,
        html: emailHtml
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
      return res.status(400).send(`
        <div style="background-color:#f3f4f6;min-height:100vh;padding:36px 18px;font-family:Arial,sans-serif;">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:36px 26px;border:1px solid #e2e8f0;text-align:center;">
            <h1 style="margin:0 0 12px;color:#0b2b55;">Invalid or Expired Link</h1>
            <p style="margin:0;color:#4f6c93;">This verification link is no longer valid. Please request a new verification email.</p>
          </div>
        </div>
      `);
    }

    console.log('User found:', user.name);

    user.isVerified = true;
    user.verificationToken = undefined;

    await user.save();
    console.log('User status after save:', user.isVerified);

    res.status(200).send(`
      <div style="background-color:#f3f4f6;min-height:100vh;padding:36px 18px;font-family:Arial,sans-serif;color:#0b2b55;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:36px 26px;border:1px solid #e2e8f0;">
          <div style="text-align:center;">
            <div style="width:62px;height:62px;border-radius:50%;margin:0 auto 14px;background:#e9eff7;border:1px solid #c8d4e5;line-height:62px;font-size:30px;font-weight:700;color:#0b2b55;">&#10003;</div>
            <h1 style="margin:0 0 10px;font-size:30px;color:#0b2b55;">Email Verified!</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#4f6c93;">Your account is now active. You can log in and continue.</p>
            <a href="${process.env.FRONTEND_URL || '/'}" style="display:inline-block;background:#0b2b55;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:10px;">
              Go to Login
            </a>
          </div>
        </div>
      </div>
    `);
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

    // ✅ Create JWT + Set cookie with correct options
    const token = user.generateToken();
    res.cookie('jwt', token, getJwtCookieOptions());

    // ✅ Return useful response (token helps as fallback in dev if cookies blocked)
    res.status(200).json({
      success: true,
      name: user.name,
      userId: user._id,
      token
    });
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
    // ✅ Clear cookie using SAME options (important for proper removal)
    const opts = getJwtCookieOptions();
    res.cookie('jwt', '', { ...opts, maxAge: 0 });

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
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'newPassword and confirmPassword are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

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

export {
  creatuser,
  loginuser,
  logoutuser,
  getuser,
  uploadProfilePicture,
  verifyEmail,
  forgotPassword,
  resetPassword
};
