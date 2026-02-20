// utils/sendEmail.js
import Brevo from "brevo";

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const sendEmail = async (options) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("Missing BREVO_API_KEY environment variable");
  }

  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.sender = {
    email: "berekettadesse1244@gmail.com", // or your verified Brevo sender
    name: "GoalStack"
  };
  sendSmtpEmail.to = [{ email: options.email }];
  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.textContent = options.text;
  sendSmtpEmail.htmlContent = options.html;

  const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log("✅ Email sent successfully. Message ID:", data.messageId || data);
};

export default sendEmail;
