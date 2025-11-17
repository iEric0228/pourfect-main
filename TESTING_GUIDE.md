# Testing Guide - New Features

## Quick Test Checklist

### 1. Public Profile Pages
**Test Steps:**
1. Navigate to Feed page
2. Look for any post with a user avatar/name
3. Click on the avatar or username
4. ✅ Should navigate to `/profile/[uid]`
5. ✅ Should see user's profile with posts
6. ✅ Should see Follow/Unfollow button (if not your profile)

**Test Own Profile:**
1. Click your own avatar in a post
2. ✅ Should redirect to `/profile` (your profile page)

---

### 2. Individual Ticket Detail Pages
**Test Steps:**
1. Go to Events page → Click "My Tickets"
2. Find any ticket in your list
3. Click on the ticket title OR click the eye icon
4. ✅ Should navigate to `/events/tickets/[ticketId]`
5. ✅ Should see full ticket details:
   - Event image
   - QR code
   - Ticket code (with copy button)
   - Event date/location
   - Download button
   - Transfer button (if active)

---

### 3. Host Event Functionality
**Test Steps:**
1. Navigate to Events page
2. Look for "Host Event" button in the header
3. Click "Host Event"
4. ✅ Modal should open with form
5. Fill out the form:
   ```
   Title: Test Event
   Description: This is a test event
   Image URL: https://images.unsplash.com/photo-1551538827-9c037cb4f32a
   Location Name: Test Venue
   Location Address: 123 Test St
   Start Date: [Pick a future date]
   End Date: [Pick a future date after start]
   Price: 50
   Capacity: 100
   Category: tasting
   Tags: test, demo
   Refund Policy: Full refund
   ```
6. Click "Create Event"
7. ✅ Should see success message
8. ✅ Event should appear in events list

---

### 4. Logout Functionality
**Test Steps (Desktop):**
1. Look at top navigation bar
2. Find "Logout" button on the right
3. Click "Logout"
4. ✅ Should be logged out
5. ✅ Should redirect to `/auth/signin`

**Test Steps (Mobile):**
1. On mobile view, check bottom navigation
2. Find "Logout" button
3. Tap "Logout"
4. ✅ Should be logged out and redirected

---

### 5. Clickable Users in Feed
**Test Locations:**

**A. In Posts:**
1. Scroll through feed
2. Find any post
3. ✅ Avatar should have hover effect
4. ✅ Username should change color on hover
5. Click either → navigate to profile

**B. In Search:**
1. Click search type toggle to "Users"
2. Search for a username
3. ✅ Results should show user cards
4. Click any card → navigate to profile
5. ✅ Follow button should work

**C. In Suggested Users Sidebar:**
1. Look at right sidebar (desktop)
2. Find "Suggested Users" section
3. ✅ Each avatar is clickable
4. ✅ Each name is clickable
5. Click → navigate to profile

---

### 6. User Posts in Profile
**Test Steps:**
1. Navigate to your profile (`/profile`)
2. Click "Posts" tab (should be active)
3. ✅ Should see all your posts
4. ✅ Each post shows:
   - Type badge
   - Title and content
   - Image (if has one)
   - Like and comment counts
   - Date

**Test Other User's Posts:**
1. Navigate to another user's profile
2. ✅ Should see their posts
3. ✅ Follow button available (if not following)

---

## Integration Tests

### Full User Flow Test:
```
1. Login
2. Go to Feed
3. Click a user's avatar → View their profile
4. Click Follow → Follow the user
5. Go back to Feed
6. Switch to "Following" tab → See their posts
7. Go to Events
8. Click "Host Event" → Create new event
9. Go to My Tickets → View a ticket
10. Click ticket → See full details
11. Logout → Redirected to signin
```

---

## Expected Behavior

### Profile Navigation:
- ✅ Own profile → `/profile`
- ✅ Other user → `/profile/[uid]`
- ✅ Smooth transitions
- ✅ Loading states

### Ticket Details:
- ✅ QR code displays correctly
- ✅ Copy code works
- ✅ Download generates file
- ✅ Transfer button only for active tickets

### Event Creation:
- ✅ Form validation
- ✅ Required fields marked
- ✅ Success feedback
- ✅ Event appears in list

### Logout:
- ✅ Clears session
- ✅ Redirects immediately
- ✅ Can't access protected routes
- ✅ Works on both mobile/desktop

---

## Troubleshooting

### Profile Page Not Loading:
- Check user exists in database
- Verify uid parameter
- Check console for errors

### Can't Create Event:
- Ensure all required fields filled
- Check image URL is valid
- Verify dates are in future
- Check capacity is number

### Ticket Detail Not Showing:
- Verify ticket ID is valid
- Check user owns the ticket
- Look for Firebase errors

### Logout Not Working:
- Check AuthContext is properly configured
- Verify signOut function exists
- Check router is available

---

## Browser Console Commands

### Check current user:
```javascript
// Should show logged in user
console.log(window.localStorage.getItem('user'));
```

### Check route:
```javascript
// Should show current path
console.log(window.location.pathname);
```

---

## Known Issues

1. **Transfer Notifications**: Currently logs to console (needs email service)
2. **Image Upload**: Events require URL (could add file upload)
3. **Real-time Updates**: Posts don't auto-refresh (manual refresh needed)

---

## Success Criteria

All features are working if:
- ✅ Can view any user's profile
- ✅ Can click users anywhere in app
- ✅ Can view individual ticket details
- ✅ Can create events as host
- ✅ Can logout and get redirected
- ✅ Posts show in profiles
- ✅ Follow/unfollow works
- ✅ Navigation is smooth
- ✅ No console errors
- ✅ Mobile responsive

---

## Next Steps After Testing

1. Test on mobile device
2. Test with multiple users
3. Verify Firebase data is correct
4. Check performance
5. Test edge cases (no posts, no tickets, etc.)
6. Verify accessibility
7. Test with slow network

---

**Test Date**: November 16, 2025
**Features Version**: 2.0
**Status**: ✅ Ready for Testing
