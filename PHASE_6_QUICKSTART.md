# Phase 6: Public Directory - Quick Start Guide

## What Was Built

Phase 6 adds a **public-facing doctor directory** that anyone can access without logging in.

### Key Features
- 🔍 Browse and search 674 doctors
- 📍 Filter by location and speciality
- 📞 Direct call functionality
- 🗺️ Google Maps integration
- 📊 Analytics tracking
- 👁️ Admin visibility controls

---

## 🚀 Getting Started (3 Minutes)

### Step 1: Run Database Migration (1 min)

```bash
# Connect to your Supabase database
psql -h [your-host] -U postgres -d postgres -f phase6-public-directory-schema.sql
```

Or in Supabase Dashboard → SQL Editor:
- Open `phase6-public-directory-schema.sql`
- Run the entire file

**What it does:**
- Adds `public_visible` column to doctors table
- Creates `directory_analytics` table for tracking
- Creates database functions for analytics
- Creates performance indexes

### Step 2: Build & Verify (1 min)

```bash
npm run build
```

**Expected output:**
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Collecting page data
✓ Generating static pages (17/17)
Route (app)
├ ○ /directory              # 🆕 New!
├ ƒ /directory/[doctorId]   # 🆕 New!
```

### Step 3: Test It Out (1 min)

```bash
npm run dev
```

1. Open browser: `http://localhost:3000/directory`
2. ✅ See list of doctors (no login required)
3. ✅ Try search: type "cardio"
4. ✅ Click a doctor to view profile
5. ✅ Click "Call Now" or "Get Directions"

**Admin Testing:**
1. Login as admin
2. Go to `/admin/doctors`
3. ✅ See Globe/EyeOff icons on each doctor
4. ✅ Click to toggle public visibility
5. ✅ Check `/directory` - hidden doctors not shown

---

## 📁 What Changed

### New Files (7)
```
src/app/directory/layout.tsx                  # SEO metadata
src/app/directory/page.tsx                    # Directory listing
src/app/directory/[doctorId]/page.tsx         # Doctor profile
src/lib/supabase/services/directory.service.ts # Service layer
docs/phase-guides/PHASE_6_PUBLIC_DIRECTORY_IMPLEMENTATION.md
docs/phase-guides/PHASE_6_TESTING_GUIDE.md
phase6-public-directory-schema.sql
```

### Modified Files (5)
```
src/app/admin/page.tsx                        # Added directory stats widget
src/app/admin/doctors/page.tsx                # Added visibility toggle
src/lib/supabase/services/index.ts            # Export DirectoryService
src/lib/supabase/database.types.ts            # Added public_visible
src/components/doctor-management-dialog.tsx   # Added public_visible
```

---

## 🎯 Key Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/directory` | Public (no auth) | Browse all doctors |
| `/directory/[id]` | Public (no auth) | View doctor profile |
| `/admin/doctors` | Admin only | Manage visibility |
| `/admin` | Admin only | View directory stats |

---

## 🔑 Key Concepts

### Public Visibility
- **Default:** All doctors are `public_visible = true`
- **Admin Control:** Toggle per doctor in `/admin/doctors`
- **Display Rule:** Only shows doctors where:
  - `is_active = true` AND
  - `public_visible = true`

### Analytics Tracking
- **Directory Views:** Tracked when user visits `/directory`
- **Profile Views:** Tracked when user visits `/directory/[id]`
- **Non-blocking:** Failures don't break the app
- **Admin View:** See stats in `/admin` dashboard

### Data Isolation
- **Public Sees:**
  - Name, speciality, qualification
  - Hospital, location, address
  - Phone number
- **Public Does NOT See:**
  - User IDs, route assignments
  - Visit history, internal notes
  - Admin-only data

---

## 🧪 Quick Test Checklist

### Public Access (No Login)
- [ ] Can access `/directory`
- [ ] See list of doctors
- [ ] Search works
- [ ] Filters work (speciality, location)
- [ ] Can click doctor card
- [ ] Profile page loads
- [ ] Call button works (if phone present)
- [ ] Directions button opens Google Maps

### Admin Controls (Login Required)
- [ ] See Globe icon = public, EyeOff = hidden
- [ ] Can toggle visibility
- [ ] Changes reflect immediately in public directory
- [ ] Dashboard shows directory stats
- [ ] Most viewed doctors list displays

