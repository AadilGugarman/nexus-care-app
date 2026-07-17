# 🧪 DIRECTORY TESTING GUIDE

## Quick Test Steps

---

## 🎯 **Level 1: Locations** (`/directory`)

### What to Test
1. Navigate to `/directory`
2. Check layout and functionality

### Checklist
- [ ] **Page loads** without errors
- [ ] **Shows all locations** with doctor counts
- [ ] **Statistics show** at top (e.g., "674 doctors across 50 cities")
- [ ] **Search box** filters locations instantly
- [ ] **Each location card** is tappable/clickable
- [ ] **Locations sorted** by doctor count (highest first)
- [ ] **Icons display** correctly (📍 MapPin icons)
- [ ] **Dark theme** applied (slate-900 background)
- [ ] **Back to Home** link works

### Expected Look
```
Locations
674 doctors across 50 cities

Search: [____________]

📍 Anand
   149 doctors

📍 Nadiad  
   98 doctors

📍 Borsad
   76 doctors
```

---

## 🎯 **Level 2: Location Detail** (`/directory/location/[location]`)

### What to Test
1. Click any location (e.g., "Anand")
2. Should navigate to `/directory/location/Anand`

### Checklist
- [ ] **Page loads** without errors
- [ ] **Location name** shows in header
- [ ] **Statistics show** (e.g., "149 doctors • 8 specialities")
- [ ] **"All Doctors" button** is prominent (blue)
- [ ] **Specialities list** shows below
- [ ] **Each speciality** shows doctor count
- [ ] **Specialities sorted** by count (highest first)
- [ ] **Back button** (← Locations) works
- [ ] **Icons display** (🩺 Stethoscope icons)

### Expected Look
```
← Locations

Anand
149 doctors • 8 specialities

[All Doctors Button - Blue]

By Speciality:

🩺 Cardiology
   45 doctors

🩺 Physician
   32 doctors
```

---

## 🎯 **Level 3: Doctors List** (`/directory/location/[location]/[speciality]`)

### What to Test
1. Click "All Doctors" or any speciality
2. Should show filtered list

### Checklist - All Doctors
- [ ] Navigate to `/directory/location/Anand/all`
- [ ] **Shows all doctors** in that location
- [ ] **Header shows** "All Doctors"
- [ ] **Count shows** correctly
- [ ] **Back button** (← Anand) works

### Checklist - Speciality Filter
- [ ] Click any speciality (e.g., "Cardiology")
- [ ] Navigate to `/directory/location/Anand/Cardiology`
- [ ] **Shows only cardiologists** in Anand
- [ ] **Header shows** speciality name
- [ ] **Count shows** correctly
- [ ] **Back button** (← Anand) works

### Checklist - Doctor Cards
- [ ] **Doctor name** is prominent
- [ ] **Speciality badge** shows (green pill)
- [ ] **Hospital name** displays if available
- [ ] **Phone number** shows if available
- [ ] **Phone link** is clickable (tel: link)
- [ ] **Tap doctor card** navigates to profile
- [ ] **Sorted alphabetically** by doctor name

### Expected Look
```
← Anand

Cardiology
45 doctors in Anand

┌────────────────────────┐
│ Dr. John Smith      →  │
│ • Cardiology           │
│ 🏥 City Hospital      │
│ 📞 +91 99999 99999    │
└────────────────────────┘

┌────────────────────────┐
│ Dr. Jane Doe        →  │
│ • Cardiology           │
│ 🏥 General Hospital   │
│ 📞 +91 88888 88888    │
└────────────────────────┘
```

---

## 🎯 **Level 4: Doctor Profile** (`/directory/[doctorId]`)

### What to Test
1. Click any doctor from list
2. Should navigate to doctor profile

### Checklist
- [ ] **Profile page loads** (existing page)
- [ ] **No breaking changes** from redesign
- [ ] **All information displays** correctly
- [ ] **Call button** works
- [ ] **Directions button** works
- [ ] **Back button** navigates to doctors list

---

## 🔄 **Navigation Flow Testing**

### Complete Journey
Test the full user flow:

```
1. /directory
   ↓ Click "Anand"

2. /directory/location/Anand
   ↓ Click "Cardiology"

3. /directory/location/Anand/Cardiology
   ↓ Click "Dr. John Smith"

4. /directory/123
```

### Checklist
- [ ] **Each step** loads correctly
- [ ] **URLs update** properly
- [ ] **No console errors** in browser
- [ ] **Smooth transitions** between pages

---

## 🔙 **Back Navigation Testing**

Test back button functionality:

```
1. Start at doctor profile
   ↓ Click Back

2. Should go to doctors list
   ↓ Click Back

3. Should go to location detail
   ↓ Click Back

4. Should go to locations list
```

### Checklist
- [ ] **Back buttons visible** on all pages
- [ ] **Back navigation works** correctly
- [ ] **Breadcrumb shows** correct parent
- [ ] **State preserved** when going back

---

## 🔍 **Search Testing**

### Locations Search
1. Go to `/directory`
2. Type in search box

