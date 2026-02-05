/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, text, html, attachments }: { to: string; subject: string; text: string; html?: string; attachments?: any[] }) {
  try {
    // const info = await transporter.sendMail({
    //   from: `"${process.env.EMAIL_FROM_NAME || 'SINFONI Notification'}" <${process.env.EMAIL_FROM}>`,
    //   to,
    //   subject,
    //   text,
    //   html,
    //   attachments,
    // });
    return null;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
