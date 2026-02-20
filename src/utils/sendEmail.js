import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // Use false for STARTTLS (port 587)
      auth: {
        // We use .trim() to ensure no accidental spaces break the connection
        user: process.env.BREVO_SMTP_LOGIN.trim(),
        pass: process.env.BREVO_SMTP_KEY.trim(),
      },
    });

    const mailOptions = {
      // Use the verified email address you set up in Brevo
      from: `"GoalStack Support" <${process.env.BREVO_SENDER_EMAIL.trim()}>`,
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully. Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error('Email could not be sent.');
  }
};

export default sendEmail;