### Checklist
- [ ] **Search filters instantly** (no button needed)
- [ ] **Results update** as you type
- [ ] **Matches location names** correctly
- [ ] **Case insensitive** search works
- [ ] **Empty results** show appropriate message
- [ ] **Clear search** shows all locations again

### Test Cases
| Search Term | Expected Result |
|-------------|-----------------|
| "Anand" | Shows only Anand |
| "nad" | Shows Nadiad, Anand (contains "nad") |
| "xyz" | Shows "No locations found" |
| "" (empty) | Shows all locations |

---

## 📱 **Mobile Responsiveness**

### Device Testing

#### iPhone SE (375px)
- [ ] **All content fits** within viewport
- [ ] **No horizontal scroll**
- [ ] **Touch targets** are 44px+ height
- [ ] **Text is readable** (not too small)
- [ ] **Cards stack** properly
- [ ] **Buttons are tappable** with thumb

#### iPhone 12 (390px)
- [ ] Same as iPhone SE
- [ ] **Layout adjusts** properly

#### iPad (768px)
- [ ] **Still mobile-first** layout
- [ ] **Centered** with max-w-2xl
- [ ] **Margins** on sides
- [ ] **Touch targets** still large

#### Desktop (1024px+)
- [ ] **Centered** layout
- [ ] **Max width** 512px (max-w-2xl)
- [ ] **Margins** on sides
- [ ] **Clickable** with mouse
- [ ] **Hover states** work

---

## 🎨 **Visual Testing**

### Design Checklist
- [ ] **Dark theme** throughout (slate-900)
- [ ] **Rounded corners** on all cards (rounded-xl)
- [ ] **Consistent spacing** between elements
- [ ] **Icons colored** correctly:
  - [ ] Blue for primary actions
  - [ ] Emerald for specialities
  - [ ] Slate for neutral
- [ ] **Typography hierarchy** clear:
  - [ ] Page titles: Large, bold
  - [ ] Card titles: Medium, semibold
  - [ ] Body text: Small, regular
  - [ ] Captions: Extra small, light

### Interaction Testing
- [ ] **Cards change color** on hover (desktop)
- [ ] **Cards change color** on active/tap (mobile)
- [ ] **Buttons respond** to hover
- [ ] **Buttons respond** to active
- [ ] **Links change color** on hover
- [ ] **Smooth transitions** (no jarring changes)

---

## ⚡ **Performance Testing**

### Load Time
- [ ] **Locations page** loads < 2 seconds
- [ ] **Location detail** loads < 1 second
- [ ] **Doctors list** loads < 1 second
- [ ] **No visible lag** when filtering

### Data Fetching
- [ ] **Only fetches once** per page load
- [ ] **No redundant** API calls
- [ ] **Filtering happens** client-side (instant)
- [ ] **No loading spinners** after initial load

---

## 🐛 **Error Testing**

### Edge Cases
- [ ] **Empty location** (no doctors) - handled gracefully
- [ ] **No specialities** in location - shows message
- [ ] **Missing doctor data** - doesn't crash
- [ ] **Invalid URL** - redirects or shows error
- [ ] **Network error** - shows retry button

### URL Testing
Test these URLs directly:

- [ ] `/directory` - Works
- [ ] `/directory/location/InvalidCity` - Handles gracefully
- [ ] `/directory/location/Anand` - Works
- [ ] `/directory/location/Anand/all` - Works
- [ ] `/directory/location/Anand/InvalidSpeciality` - Handles gracefully
- [ ] `/directory/123` - Works (existing profile)
- [ ] `/directory/999999` - Handles invalid ID

---

## ✅ **Final Checklist**

### Must Pass
- [ ] ✅ All 4 levels load correctly
- [ ] ✅ Navigation flows smoothly
- [ ] ✅ Back buttons work
- [ ] ✅ Search filters locations
- [ ] ✅ Phone links are clickable
- [ ] ✅ Mobile responsive (375px-1024px+)
- [ ] ✅ No console errors
- [ ] ✅ Dark theme consistent
- [ ] ✅ Touch targets 44px+
- [ ] ✅ Build successful

### Nice to Have
- [ ] ✨ Smooth animations
- [ ] ✨ Fast load times (<1s)
- [ ] ✨ Offline error handling
- [ ] ✨ Browser back button works

---

## 🚀 **Quick Test Commands**

### Browser DevTools
```
1. Open DevTools (F12)
2. Go to "Responsive Design Mode"
3. Test these sizes:
   - 375px (iPhone SE)
   - 390px (iPhone 12)
   - 768px (iPad)
   - 1024px (Desktop)
```

### Console Check
```
1. Open Console tab
2. Navigate through all levels
3. Should see NO errors
4. Should see tracking logs (optional)
```

### Network Check
```
1. Open Network tab
2. Reload page
3. Check:
   - Only 1-2 API calls
   - Fast response times
   - No failed requests
```

---

## 📊 **Success Criteria**

All tests pass if:
- ✅ 4-level navigation works
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Fast performance
- ✅ iOS-inspired design
- ✅ Easy to browse doctors

**Happy Testing!** 🧪✨
