# Phase 6: Public Doctor Directory - Implementation Guide

## Overview

Phase 6 adds a public-facing doctor directory that allows anyone to browse and search for doctors without authentication. The directory is completely separate from the main MR application and admin panel.

## Architecture

### Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 6 ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                          │
│  │  Public Users    │                                          │
│  │  (No Auth)       │                                          │
│  └────────┬─────────┘                                          │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────────────────────────────────────┐         │
│  │         /directory (Public Routes)               │         │
│  │  • Doctor listing with search & filters          │         │
│  │  • Doctor profile pages                          │         │
│  │  • Call & directions buttons                     │         │
│  └────────┬─────────────────────────────────────────┘         │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────────────────────────────────────┐         │
│  │         DirectoryService                         │         │
│  │  • getPublicDoctors() - with filters             │         │
│  │  • getPublicDoctorById()                         │         │
│  │  • trackDirectoryView()                          │         │
│  │  • trackDoctorView()                             │         │
│  └────────┬─────────────────────────────────────────┘         │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────────────────────────────────────┐         │
│  │         Database                                 │         │
│  │  • doctors (public_visible filter)               │         │
│  │  • directory_analytics (tracking)                │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │         Admin Controls                           │         │
│  │  • Public visibility toggles                     │         │
│  │  • Directory analytics dashboard                 │         │
│  │  • Most viewed doctors                           │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Visibility Rules

Only doctors that meet **ALL** criteria are shown:
- `is_active = true` (active status)
- `public_visible = true` (admin-controlled visibility)

Hidden doctors:
- Inactive doctors (`is_active = false`)
- Explicitly hidden (`public_visible = false`)

## Database Schema

### New Column: `public_visible`

```sql
-- Add public visibility control to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS public_visible BOOLEAN DEFAULT true;

-- Create index for public queries
CREATE INDEX IF NOT EXISTS idx_doctors_public_visible 
ON doctors(public_visible, is_active) 
WHERE is_active = true AND public_visible = true;
```

### New Table: `directory_analytics`

```sql
CREATE TABLE IF NOT EXISTS directory_analytics (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- 'directory_view' or 'doctor_profile_view'
  doctor_id INTEGER REFERENCES doctors(id),
  viewed_at TIMESTAMP DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT
);

-- Indexes for analytics queries
CREATE INDEX idx_directory_analytics_event_type ON directory_analytics(event_type);
CREATE INDEX idx_directory_analytics_doctor_id ON directory_analytics(doctor_id);
CREATE INDEX idx_directory_analytics_viewed_at ON directory_analytics(viewed_at);
```

### Helper Functions

