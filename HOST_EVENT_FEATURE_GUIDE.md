# Host Event Feature Guide

## Overview

Users can now create and host their own events through the Pourfect app. This feature allows authenticated users to become event organizers and share their events with the community.

## Features Completed ✅

### 1. Host Event Button

- **Location**: Events page (`/src/app/events/page.tsx`)
- **Visual**: Green gradient button with Calendar icon
- **Position**: Next to "My Tickets" button in the header
- **Access**: Only visible to authenticated users

### 2. Host Event Modal

A comprehensive form modal that includes:

#### Required Fields

- **Event Title**: Name of the event
- **Description**: Detailed event description
- **Event Image URL**: Cover image for the event
- **Venue Name**: Location name
- **Address**: Full venue address
- **Start Date & Time**: Event start datetime
- **End Date & Time**: Event end datetime
- **Ticket Price**: Price per ticket (can be $0 for free events)
- **Capacity**: Maximum number of attendees
- **Category**: Event type (networking, tasting, party, workshop, festival, competition)

#### Optional Fields

- **Tags**: Comma-separated tags for searchability
- **Refund Policy**: Custom refund terms
- **Terms & Conditions**: Event-specific terms

### 3. Backend Integration

- **Service**: `EventService.createEvent()` in `/src/lib/eventService.ts`
- **Database**: Automatic integration with Firebase Firestore
- **Auto-populated Fields**:
  - Organizer ID (current user)
  - Organizer Name (from user profile)
  - Organizer Avatar (from user profile)
  - Initial counters (tickets_sold: 0, rsvp_count: 0, likes_count: 0, saves_count: 0)
  - Status: "upcoming"
  - Featured: false (can be manually promoted later)

### 4. Form Validation

- All required fields enforced with HTML5 validation
- Number inputs have min/max constraints
- URL validation for image URLs
- Datetime validation for event dates
- Loading state during submission

### 5. User Experience

- **Success**: Shows success alert and refreshes event list
- **Error Handling**: Displays error message if creation fails
- **Loading State**: Animated spinner while processing
- **Responsive**: Works on desktop and mobile devices
- **Cancel Option**: Can close modal without saving

## How to Use

### For Users

1. **Navigate to Events Page**: Click "Events" in the navigation
2. **Click "Host Event"**: Green button in the header (must be logged in)
3. **Fill Out Form**: Complete all required fields
4. **Submit**: Click "Create Event" button
5. **View Event**: Your new event appears in the events list

### For Developers

#### Creating an Event Programmatically

```typescript
import { EventService } from '@/lib/eventService';

const eventId = await EventService.createEvent({
  title: "My Event",
  description: "Event description",
  image_url: "https://example.com/image.jpg",
  location: {
    name: "Venue Name",
    address: "123 Main St",
    coordinates: { lat: 40.7128, lng: -74.0060 } // Optional
  },
  start_date: new Date('2024-12-25T19:00:00'),
  end_date: new Date('2024-12-25T22:00:00'),
  price: 25,
  capacity: 100,
  category: 'networking',
  tags: ['cocktails', 'networking'],
  policy: {
    age_restriction: 21,
    refund_policy: "Full refund up to 7 days before",
    terms: "Must show valid ID"
  },
  organizer_id: user.uid,
  organizer_name: "John Doe",
  organizer_avatar: "https://example.com/avatar.jpg"
});
```

## Technical Implementation

### Files Modified

1. **`/src/app/events/page.tsx`**
   - Added `showHostModal` state
   - Added `hostEventMutation` using React Query
   - Added Host Event button
   - Added Host Event modal component with form

2. **`/src/lib/eventService.ts`**
   - Added `createEvent()` static method
   - Handles event creation with proper validation
   - Returns event ID on success

### Dependencies

- React Query for mutation management
- Lucide React for icons
- Firebase Firestore for data storage
- Next.js App Router

### Styling

- Tailwind CSS with custom gradient buttons
- Glass-morphism modal design
- Responsive grid layout
- Dark theme with purple/green accents

## Event Categories

- **networking**: Professional networking events
- **tasting**: Drink/cocktail tasting events
- **party**: Social parties and celebrations
- **workshop**: Educational workshops and classes
- **festival**: Large-scale festivals
- **competition**: Mixology competitions

## Event Status Types

- **upcoming**: Future events (default for new events)
- **ongoing**: Currently happening
- **past**: Completed events
- **cancelled**: Cancelled events

## Future Enhancements (Optional)

1. **Image Upload**: Direct image upload instead of URL input
2. **Location Autocomplete**: Google Places API integration
3. **Recurring Events**: Support for repeating events
4. **Co-hosts**: Allow multiple organizers
5. **Event Analytics**: Views, clicks, conversion tracking
6. **Draft Mode**: Save events as drafts before publishing
7. **Event Promotion**: Featured event requests
8. **Ticket Tiers**: Multiple ticket types (VIP, General, etc.)
9. **Event Cloning**: Duplicate existing events
10. **Calendar Integration**: Export to Google Calendar, Apple Calendar

## Testing Checklist

- [ ] Can open Host Event modal when logged in
- [ ] All form fields are present and labeled
- [ ] Required field validation works
- [ ] Can submit form with valid data
- [ ] Success message appears after creation
- [ ] New event appears in events list
- [ ] Event details are correct in database
- [ ] Organizer info is populated correctly
- [ ] Can cancel/close modal without saving
- [ ] Modal is responsive on mobile
- [ ] Loading state displays during submission
- [ ] Error handling works for failed submissions

## Support

For issues or questions about the Host Event feature, check:

1. Browser console for error messages
2. Firebase Firestore console for data verification
3. Network tab for API call debugging
4. React Query DevTools for mutation states

## Related Features

- **My Tickets**: View tickets for events you're attending
- **Event Details**: Full event information modal
- **Purchase Tickets**: Buy tickets for events
- **Like/Save Events**: Engage with events
- **Event Search**: Find events by keywords
- **Event Filters**: Filter by category, date, location

---

Last Updated: November 16, 2025
