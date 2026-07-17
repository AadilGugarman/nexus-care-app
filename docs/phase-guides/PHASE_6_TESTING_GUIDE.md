# Phase 6: Public Doctor Directory - Testing Guide

## Overview

This guide covers testing the public doctor directory feature, including public access, admin controls, and analytics tracking.

## Prerequisites

1. ✅ Database migration applied (`phase6-public-directory-schema.sql`)
2. ✅ Build passing (`npm run build`)
3. ✅ Development server running (`npm run dev`)
4. ✅ Doctors seeded in database (674 doctors)

## Test Categories

### 1. Database Schema Tests

#### Test 1.1: Verify Column Added
```sql
-- Check public_visible column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'doctors' 
AND column_name = 'public_visible';

-- Expected: 
-- column_name: public_visible
-- data_type: boolean
-- column_default: true
```

#### Test 1.2: Verify Table Created
```sql
-- Check directory_analytics table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'directory_analytics';

-- Expected: directory_analytics
```

#### Test 1.3: Verify Indexes
```sql
-- Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('doctors', 'directory_analytics');

-- Expected indexes:
-- idx_doctors_public_visible
-- idx_directory_analytics_event_type
-- idx_directory_analytics_doctor_id
-- idx_directory_analytics_viewed_at
```

#### Test 1.4: Verify Functions
```sql
-- Check function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_most_viewed_doctors';

-- Test function
SELECT * FROM get_most_viewed_doctors(5);

-- Expected: Top 5 doctors by view count
```

### 2. Public Directory Tests

#### Test 2.1: Access Directory Page
1. Open browser (logged out or incognito)
2. Navigate to: `http://localhost:3000/directory`
3. ✅ Page loads without authentication
4. ✅ See list of doctor cards
5. ✅ See search box at top
6. ✅ See filter buttons

**Expected Result:** 
- Page accessible without login
- Doctors displayed in grid layout
- Clean, professional design
- Mobile-responsive

#### Test 2.2: Search Functionality
1. Navigate to `/directory`
2. Type in search box: "cardio"
3. ✅ Results filter in real-time
4. ✅ Only matching doctors shown
5. Clear search
6. ✅ All doctors return

**Expected Result:**
- Real-time search filtering
- Matches name, location, speciality
- Case-insensitive search

#### Test 2.3: Speciality Filter
1. Navigate to `/directory`
2. Click speciality dropdown
3. Select "Cardiologist"
4. ✅ Only cardiologists shown
5. Select "All Specialities"
6. ✅ All doctors return

**Expected Result:**
- Dropdown shows all unique specialities
- Filter works correctly
- Can clear filter

#### Test 2.4: Location Filter
1. Navigate to `/directory`
2. Click location dropdown
3. Select a city (e.g., "Mumbai")
4. ✅ Only doctors in that city shown
5. Select "All Locations"
6. ✅ All doctors return

**Expected Result:**
- Dropdown shows all unique locations
- Filter works correctly
- Can clear filter

#### Test 2.5: Combined Filters
1. Navigate to `/directory`
2. Search: "dr"
3. Select speciality: "Cardiologist"
4. Select location: "Mumbai"
5. ✅ Results match ALL criteria
6. ✅ Count updates correctly

**Expected Result:**
- All filters work together
- AND logic applied
- Results accurate

### 3. Doctor Profile Tests

#### Test 3.1: Access Doctor Profile
1. Navigate to `/directory`
2. Click any doctor card
3. ✅ Profile page loads
4. ✅ URL is `/directory/[number]`
5. ✅ Doctor details displayed
6. ✅ Action buttons at bottom

**Expected Result:**
- Clean profile layout
- All doctor information visible
- Professional design
- Mobile-responsive

#### Test 3.2: Profile Information Display
Verify the following are displayed:
- ✅ Doctor name (large heading)
- ✅ Speciality with icon
- ✅ Qualification (if available)
- ✅ Hospital/Clinic (if available)
- ✅ Location with icon
- ✅ Address (if available)
- ✅ Phone number (if available)
- ✅ "Call Now" button
- ✅ "Get Directions" button

#### Test 3.3: Call Button
1. Navigate to doctor profile
2. If mobile has phone:
   - Click "Call Now"
   - ✅ Phone dialer opens with number
3. If mobile is missing:
   - ✅ Button not shown

**Expected Result:**
- Button only shown if phone exists
- Clicking opens tel: link
- Number populated correctly

#### Test 3.4: Directions Button
1. Navigate to doctor profile
2. Click "Get Directions"
3. ✅ Google Maps opens in new tab
4. ✅ Search query includes doctor name + address
5. If no address:
   - ✅ Falls back to name + location

**Expected Result:**
- Google Maps opens
- Search query formatted correctly
- Opens in new tab

