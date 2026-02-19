import nodemailer from 'nodemailer';
import dotenv from 'dotenv';    
import { text } from 'express';
dotenv.config();

const sendEmail = async(options)=>{
    const transporter = nodemailer.createTransport({
        service : 'gmail',
        auth : {
            user : process.env.EMAIL_USER,
            pass : process.env.EMAIL_PASS
        }
    });
    const mailOptions={
        from: `"GoalStack support" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.text,
        html: options.html
    };
    await transporter.sendMail(mailOptions);
};

export default sendEmail;