import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    if (!process.env.BREVO_SMTP_KEY) {
        throw new Error('Missing BREVO_SMTP_KEY environment variable');
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.BREVO_SMTP_LOGIN, // your Brevo account email
            pass: process.env.BREVO_SMTP_KEY,   // Brevo SMTP key (not your password)
        },
    });

    const mailOptions = {
        // CHANGE THIS LINE: 
        // Use your verified Gmail from the screenshot, NOT the a2d5ab001 ID
        from: `"GoalStack" <berekettadesse1244@gmail.com>`,

        to: options.email,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully. Message ID:', info.messageId);
};

export default sendEmail;

