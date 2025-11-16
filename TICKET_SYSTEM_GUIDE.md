# Ticket Management & Email System Setup Guide

This guide covers the new ticket management features that have been added to the Pourfect app.

## New Features Added

### 1. Enhanced Ticket Management
- **Location**: `/src/app/events/tickets/page.tsx`
- **Features**:
  - View all purchased and received tickets
  - Filter tickets by status (purchased, received, active, used)
  - Search tickets by event name or location
  - Sort by date, event name, or status
  - Switch between grid and list view

### 2. QR Code Generation
- **Service**: `/src/lib/ticketService.ts`
- **Features**:
  - Automatic QR code generation for each ticket
  - QR codes contain ticket verification data
  - View QR codes in modal dialog
  - Copy ticket codes to clipboard

### 3. Email Confirmation System
- **API Route**: `/src/app/api/send-email/route.ts`
- **Templates**: Built-in HTML email templates
- **Features**:
  - Automatic email confirmation on ticket purchase
  - Resend email functionality
  - Transfer notification emails
  - Professional HTML templates with embedded QR codes

### 4. Ticket Transfer System
- **Features**:
  - Transfer tickets to other users via email
  - Transfer confirmation emails
  - Status tracking (transferred tickets marked appropriately)
  - Transfer history preservation

## How to Use

### For Users:

1. **Purchase a Ticket**:
   - Go to Events page
   - Select an event and click "Get Tickets"
   - Complete purchase process
   - Receive email confirmation with QR code

2. **View Your Tickets**:
   - Go to Events → My Tickets (or `/events/tickets`)
   - Use filters to find specific tickets
   - Switch between grid/list view

3. **View QR Code**:
   - Click the eye icon (👁️) on any ticket
   - QR code modal will display
   - Copy ticket code or download ticket info

4. **Transfer a Ticket**:
   - Click the send icon (📤) on an active ticket
   - Enter recipient's email address
   - Confirm transfer
   - Both parties receive email notifications

5. **Resend Email**:
   - Click the share icon (🔄) to resend ticket email
   - Useful if original email was lost

### For Developers:

1. **Testing Email System**:
   ```bash
   # The system currently logs emails to console
   # Check browser console or server logs for email content
   # To integrate real email service, update /src/app/api/send-email/route.ts
   ```

2. **QR Code Dependencies**:
   ```bash
   cd /Users/ericchiu/Desktop/app/pourfect-main
   npm install qrcode @types/qrcode
   ```

3. **Database Schema Updates**:
   The Ticket interface now includes:
   - `transferred_at?: Timestamp`
   - `transferred_from?: string`
   - `used_at?: Timestamp`

## Configuration

### Email Service Integration

To integrate with a real email service, edit `/src/app/api/send-email/route.ts`:

```typescript
// Example with SendGrid
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const msg = {
  to,
  from: process.env.FROM_EMAIL!,
  subject,
  html
};

await sgMail.send(msg);
```

### Environment Variables

Add to your `.env.local`:
```
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@pourfect.com
```

## Enhanced Feed Filtering

The feed page now includes:
- Advanced content type filters
- Improved date range filtering
- Better sort options
- Quick filter buttons
- Real-time filter result counts

## Navigation Structure

```
Events Page (/events)
├── My Tickets (button) → /events/my-tickets (existing)
├── Ticket Management → /events/tickets (new)
└── Purchase flow with email confirmation (enhanced)
```

## Testing Checklist

- [ ] Purchase a ticket and receive email
- [ ] View ticket in ticket management page
- [ ] Display QR code modal
- [ ] Transfer ticket to another email
- [ ] Resend ticket email
- [ ] Filter and sort tickets
- [ ] Switch between grid/list view
- [ ] Use advanced filters in feed
- [ ] Search functionality works properly

## Next Steps

1. **Email Service Setup**: Configure real email service (SendGrid, etc.)
2. **QR Code Validation**: Add event check-in functionality
3. **Push Notifications**: Add mobile notifications for transfers
4. **Ticket Analytics**: Add analytics dashboard for organizers
5. **PDF Tickets**: Generate downloadable PDF tickets