### Mobile Responsive
- [ ] Works on mobile (375px width)
- [ ] Cards stack properly
- [ ] Buttons are thumb-friendly
- [ ] No horizontal scroll

---

## 📊 Admin Dashboard Widget

After migration, admin dashboard (`/admin`) shows:

```
┌─────────────────────────────────────────┐
│  🌐 Public Directory                    │
├─────────────────────────────────────────┤
│  Public Doctors: 674                    │
│  Directory Views: 1,234                 │
│  Profile Views: 456                     │
├─────────────────────────────────────────┤
│  Most Viewed Doctors:                   │
│  • Dr. Smith - 45 views                 │
│  • Dr. Patel - 32 views                 │
│  • Dr. Kumar - 28 views                 │
└─────────────────────────────────────────┘
```

---

## 🔄 Rollback (If Needed)

```sql
-- Revert database changes
DROP TABLE IF EXISTS directory_analytics;
DROP FUNCTION IF EXISTS get_most_viewed_doctors;
DROP FUNCTION IF EXISTS get_directory_view_counts;
DROP VIEW IF EXISTS directory_analytics_summary;
ALTER TABLE doctors DROP COLUMN IF EXISTS public_visible;
```

```bash
# Remove directory routes
rm -rf src/app/directory

# Remove service
rm src/lib/supabase/services/directory.service.ts

# Rebuild
npm run build
```

---

## 📖 Full Documentation

- **Implementation Guide:** `docs/phase-guides/PHASE_6_PUBLIC_DIRECTORY_IMPLEMENTATION.md`
- **Testing Guide:** `docs/phase-guides/PHASE_6_TESTING_GUIDE.md`
- **Completion Report:** `PHASE_6_COMPLETE.md`

---

## ❓ FAQ

**Q: Do I need to update existing doctors?**  
A: No. Default `public_visible = true` applies to all existing doctors.

**Q: Can public users add/edit doctors?**  
A: No. Public directory is read-only. Only admins can modify data.

**Q: What if analytics tracking fails?**  
A: The app continues to work. Tracking failures are logged but don't break the UI.

**Q: How do I hide a doctor from public?**  
A: Login as admin → `/admin/doctors` → Click Globe icon to toggle off.

**Q: Can I customize which fields are shown?**  
A: Yes. Edit `src/lib/supabase/services/directory.service.ts` and the profile page.

**Q: Does this affect the MR app?**  
A: No. The MR app is completely unchanged. This is purely additive.

**Q: Is it mobile-friendly?**  
A: Yes. Mobile-first design with responsive layout.

**Q: Is it SEO-optimized?**  
A: Yes. Includes meta tags, OpenGraph, Twitter cards, and clean URLs.

---

## 🎉 Success Criteria

You'll know Phase 6 is working when:

✅ Build passes with zero errors  
✅ `/directory` loads without login  
✅ Doctor search and filters work  
✅ Profile pages show doctor details  
✅ Call and directions buttons work  
✅ Admin can toggle visibility  
✅ Dashboard shows directory stats  
✅ Mobile view is responsive  

---

## 🆘 Troubleshooting

### "Doctor not found" on profile page
- Check doctor is active: `is_active = true`
- Check doctor is public: `public_visible = true`
- Verify doctor ID exists in database

### Directory page is empty
- Check database connection
- Verify doctors exist with `is_active = true` and `public_visible = true`
- Check browser console for errors

### Stats not showing on admin dashboard
- Check database migration ran successfully
- Verify `directory_analytics` table exists
- Check for analytics tracking errors in console

### Build fails with TypeScript errors
- Run `npm install` to ensure dependencies are updated
- Check `public_visible` added to `database.types.ts`
- Verify all imports are correct

---

## 📞 Next Steps

1. ✅ Run database migration
2. ✅ Test in development (`npm run dev`)
3. ⏳ Manual QA testing
4. ⏳ Stakeholder demo
5. ⏳ Deploy to staging
6. ⏳ Deploy to production

---

**Phase 6 Status:** ✅ COMPLETE  
**Build Status:** ✅ PASSING  
**Ready for Deployment:** ✅ YES

For detailed information, see `PHASE_6_COMPLETE.md` and the implementation guide.
