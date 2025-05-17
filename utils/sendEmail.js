// utils/sendEmail.js
import sgMail from '@sendgrid/mail';

export const sendEmail = async (to, subject, text, html) => {
  try {
    // Verify API key is set
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key is missing');
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Verify sender email
    if (!process.env.FROM_EMAIL) {
      throw new Error('Sender email is not configured');
    }

    const msg = {
      to,
      from: process.env.FROM_EMAIL, // Must be verified in SendGrid
      subject,
      text: text || '', // Ensure text is not undefined
      html: html || text || '', // Fallback to text if html is empty
    };

    console.log('Attempting to send email with config:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject
    });

    const response = await sgMail.send(msg);
    console.log('Email sent successfully:', response[0].statusCode);
    return true;
  } catch (error) {
    console.error('Email sending failed:', {
      error: error.response?.body?.errors || error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error; // Re-throw for proper error handling upstream
  }
};