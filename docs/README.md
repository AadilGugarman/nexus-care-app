# Nexus Care App - Documentation

Complete documentation for the MR Route Planner application with authentication, admin panel, and doctor contribution system.

---

## 📁 Documentation Structure

### `/phase-guides/`
Step-by-step implementation guides for each major phase of the project:

- **Phase 2: Admin Panel**
  - `ADMIN_PANEL_PREP_COMPLETE.md` - Data management layer preparation
  - `ADMIN_PANEL_QUICK_START.md` - Quick setup guide
  - `ADMIN_PANEL_READINESS_REPORT.md` - Readiness assessment
  - `ADMIN_PANEL_V1_COMPLETE.md` - Admin panel v1 completion

- **Phase 3: Role-Based Access Control**
  - `PHASE_3_RBAC_COMPLETE.md` - Technical documentation
  - `PHASE_3_TESTING_GUIDE.md` - Testing instructions
  - `AUTH_ENTRY_POINTS_COMPLETE.md` - Authentication UI integration

- **Phase 4: Doctor Contribution & Approval System**
  - `PHASE_4_COMPLETE.md` - Technical documentation
  - `PHASE_4_TESTING_GUIDE.md` - Testing instructions

### `/architecture/`
System architecture and design documents:

- `SUPABASE_ARCHITECTURE.md` - Database schema and architecture
- `AUTHENTICATION_IMPLEMENTATION_PLAN.md` - Auth system design
- `CLEANUP_AND_OPTIMIZATION_PLAN.md` - Code optimization plans

### `/troubleshooting/`
Common issues and solutions:

- `AUTH_SETUP_SOLUTION.md` - Auth setup issues
- `AUTH_SETUP_TROUBLESHOOTING.md` - Detailed troubleshooting
- `ENABLE_SUPABASE_AUTH_NOW.md` - Auth enablement guide
- `enable-auth-webhook.md` - Webhook configuration
- `FIX_409_ERROR.md` - Database sequence fix
- `FIX_409_STEP_BY_STEP.md` - Step-by-step 409 fix
- `FIX_PROFILE_LOADING_ERROR.md` - Profile loading issues

---

## 🚀 Quick Start

### For New Developers

1. **Database Setup**
   - Read: `architecture/SUPABASE_ARCHITECTURE.md`
   - Run: `supabase-schema.sql` (root directory)
   - Run: `phase4-doctor-requests-schema.sql` (root directory)

2. **Authentication Setup**
   - Read: `architecture/AUTHENTICATION_IMPLEMENTATION_PLAN.md`
   - Enable Supabase Auth: `troubleshooting/ENABLE_SUPABASE_AUTH_NOW.md`
   - Create test users: `phase-guides/PHASE_3_TESTING_GUIDE.md`

3. **Admin Panel**
   - Quick start: `phase-guides/ADMIN_PANEL_QUICK_START.md`
   - Full guide: `phase-guides/ADMIN_PANEL_V1_COMPLETE.md`

4. **Testing**
   - Phase 3 (RBAC): `phase-guides/PHASE_3_TESTING_GUIDE.md`
   - Phase 4 (Requests): `phase-guides/PHASE_4_TESTING_GUIDE.md`

### For Troubleshooting

Check the `/troubleshooting/` directory for solutions to common issues:
- Auth problems → `AUTH_SETUP_TROUBLESHOOTING.md`
- Database errors → `FIX_409_ERROR.md`
- Profile issues → `FIX_PROFILE_LOADING_ERROR.md`

---

## 📊 Project Status

### ✅ Completed Features

**Phase 1: Core MR Application**
- Doctor management
- Route planning
- Visit tracking
- Mobile-first UI

**Phase 2: Admin Panel**
- Admin dashboard
- Doctor management UI
- Bulk import
- Data quality checks

**Phase 3: Authentication & RBAC**
- Supabase authentication
- Login/signup flows
- Admin vs MR roles
- Route protection
- Access control

**Phase 4: Doctor Contribution System**
- Request/approval workflow
- New doctor requests
- Edit suggestions
- Status change requests
- Admin review UI

### ⚠️ Pending Enhancements

- MR request form UI integration
- Email notifications for approvals
- Request history for MRs
- Batch operations for admins

---

## 🏗️ Architecture Overview

```
Application Structure:
├── Frontend (Next.js 15)
│   ├── Main MR App (/)
│   ├── Admin Panel (/admin)
│   └── Auth Pages (/login, /signup)
├── Backend (Supabase)
│   ├── Database (PostgreSQL)
│   ├── Authentication
│   └── Storage
├── Services Layer
│   ├── Doctors Service
│   ├── Routes Service
│   ├── Visits Service
│   ├── Assignments Service
│   └── Doctor Requests Service
└── Middleware
    └── Role-Based Access Control
```

---

## 📖 Key Concepts

### User Roles

**Admin:**
- Full access to admin panel
- Review and approve/reject requests
- Direct doctor management
- Bulk operations
- Data quality tools

**MR (Medical Representative):**
- Main application access
- Submit doctor requests
- Suggest edits
- Request status changes
- Cannot directly modify master data

**Public (Not Logged In):**
- Read-only access to main app
- Uses DEFAULT_USER_ID fallback
- Cannot submit requests

### Database Tables

**Core Tables:**
- `doctors` - Master doctor database
- `routes` - Route definitions
- `visits` - Visit tracking
- `assignments` - Doctor-route assignments
- `profiles` - User profiles with roles

**Request Tables (Phase 4):**
- `doctor_creation_requests` - New doctor submissions
- `doctor_change_requests` - Edit suggestions
- `doctor_status_requests` - Active/inactive changes

---

## 🔧 Configuration

### Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Database

- **RLS:** Disabled (per project requirements)
- **Auth:** Enabled via Supabase dashboard
- **Default User ID:** `00000000-0000-0000-0000-000000000001`

---

## 📝 Development Guidelines

### Code Style
- TypeScript strict mode
- Mobile-first responsive design
- Dark theme consistency
- Accessibility compliance

### Testing
- Build verification: `npm run build`
- Type checking: `npm run type-check` (if configured)
- Follow phase testing guides

### Git Workflow
- Main branch: Protected
- Feature branches: For new features
- Commit messages: Clear and descriptive

---

## 🆘 Getting Help

1. Check `/troubleshooting/` directory
2. Review phase completion documents
3. Verify database schema in `/architecture/`
4. Check testing guides for examples

---

## 📅 Version History

- **v1.0** - Core MR application
- **v2.0** - Admin panel
- **v3.0** - Authentication & RBAC
- **v4.0** - Doctor contribution system

---

## 🤝 Contributing

When adding new features:
1. Create documentation in appropriate `/docs/` subdirectory
2. Update this README with new sections
3. Add testing guide if applicable
4. Update architecture docs if structure changes

---

## 📧 Support

For questions or issues:
- Check documentation first
- Review troubleshooting guides
- Consult phase completion documents
