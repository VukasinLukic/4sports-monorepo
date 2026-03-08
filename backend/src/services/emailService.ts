import nodemailer from 'nodemailer';

/**
 * Gmail Transporter
 * Uses Gmail App Password for authentication
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.Gmail_sender,
    pass: process.env.Gmail_password,
  },
});

/**
 * Send Contact Form Email
 * @description Sends an email from the contact form to the 4Sports team
 */
export const sendContactEmail = async (data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> => {
  const { name, email, subject, message } = data;

  const mailOptions = {
    from: `"4Sports Contact Form" <${process.env.Gmail_sender}>`,
    to: process.env.Gmail_sender,
    replyTo: email,
    subject: `[Kontakt Forma] ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #22c55e; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Nova poruka sa kontakt forme</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p><strong>Ime:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Tema:</strong> ${subject}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p><strong>Poruka:</strong></p>
          <p style="white-space: pre-wrap; background: #f9fafb; padding: 12px; border-radius: 6px;">${message}</p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
          Poslato sa 4Sports promotivnog sajta
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Verify Email Configuration
 * @description Tests if Gmail credentials are valid
 */
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Email service (Gmail) connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error);
    return false;
  }
};
