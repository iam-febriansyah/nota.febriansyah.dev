/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { sendEmail } from '@/lib/mail';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const users = await executeQuery<any[]>('SELECT id, name FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      // Don't reveal if user exists for security, but say email sent if found
      return NextResponse.json({ message: 'If this email exists in our system, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour expiry

    await executeQuery(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [token, expiry, users[0].id]
    );

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Reset Your SINFONI Password',
      text: `Hello ${users[0].name},\n\nYou requested a password reset. Please click the link below to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.`,
      html: `
        <p>Hello ${users[0].name},</p>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    });

    return NextResponse.json({ message: 'If this email exists in our system, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
  }
}
