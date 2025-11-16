import { firebase } from './firebaseService';
import { Ticket } from './firebaseService';
import { Timestamp } from 'firebase/firestore';

// Utility to generate QR code data URL
const generateQRCode = async (data: string): Promise<string> => {
  try {
    // Using qrcode library - you'll need to install it: npm install qrcode @types/qrcode
    const QRCode = require('qrcode');
    return await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('QR Code generation failed:', error);
    // Fallback to a simple data URL
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="white"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="black" font-family="monospace" font-size="12">${data}</text></svg>`;
  }
};

// Generate unique ticket code
const generateTicketCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Email service using our API endpoint
const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    console.log('✅ Email sent successfully to:', to);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Generate email templates
const generateTicketEmailTemplate = (ticket: Ticket, qrCodeDataUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Event Ticket</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .ticket-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
        .qr-code { text-align: center; margin: 20px 0; }
        .qr-code img { max-width: 200px; border: 2px solid #eee; border-radius: 8px; }
        .ticket-details { display: flex; justify-content: space-between; flex-wrap: wrap; }
        .detail-item { margin-bottom: 15px; }
        .label { font-weight: bold; color: #666; display: block; margin-bottom: 5px; }
        .value { color: #333; font-size: 16px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        @media (max-width: 600px) {
          .ticket-details { flex-direction: column; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 Your Event Ticket</h1>
          <p>Thank you for your purchase!</p>
        </div>
        
        <div class="content">
          <div class="ticket-card">
            <h2 style="color: #667eea; margin-top: 0;">${ticket.event_title}</h2>
            
            <div class="ticket-details">
              <div class="detail-item">
                <span class="label">📅 Date & Time</span>
                <span class="value">${new Date(ticket.event_date.seconds * 1000).toLocaleString()}</span>
              </div>
              <div class="detail-item">
                <span class="label">📍 Location</span>
                <span class="value">${ticket.event_location}</span>
              </div>
              <div class="detail-item">
                <span class="label">🎫 Quantity</span>
                <span class="value">${ticket.quantity} ticket${ticket.quantity > 1 ? 's' : ''}</span>
              </div>
              <div class="detail-item">
                <span class="label">💰 Total Paid</span>
                <span class="value">$${ticket.total_price}</span>
              </div>
              <div class="detail-item">
                <span class="label">🔑 Ticket Code</span>
                <span class="value" style="font-family: monospace; font-size: 18px; font-weight: bold;">${ticket.ticket_code}</span>
              </div>
            </div>
            
            <div class="qr-code">
              <p><strong>Present this QR code at the event:</strong></p>
              <img src="${qrCodeDataUrl}" alt="Ticket QR Code" />
              <p style="font-size: 12px; color: #666;">Ticket Code: ${ticket.ticket_code}</p>
            </div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> Please save this email or take a screenshot of the QR code. You'll need to present it at the event entrance.
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #333; margin-top: 0;">Event Details</h3>
            <p><strong>Organizer:</strong> ${ticket.buyer_name}</p>
            <p><strong>Purchase Date:</strong> ${new Date(ticket.purchase_date.seconds * 1000).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${ticket.payment_method.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>
        
        <div class="footer">
          <p>If you have any questions, please contact our support team.</p>
          <p>© 2024 Pourfect Events. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateTransferEmailTemplate = (ticket: Ticket, fromUser: string, toEmail: string, qrCodeDataUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Ticket Transferred to You</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .ticket-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
        .transfer-info { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .qr-code { text-align: center; margin: 20px 0; }
        .qr-code img { max-width: 200px; border: 2px solid #eee; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎁 Ticket Transferred to You!</h1>
          <p>You've received an event ticket</p>
        </div>
        
        <div class="content">
          <div class="transfer-info">
            <strong>🎉 Great news!</strong> ${fromUser} has transferred an event ticket to you.
          </div>
          
          <div class="ticket-card">
            <h2 style="color: #667eea; margin-top: 0;">${ticket.event_title}</h2>
            
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
              <div style="margin-bottom: 15px;">
                <span style="font-weight: bold; color: #666; display: block; margin-bottom: 5px;">📅 Date & Time</span>
                <span style="color: #333; font-size: 16px;">${new Date(ticket.event_date.seconds * 1000).toLocaleString()}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <span style="font-weight: bold; color: #666; display: block; margin-bottom: 5px;">📍 Location</span>
                <span style="color: #333; font-size: 16px;">${ticket.event_location}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <span style="font-weight: bold; color: #666; display: block; margin-bottom: 5px;">🎫 Quantity</span>
                <span style="color: #333; font-size: 16px;">${ticket.quantity} ticket${ticket.quantity > 1 ? 's' : ''}</span>
              </div>
              <div style="margin-bottom: 15px;">
                <span style="font-weight: bold; color: #666; display: block; margin-bottom: 5px;">🔑 Ticket Code</span>
                <span style="color: #333; font-size: 18px; font-family: monospace; font-weight: bold;">${ticket.ticket_code}</span>
              </div>
            </div>
            
            <div class="qr-code">
              <p><strong>Present this QR code at the event:</strong></p>
              <img src="${qrCodeDataUrl}" alt="Ticket QR Code" />
              <p style="font-size: 12px; color: #666;">Ticket Code: ${ticket.ticket_code}</p>
            </div>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px;">
            <strong>⚠️ Important:</strong> This ticket has been transferred to you. Please save this email or take a screenshot of the QR code for event entry.
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
          <p>Enjoy the event!</p>
          <p>© 2024 Pourfect Events. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const TicketService = {
  // Create a new ticket with QR code and send confirmation email
  async createTicket(ticketData: {
    event_id: string;
    event_title: string;
    event_date: any;
    event_location: string;
    buyer_id: string;
    buyer_name: string;
    buyer_email: string;
    quantity: number;
    total_price: number;
    payment_method: 'apple_pay' | 'google_pay' | 'card';
    payment_id: string;
  }): Promise<string> {
    try {
      const ticket_code = generateTicketCode();
      const qr_code = await generateQRCode(JSON.stringify({
        ticket_code,
        event_id: ticketData.event_id,
        buyer_id: ticketData.buyer_id,
        quantity: ticketData.quantity
      }));

      const ticketId = await firebase.entities.Ticket.create({
        ...ticketData,
        ticket_code,
        qr_code,
        status: 'active',
        purchase_date: Timestamp.now()
      });

      // Send confirmation email
      const ticket = await firebase.entities.Ticket.get(ticketId);
      if (ticket) {
        const emailHtml = generateTicketEmailTemplate(ticket, qr_code);
        await sendEmail(
          ticketData.buyer_email,
          `Your Ticket for ${ticketData.event_title}`,
          emailHtml
        );
      }

      return ticketId;
    } catch (error) {
      console.error('Failed to create ticket:', error);
      throw error;
    }
  },

  // Transfer ticket to another user
  async transferTicket(ticketId: string, fromUserId: string, toEmail: string): Promise<void> {
    try {
      const ticket = await firebase.entities.Ticket.get(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.buyer_id !== fromUserId && ticket.transferred_to !== fromUserId) {
        throw new Error('You do not own this ticket');
      }

      if (ticket.status !== 'active') {
        throw new Error('This ticket cannot be transferred');
      }

      // Check if the recipient email exists in the system
      let recipientUser = null;
      try {
        const users = await firebase.entities.UserProfile.filter({ 
          // Assuming there's an email field in UserProfile
          // If not, you might need to add it or use a different method
        });
        recipientUser = users.find(user => user.uid === toEmail); // Adjust this logic based on your user structure
      } catch (error) {
        console.log('Recipient not found in system, will send email anyway');
      }

      // Update ticket status and transfer info
      await firebase.entities.Ticket.update(ticketId, {
        status: 'transferred',
        transferred_to: toEmail,
        transferred_at: Timestamp.now(),
        transferred_from: fromUserId
      });

      // Get transferrer info
      const fromUser = await firebase.entities.UserProfile.filter({ uid: fromUserId });
      const fromUserName = fromUser[0]?.display_name || 'A friend';

      // Send transfer email to recipient
      const emailHtml = generateTransferEmailTemplate(ticket, fromUserName, toEmail, ticket.qr_code);
      await sendEmail(
        toEmail,
        `Event Ticket Transferred: ${ticket.event_title}`,
        emailHtml
      );

      // Send notification email to original owner
      const transferNotificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>✅ Ticket Transfer Successful</h2>
          <p>Your ticket for <strong>${ticket.event_title}</strong> has been successfully transferred to <strong>${toEmail}</strong>.</p>
          <p><strong>Ticket Code:</strong> ${ticket.ticket_code}</p>
          <p><strong>Transfer Date:</strong> ${new Date().toLocaleString()}</p>
          <p>The recipient will receive their ticket via email shortly.</p>
        </div>
      `;
      
      const originalBuyerEmail = ticket.buyer_email;
      if (originalBuyerEmail) {
        await sendEmail(
          originalBuyerEmail,
          `Ticket Transfer Confirmation: ${ticket.event_title}`,
          transferNotificationHtml
        );
      }

    } catch (error) {
      console.error('Failed to transfer ticket:', error);
      throw error;
    }
  },

  // Regenerate QR code for a ticket
  async regenerateQRCode(ticketId: string): Promise<string> {
    try {
      const ticket = await firebase.entities.Ticket.get(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const qr_code = await generateQRCode(JSON.stringify({
        ticket_code: ticket.ticket_code,
        event_id: ticket.event_id,
        buyer_id: ticket.buyer_id,
        quantity: ticket.quantity
      }));

      await firebase.entities.Ticket.update(ticketId, { qr_code });
      return qr_code;
    } catch (error) {
      console.error('Failed to regenerate QR code:', error);
      throw error;
    }
  },

  // Resend ticket email
  async resendTicketEmail(ticketId: string): Promise<void> {
    try {
      const ticket = await firebase.entities.Ticket.get(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const emailHtml = generateTicketEmailTemplate(ticket, ticket.qr_code);
      await sendEmail(
        ticket.buyer_email,
        `Your Ticket for ${ticket.event_title} (Resent)`,
        emailHtml
      );
    } catch (error) {
      console.error('Failed to resend ticket email:', error);
      throw error;
    }
  },

  // Validate ticket at event entrance
  async validateTicket(ticketCode: string, eventId: string): Promise<{ valid: boolean; ticket?: Ticket; message: string }> {
    try {
      const tickets = await firebase.entities.Ticket.filter({ ticket_code: ticketCode });
      const ticket = tickets.find(t => t.event_id === eventId);

      if (!ticket) {
        return { valid: false, message: 'Invalid ticket code' };
      }

      if (ticket.status === 'used') {
        return { valid: false, ticket, message: 'Ticket already used' };
      }

      if (ticket.status !== 'active') {
        return { valid: false, ticket, message: 'Ticket is not active' };
      }

      return { valid: true, ticket, message: 'Valid ticket' };
    } catch (error) {
      console.error('Failed to validate ticket:', error);
      return { valid: false, message: 'Validation error' };
    }
  },

  // Mark ticket as used
  async markTicketAsUsed(ticketId: string): Promise<void> {
    await firebase.entities.Ticket.update(ticketId, {
      status: 'used',
      used_at: Timestamp.now()
    });
  }
};
