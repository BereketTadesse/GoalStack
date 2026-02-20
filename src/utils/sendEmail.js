import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const smtpLogin = process.env.BREVO_SMTP_LOGIN;
    const smtpKey = process.env.BREVO_SMTP_KEY;

    if (!smtpLogin) {
        throw new Error('Missing BREVO_SMTP_LOGIN environment variable');
    }

    if (!smtpKey) {
        throw new Error('Missing BREVO_SMTP_KEY environment variable');
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: smtpLogin,
            pass: smtpKey
        }
    });

    const fromEmail = process.env.EMAIL_FROM || smtpLogin;

    const mailOptions = {
        from: `"GoalStack" <${fromEmail}>`,
        to: options.email,
        subject: options.subject,
        text: options.text,
        html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully. Message ID:', info.messageId);
};

export default sendEmail;