```sql
-- Get most viewed doctors
CREATE OR REPLACE FUNCTION get_most_viewed_doctors(limit_count INT DEFAULT 10)
RETURNS TABLE (
  doctor_id INT,
  doctor_name VARCHAR,
  speciality VARCHAR,
  location VARCHAR,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.doctor_name,
    d.speciality,
    d.location,
    COUNT(da.id) as view_count
  FROM doctors d
  INNER JOIN directory_analytics da ON da.doctor_id = d.id
  WHERE da.event_type = 'doctor_profile_view'
    AND d.is_active = true
    AND d.public_visible = true
  GROUP BY d.id, d.doctor_name, d.speciality, d.location
  ORDER BY view_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

## Implementation

### 1. Directory Service (`src/lib/supabase/services/directory.service.ts`)

The DirectoryService handles all public directory operations:

**Public Queries:**
- `getPublicDoctors(filters?)` - List doctors with optional search/filters
- `getPublicDoctorById(id)` - Get single doctor profile
- `getPublicSpecialities()` - Get unique specialities for filters
- `getPublicLocations()` - Get unique locations for filters

**Analytics Tracking:**
- `trackDirectoryView()` - Track directory page views
- `trackDoctorView(doctorId)` - Track individual profile views

**Admin Functions:**
- `updateDoctorVisibility(doctorId, visible)` - Toggle public visibility
- `getDoctorVisibilityStats()` - Get visibility statistics
- `getDirectoryAnalytics(days)` - Get analytics for date range
- `getMostViewedDoctors(limit)` - Get top viewed doctors

### 2. Directory Routes

**Main Directory Page** (`/directory`):
- List all public doctors
- Search by name, location, speciality
- Filter by speciality and location
- Responsive card layout
- Mobile-first design

**Doctor Profile Page** (`/directory/[doctorId]`):
- Display doctor details
- Call button (tel: link)
- Get Directions button (Google Maps)
- SEO metadata
- Analytics tracking

### 3. Admin Integration

**Doctor Management** (`/admin/doctors`):
- Public visibility toggle on each doctor
- Visual indicator (Globe icon = public, EyeOff = hidden)
- Quick toggle button in doctor list
- Checkbox in edit form

**Admin Dashboard** (`/admin`):
- Directory statistics widget
- Shows: public doctors count, total views, profile views
- Most viewed doctors list (top 3)
- Link to public directory

## Features

### Public Directory Features

1. **Search & Filters**
   - Text search across name, location, speciality
   - Filter by speciality dropdown
   - Filter by location dropdown
   - Real-time filtering

2. **Doctor Cards**
   - Doctor name
   - Speciality with icon
   - Location with icon
   - Hospital/clinic name
   - Clean, modern design

3. **Doctor Profile**
   - Full contact information
   - Qualification
   - Hospital affiliation
   - Address
   - Phone number
   - Call Now button
   - Get Directions button

4. **SEO Optimization**
   - Metadata tags
   - OpenGraph tags
   - Twitter card support
   - Clean URLs
   - Semantic HTML

5. **Analytics**
   - Directory view tracking
   - Profile view tracking
   - User agent capture
   - Referrer tracking
   - Non-blocking (failures don't break app)

### Admin Features

1. **Visibility Control**
   - Toggle public visibility per doctor
   - Visual indicators in doctor list
   - Bulk visibility stats
   - Default: public_visible = true

2. **Analytics Dashboard**
   - Total public doctors
   - Directory views (last 30 days)
   - Profile views (last 30 days)
   - Most viewed doctors
   - View counts per doctor

## File Structure

```
src/
├── app/
│   ├── directory/
│   │   ├── layout.tsx              # SEO metadata, public layout
│   │   ├── page.tsx                # Directory listing page
│   │   └── [doctorId]/
│   │       └── page.tsx            # Doctor profile page
│   └── admin/
│       ├── page.tsx                # Dashboard with directory stats
│       └── doctors/
│           └── page.tsx            # Doctor management with visibility toggle
├── lib/
│   └── supabase/
│       ├── services/
│       │   ├── directory.service.ts # Public directory service
│       │   └── index.ts            # Export DirectoryService
│       └── database.types.ts       # Added public_visible to DoctorRow/Update
└── components/
    └── doctor-management-dialog.tsx # Added public_visible field

database/
└── phase6-public-directory-schema.sql # Complete schema
```

## Type Updates

### `database.types.ts`

```typescript
export interface DoctorRow {
  // ... existing fields
  public_visible: boolean; // Added in Phase 6
}

export interface DoctorUpdate {
  // ... existing fields
  public_visible?: boolean; // Added in Phase 6
}
```

## Usage Examples

### Public User - Browse Directory

1. Navigate to `/directory`
2. See all active, public doctors
3. Search by name: "Dr. Smith"
4. Filter by speciality: "Cardiologist"
5. Filter by location: "Mumbai"
6. Click doctor card to view profile

### Public User - View Profile

1. Navigate to `/directory/[doctorId]`
2. View doctor details
3. Click "Call Now" - opens phone dialer
4. Click "Get Directions" - opens Google Maps

### Admin - Control Visibility

1. Navigate to `/admin/doctors`
2. See Globe icon = public, EyeOff icon = hidden
3. Click Globe/EyeOff button to toggle visibility
4. Or edit doctor and toggle "Show in public directory"
5. View directory stats on dashboard

### Admin - View Analytics

1. Navigate to `/admin`
2. See "Public Directory" widget
3. View: public doctors count, views, most viewed
4. Click "View Directory" to open public site

## Data Flow

### Public Doctor Query
```
User → /directory 
  → DirectoryService.getPublicDoctors(filters)
  → SELECT * FROM doctors 
      WHERE is_active = true 
      AND public_visible = true
      [+ filters]
  → Display doctor cards