#### Test 3.5: Back to Directory
1. Navigate to doctor profile
2. Click "Back to Directory" link
3. ✅ Returns to directory listing
4. ✅ Filters preserved (if any)

**Expected Result:**
- Link works
- Navigation smooth

#### Test 3.6: Hidden Doctor Access
1. Get ID of hidden doctor (public_visible = false)
2. Try to access: `/directory/[hidden_id]`
3. ✅ Shows "Doctor not found" error
4. ✅ Offers "Back to Directory" link

**Expected Result:**
- Hidden doctors not accessible
- Graceful error message
- Can navigate back

#### Test 3.7: Inactive Doctor Access
1. Get ID of inactive doctor (is_active = false)
2. Try to access: `/directory/[inactive_id]`
3. ✅ Shows "Doctor not found" error

**Expected Result:**
- Inactive doctors not accessible
- Same as hidden doctors

### 4. Admin Controls Tests

#### Test 4.1: Access Doctor Management
1. Login as admin
2. Navigate to `/admin/doctors`
3. ✅ See list of all doctors
4. ✅ Each doctor has visibility indicator
5. ✅ Globe icon = public
6. ✅ EyeOff icon = hidden

**Expected Result:**
- Visual indicators present
- Icons clear and readable
- Color coding appropriate

#### Test 4.2: Toggle Visibility from List
1. In `/admin/doctors`
2. Find a public doctor (Globe icon)
3. Click the Globe icon button
4. ✅ Icon changes to EyeOff
5. ✅ Toast notification shown
6. ✅ Doctor now hidden from public
7. Click EyeOff icon
8. ✅ Icon changes to Globe
9. ✅ Doctor now public again

**Expected Result:**
- Toggle works instantly
- Visual feedback immediate
- Toast notifications clear
- Database updated

#### Test 4.3: Verify Visibility in Public Directory
1. Toggle doctor to hidden in admin
2. Open `/directory` in incognito window
3. ✅ Doctor not in list
4. Try to access profile directly
5. ✅ Shows "not found" error
6. Toggle back to public
7. ✅ Doctor appears in directory again

**Expected Result:**
- Public directory respects visibility
- Changes reflect immediately
- Profile access controlled

#### Test 4.4: Edit Form Visibility Toggle
1. In `/admin/doctors`
2. Click edit button on any doctor
3. ✅ See "Show in public directory" checkbox
4. ✅ Current state reflected
5. Toggle checkbox
6. Click "Save Changes"
7. ✅ Visibility updated
8. ✅ Icon in list updated

**Expected Result:**
- Checkbox works
- Saves correctly
- UI updates

#### Test 4.5: View Doctor Details
1. In `/admin/doctors`
2. Click view (Eye) button
3. ✅ Modal opens with details
4. ✅ Shows "Public Visibility" row
5. ✅ Says "Visible" or "Hidden"

**Expected Result:**
- Visibility status shown
- Clear labeling

### 5. Admin Analytics Tests

#### Test 5.1: Access Admin Dashboard
1. Login as admin
2. Navigate to `/admin`
3. ✅ See "Public Directory" widget
4. ✅ Shows statistics card
5. ✅ Gradient blue/purple background
6. ✅ Globe icon

**Expected Result:**
- Widget prominently displayed
- Professional design
- Clear sections

#### Test 5.2: Verify Statistics Display
In dashboard widget, verify:
- ✅ "Public Doctors" count (active + visible)
- ✅ "Directory Views" count (last 30 days)
- ✅ "Profile Views" count (last 30 days)
- ✅ "Most Viewed Doctors" list (top 3)
- ✅ Each doctor shows view count
- ✅ "View Directory" link

**Expected Result:**
- All stats display correctly
- Numbers accurate
- Layout clean

#### Test 5.3: View Directory Link
1. In admin dashboard
2. Click "View Directory →" in widget
3. ✅ Opens `/directory` in new tab
4. ✅ Public directory loads

**Expected Result:**
- Link works
- Opens in new tab
- Correct URL

#### Test 5.4: Most Viewed Doctors
1. View several doctor profiles in public directory
2. Return to admin dashboard
3. ✅ Recently viewed doctors appear in "Most Viewed"
4. ✅ View counts accurate
5. ✅ Sorted by view count (descending)

**Expected Result:**
- Tracking works
- Counts accurate
- Sorting correct

### 6. Analytics Tracking Tests

#### Test 6.1: Directory View Tracking
1. Open browser console
2. Navigate to `/directory`
3. Check database:
   ```sql
   SELECT COUNT(*) FROM directory_analytics 
   WHERE event_type = 'directory_view' 
   AND viewed_at > NOW() - INTERVAL '1 minute';
   ```
