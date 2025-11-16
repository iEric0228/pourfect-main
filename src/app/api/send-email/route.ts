import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // In a real application, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Resend
    // - Nodemailer with SMTP

    // For now, we'll just log the email and return success
    console.log('📧 Email would be sent:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML length:', html.length, 'characters');

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // In production, replace this with actual email sending logic:
    /*
    // Example with SendGrid:
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to,
      from: process.env.FROM_EMAIL,
      subject,
      html
    };
    
    await sgMail.send(msg);
    */

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      // In development, include the email details for testing
      debug: process.env.NODE_ENV === 'development' ? { to, subject } : undefined
    });

  } catch (error) {
    console.error('Email sending failed:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