```

### Profile View with Tracking
```
User → /directory/[doctorId]
  → DirectoryService.getPublicDoctorById(id)
  → SELECT * FROM doctors WHERE id = ? AND is_active = true AND public_visible = true
  → DirectoryService.trackDoctorView(id)
  → INSERT INTO directory_analytics (event_type, doctor_id, ...)
  → Display profile
```

### Visibility Toggle
```
Admin → Toggle visibility button
  → DirectoryService.updateDoctorVisibility(id, visible)
  → UPDATE doctors SET public_visible = ? WHERE id = ?
  → Refresh doctor list
  → Show toast notification
```

## Security Considerations

1. **No Authentication Required**
   - Public routes are accessible to everyone
   - No user session needed
   - Read-only access

2. **Data Filtering**
   - Only active + public_visible doctors shown
   - No internal notes or admin data exposed
   - No user IDs or route assignments shown

3. **Analytics Tracking**
   - Non-identifying information only
   - User agent and referrer for analytics
   - No personal data stored
   - Failures don't break the app

4. **Admin Controls**
   - Only admins can toggle visibility
   - Visibility changes immediate
   - No public API for visibility updates

## Performance

1. **Database Indexes**
   - Compound index on (public_visible, is_active)
   - Index on event_type for analytics
   - Index on doctor_id for analytics joins
   - Index on viewed_at for date range queries

2. **Query Optimization**
   - Filter at database level
   - Use SELECT specific columns
   - Analytics queries use aggregation functions
   - Date range filters on analytics

3. **Caching Opportunities** (Future)
   - Public doctors list (5-15 min TTL)
   - Specialities/locations list (1 hour TTL)
   - Analytics aggregates (1 hour TTL)

## Limitations

1. **Coordinates**
   - No GPS coordinates stored
   - Google Maps search by name + address
   - Fallback to location-only search

2. **Analytics**
   - Basic view tracking only
   - No unique user identification
   - No conversion tracking
   - No session tracking

3. **Search**
   - Basic SQL ILIKE search
   - No fuzzy matching
   - No relevance ranking
   - No autocomplete

## Future Enhancements

1. **Enhanced Search**
   - Full-text search with PostgreSQL
   - Fuzzy matching
   - Search suggestions
   - Popular searches tracking

2. **Rich Profiles**
   - Profile photos
   - Operating hours
   - Accepted insurance
   - Patient reviews
   - Online booking integration

3. **Maps Integration**
   - Store GPS coordinates
   - Interactive map view
   - Nearby doctors
   - Distance calculation

4. **Advanced Analytics**
   - Conversion tracking
   - Heatmaps
   - User journey analysis
   - A/B testing

5. **Performance**
   - Redis caching layer
   - CDN for static assets
   - Lazy loading
   - Pagination

## Testing

See `PHASE_6_TESTING_GUIDE.md` for comprehensive testing instructions.

## Rollback

To rollback Phase 6:

1. Remove public routes:
   ```bash
   rm -rf src/app/directory
   ```

2. Remove directory service:
   ```bash
   rm src/lib/supabase/services/directory.service.ts
   ```

3. Remove from exports:
   ```typescript
   // src/lib/supabase/services/index.ts
   // Remove: export { DirectoryService } from './directory.service';
   ```

4. Revert database changes:
   ```sql
   DROP TABLE IF EXISTS directory_analytics;
   DROP FUNCTION IF EXISTS get_most_viewed_doctors;
   DROP FUNCTION IF EXISTS get_directory_view_counts;
   DROP VIEW IF EXISTS directory_analytics_summary;
   ALTER TABLE doctors DROP COLUMN IF EXISTS public_visible;
   ```

5. Revert admin changes in `/admin/page.tsx` and `/admin/doctors/page.tsx`

## Migration Path

From Phase 5 → Phase 6:

1. ✅ Run database migration (`phase6-public-directory-schema.sql`)
2. ✅ Add DirectoryService
3. ✅ Create public directory routes
4. ✅ Update database types
5. ✅ Add admin visibility controls
6. ✅ Add dashboard analytics widget
7. ✅ Test public access
8. ✅ Test admin controls
9. ✅ Verify build passes

All existing functionality remains unchanged. Phase 6 is purely additive.

---

**Status:** ✅ Implemented and Verified
**Build:** ✅ Passing
**Routes:** 17 total (16 static, 1 dynamic)