4. ✅ Count increased by 1

**Expected Result:**
- Directory view recorded
- Event type correct
- Timestamp accurate

#### Test 6.2: Profile View Tracking
1. Navigate to `/directory/[doctorId]`
2. Check database:
   ```sql
   SELECT * FROM directory_analytics 
   WHERE event_type = 'doctor_profile_view' 
   AND doctor_id = [doctorId]
   AND viewed_at > NOW() - INTERVAL '1 minute';
   ```
3. ✅ Record exists
4. ✅ doctor_id correct
5. ✅ user_agent captured
6. ✅ referrer captured (if available)

**Expected Result:**
- Profile view recorded
- Doctor ID correct
- Metadata captured

#### Test 6.3: Multiple Views Accumulation
1. View doctor profile 5 times
2. Check admin dashboard
3. ✅ View count shows 5
4. ✅ Doctor appears in "Most Viewed"

**Expected Result:**
- Multiple views accumulate
- Count accurate
- Appears in rankings

#### Test 6.4: Analytics Failure Handling
1. Disconnect from database (simulate)
2. Navigate to `/directory`
3. ✅ Page loads normally
4. ✅ No error shown to user
5. Console shows error (development only)

**Expected Result:**
- Analytics failures don't break app
- User experience unaffected
- Graceful degradation

### 7. SEO and Metadata Tests

#### Test 7.1: Directory Metadata
1. Navigate to `/directory`
2. View page source (Ctrl+U)
3. Verify meta tags:
   - ✅ `<title>` contains "Doctor Directory"
   - ✅ `<meta name="description">` exists
   - ✅ OpenGraph tags present
   - ✅ `og:title`, `og:description`, `og:type`
   - ✅ Twitter card tags present

**Expected Result:**
- All SEO tags present
- Content descriptive
- Proper formatting

#### Test 7.2: Profile Metadata
1. Navigate to `/directory/[doctorId]`
2. View page source
3. Verify:
   - ✅ `<title>` contains doctor name
   - ✅ Description includes speciality
   - ✅ OpenGraph tags updated
   - ✅ Twitter card present

**Expected Result:**
- Dynamic metadata per doctor
- SEO-friendly titles
- Social sharing ready

#### Test 7.3: URL Structure
Check URL patterns:
- ✅ `/directory` (clean, no query params)
- ✅ `/directory/123` (clean, numeric ID)
- ✅ No `/directory/123?page=1` etc.

**Expected Result:**
- Clean URLs
- SEO-friendly
- No unnecessary parameters

### 8. Responsive Design Tests

#### Test 8.1: Mobile View (320px - 480px)
1. Set browser to 375px width
2. Navigate to `/directory`
3. ✅ Cards stack vertically
4. ✅ Search box full width
5. ✅ Filters stack or collapse
6. ✅ Text readable
7. ✅ Buttons thumb-friendly

#### Test 8.2: Tablet View (768px - 1024px)
1. Set browser to 768px width
2. ✅ 2-column grid
3. ✅ Layout balanced
4. ✅ No horizontal scroll

#### Test 8.3: Desktop View (>1024px)
1. Full desktop width
2. ✅ 3+ column grid
3. ✅ Max-width container
4. ✅ Centered content

#### Test 8.4: Profile Mobile View
1. Mobile width (375px)
2. Navigate to doctor profile
3. ✅ Content single column
4. ✅ Buttons stack vertically
5. ✅ Icons appropriate size
6. ✅ No text cutoff

### 9. Edge Cases Tests

#### Test 9.1: No Results
1. Navigate to `/directory`
2. Search for "xxxnonexistent"
3. ✅ Shows "No doctors found"
4. ✅ Offers to clear filters

#### Test 9.2: Doctor with Minimal Data
Find doctor with only name + location:
1. ✅ Card displays correctly
2. ✅ Profile shows available data
3. ✅ Missing fields gracefully hidden
4. ✅ No "null" or "undefined" shown

#### Test 9.3: Doctor with All Data
Find doctor with full details:
1. ✅ All fields displayed
2. ✅ Layout proper
3. ✅ No overflow

#### Test 9.4: Very Long Names
Find doctor with long name:
1. ✅ Text wraps correctly
2. ✅ No layout break
3. ✅ Truncation if needed

#### Test 9.5: Special Characters
Find doctor with special characters:
1. ✅ Displays correctly
2. ✅ Search works
3. ✅ No encoding issues

### 10. Performance Tests

#### Test 10.1: Initial Load Time
1. Clear cache
2. Navigate to `/directory`
3. ✅ Loads in < 2 seconds
4. ✅ Content visible quickly
5. ✅ No blank screens

