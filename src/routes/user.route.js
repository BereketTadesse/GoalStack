import express from 'express';
import {creatuser,loginuser,logoutuser,getuser,uploadProfilePicture,verifyEmail,forgotPassword,resetPassword} from '../controllers/user.controller.js';
import {protect} from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
const router = express.Router();


router.route('/create').post(creatuser);
router.route('/verify/:token').get(verifyEmail);
router.route('/login').post(loginuser);
router.route('/me').get(protect,getuser);
router.route('/logout').post(logoutuser);
router.route('/forgot_password').post(forgotPassword);
router.route('/reset_password/:token').put(resetPassword);
router.route('/upload-profile-picture').post(protect, upload.single('profilePicture'), uploadProfilePicture);

export default router;