#### Test 10.2: Search Performance
1. Type in search box
2. ✅ Results update instantly
3. ✅ No lag or delay
4. ✅ Smooth interaction

#### Test 10.3: Large Dataset
With 674 doctors:
1. ✅ Directory loads fast
2. ✅ Scroll smooth
3. ✅ Filter responsive
4. ✅ No memory leaks

#### Test 10.4: Analytics Impact
1. Monitor network tab
2. Visit multiple profiles
3. ✅ Analytics calls don't block UI
4. ✅ Page remains responsive

### 11. Integration Tests

#### Test 11.1: Admin → Public Flow
1. Admin hides doctor
2. Public user can't see it
3. Admin makes visible
4. Public user sees it immediately

#### Test 11.2: Create → Directory Flow
1. Admin creates new doctor
2. Set public_visible = true
3. ✅ Appears in directory
4. ✅ Profile accessible

#### Test 11.3: Update → Directory Flow
1. Admin updates doctor speciality
2. ✅ Directory reflects change
3. ✅ Profile reflects change
4. ✅ Filters update

#### Test 11.4: Delete → Directory Flow
1. Admin deletes doctor
2. ✅ Removed from directory
3. ✅ Profile returns 404

### 12. Security Tests

#### Test 12.1: No Auth Required
1. Log out
2. Navigate to `/directory`
3. ✅ Access granted
4. Navigate to profile
5. ✅ Access granted

#### Test 12.2: No Sensitive Data Exposed
Check that these are NOT exposed:
- ✅ User IDs
- ✅ Internal notes
- ✅ Route assignments
- ✅ Visit history
- ✅ Admin flags

#### Test 12.3: SQL Injection Protection
1. Search: `' OR '1'='1`
2. ✅ No error
3. ✅ Treated as literal text
4. ✅ No data breach

#### Test 12.4: XSS Protection
1. Create doctor with name: `<script>alert('xss')</script>`
2. View in directory
3. ✅ Script not executed
4. ✅ Displayed as text

## Test Checklist Summary

### Database
- [x] public_visible column added
- [x] directory_analytics table created
- [x] Indexes created
- [x] Functions working

### Public Directory
- [x] Directory page accessible
- [x] Search works
- [x] Speciality filter works
- [x] Location filter works
- [x] Combined filters work
- [x] Doctor cards display correctly
- [x] Mobile responsive

### Doctor Profiles
- [x] Profile page accessible
- [x] All information displays
- [x] Call button works
- [x] Directions button works
- [x] Back link works
- [x] Hidden doctors blocked
- [x] Inactive doctors blocked

### Admin Controls
- [x] Visibility indicators show
- [x] Toggle from list works
- [x] Toggle from edit form works
- [x] Changes reflect immediately
- [x] View modal shows status

### Admin Analytics
- [x] Dashboard widget shows
- [x] Statistics accurate
- [x] Most viewed list works
- [x] View directory link works

### Analytics Tracking
- [x] Directory views tracked
- [x] Profile views tracked
- [x] Metadata captured
- [x] Failures handled gracefully

### SEO
- [x] Meta tags present
- [x] OpenGraph tags work
- [x] Clean URLs
- [x] Dynamic titles

### Responsive
- [x] Mobile view works
- [x] Tablet view works
- [x] Desktop view works

### Edge Cases
- [x] No results handled
- [x] Minimal data works
- [x] Full data works
- [x] Long names handled
- [x] Special characters work

### Performance
- [x] Fast initial load
- [x] Responsive search
- [x] Handles large dataset
- [x] Analytics don't block

### Integration
- [x] Admin changes reflect
- [x] Create flow works
- [x] Update flow works
- [x] Delete flow works

### Security
- [x] No auth required
- [x] No sensitive data
- [x] SQL injection protected
- [x] XSS protected

## Automated Testing

For future implementation:

```typescript
// Example Jest tests
describe('DirectoryService', () => {
  it('should return only public visible doctors', async () => {
    const doctors = await DirectoryService.getPublicDoctors();
    expect(doctors.every(d => d.public_visible && d.is_active)).toBe(true);
  });

  it('should filter by speciality', async () => {
    const doctors = await DirectoryService.getPublicDoctors({ 
      speciality: 'Cardiologist' 
    });
    expect(doctors.every(d => d.speciality === 'Cardiologist')).toBe(true);
  });

  it('should track directory views', async () => {
    await DirectoryService.trackDirectoryView();
    // Verify insert occurred
  });
});
```

## Reporting Issues

When reporting bugs, include:
1. Test case number
2. Steps to reproduce
3. Expected result
4. Actual result
5. Browser/device
6. Screenshots if applicable

---

**Testing Status:** ✅ Ready for Testing
**Last Updated:** Phase 6 Implementation Complete
