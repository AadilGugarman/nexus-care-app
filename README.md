# Nexus Care App - MR Route Planner

A comprehensive medical representative (MR) route planning and doctor management system with authentication, role-based access control, and request/approval workflows.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)

---

## 🎯 Features

### For Medical Representatives (MRs)
- 📋 **Doctor Management** - View and organize doctor information
- 🗺️ **Route Planning** - Create and optimize daily visit routes
- ✅ **Visit Tracking** - Mark visits as completed, track history
- 📊 **Dashboard** - Overview of routes, visits, and statistics
- 📝 **Request System** - Submit new doctors, suggest edits, request status changes
- 🔒 **Data Isolation** - Own routes, visits, and assignments (multi-tenant)
- 📱 **Mobile-First** - Optimized for on-the-go use

### For Administrators
- 👥 **Doctor Master Data** - Full control over doctor database
- 📥 **Bulk Import** - Import doctors via CSV/JSON
- 🔍 **Data Quality** - Find and fix data issues
- ✅ **Request Review** - Approve/reject MR submissions
- 📊 **Analytics Dashboard** - Multi-MR system statistics and insights
- 👁️ **Cross-MR Visibility** - View all routes, visits, and user activity
- 🔐 **User Management** - Role-based access control
- 🌐 **Public Directory Control** - Toggle doctor visibility in public directory

### For Public Users (No Login Required)
- 🔍 **Doctor Directory** - Browse and search for doctors
- 🗺️ **Location-based Search** - Find doctors by city/area
- 🩺 **Speciality Filtering** - Filter by medical speciality
- 📞 **Direct Contact** - Call doctors directly from profile
- 🧭 **Directions** - Get directions via Google Maps

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AadilGugarman/nexus-care-app.git
   cd nexus-care-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Set up the database**
   
   Run these SQL files in your Supabase SQL Editor:
   ```bash
   # Core schema
   supabase-schema.sql
   
   # Phase 4: Request tables
   phase4-doctor-requests-schema.sql
   ```

5. **Enable Supabase Authentication**
   
   In Supabase Dashboard:
   - Go to Authentication → Settings
   - Enable Email provider
   - Configure email templates (optional)

6. **Create test users**
   
   In Supabase Dashboard → Authentication → Users:
   ```
   Admin User:
   Email: admin@test.com
   Password: admin123
   
   MR User:
   Email: mr@test.com
   Password: mr123
   ```
   
   Then run in SQL Editor:
   ```sql
   -- Set admin role
   UPDATE profiles SET role = 'admin' 
   WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@test.com');
   
   -- Set MR role
   UPDATE profiles SET role = 'mr'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'mr@test.com');
   ```

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open the app**
   ```
   http://localhost:3000
   ```

---

## 📁 Project Structure

```
nexus-care-app/
├── docs/                          # Documentation
│   ├── architecture/              # System architecture docs
│   ├── phase-guides/              # Implementation guides
│   └── troubleshooting/           # Common issues & fixes
├── src/
│   ├── app/                       # Next.js app router
│   │   ├── admin/                 # Admin panel routes
│   │   │   ├── analytics/         # Multi-MR analytics (Phase 5)
│   │   │   ├── doctors/           # Doctor management
│   │   │   ├── import/            # Bulk import
│   │   │   ├── quality/           # Data quality
│   │   │   └── reviews/           # Request review (Phase 4)
│   │   ├── login/                 # Login page
│   │   ├── signup/                # Signup page
│   │   └── access-denied/         # Access denied page
│   ├── components/                # React components
│   │   ├── auth/                  # Auth components
│   │   ├── doctor-requests/       # Request forms
│   │   ├── ui/                    # UI primitives
│   │   └── views/                 # Main app views
│   ├── lib/
│   │   ├── auth/                  # Auth context & helpers
│   │   ├── supabase/              # Supabase client & services
│   │   │   └── services/          # Data services
│   │   ├── types/                 # TypeScript types
│   │   ├── utils/                 # Utility functions
│   │   └── validation/            # Data validation
│   └── middleware.ts              # Route protection
├── supabase-schema.sql            # Core database schema
├── phase4-doctor-requests-schema.sql  # Request tables schema
└── package.json
```

---

## 🔐 Authentication & Roles

### User Roles

| Role | Access | Permissions |
|------|--------|-------------|
| **Admin** | Full access | Doctor CRUD, Bulk import, Request approval, User management |
| **MR** | Main app + Requests | View doctors, Create routes, Submit requests, Track visits |
| **Public** | Read-only | View doctors, View routes (using DEFAULT_USER_ID) |

### Protected Routes

- `/admin/*` - Admin only (redirects MR to access-denied)
- `/login`, `/signup` - Public access
- Main app (`/`) - Public access (with limited functionality)

---

## 🗄️ Database Schema

### Core Tables

- **doctors** - Master doctor database (674 seeded)
- **routes** - Route definitions
- **visits** - Visit tracking with history
- **assignments** - Doctor-route mappings
- **profiles** - User profiles with roles

### Request Tables (Phase 4)

- **doctor_creation_requests** - New doctor submissions
- **doctor_change_requests** - Edit suggestions with JSON changes
- **doctor_status_requests** - Active/inactive requests

See [`docs/architecture/SUPABASE_ARCHITECTURE.md`](docs/architecture/SUPABASE_ARCHITECTURE.md) for detailed schema.

---

## 🎨 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS
- **UI Components:** Custom components with Radix UI primitives
- **Icons:** Lucide React
- **State Management:** Zustand + React Context

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **API:** Supabase Client SDK
- **Storage:** LocalStorage (offline cache)

### Development
- **Build Tool:** Turbopack
- **Linting:** ESLint
- **Type Checking:** TypeScript
- **Package Manager:** npm

---

## 📖 Documentation

Comprehensive documentation is available in the [`/docs`](docs/) directory:

- **[Architecture](docs/architecture/)** - System design and database schema
- **[Phase Guides](docs/phase-guides/)** - Implementation guides for each phase
- **[Troubleshooting](docs/troubleshooting/)** - Common issues and solutions

### Key Documents

- [📐 Database Architecture](docs/architecture/SUPABASE_ARCHITECTURE.md)
- [🔐 Authentication Setup](docs/architecture/AUTHENTICATION_IMPLEMENTATION_PLAN.md)
- [✅ Phase 3: RBAC Complete](docs/phase-guides/PHASE_3_RBAC_COMPLETE.md)
- [📝 Phase 4: Requests Complete](docs/phase-guides/PHASE_4_COMPLETE.md)
- [🎯 Phase 4: Integration Complete](docs/phase-guides/PHASE_4_INTEGRATION_COMPLETE.md)
- [👥 Phase 5: Multi-MR Complete](docs/phase-guides/PHASE_5_MULTI_MR_IMPLEMENTATION.md)
- [🌐 Phase 6: Public Directory Complete](docs/phase-guides/PHASE_6_PUBLIC_DIRECTORY_IMPLEMENTATION.md)
- [🧪 Testing Guides](docs/phase-guides/)

---

## 🧪 Testing

### Build Verification
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

### Testing Guides
- [Phase 3 Testing](docs/phase-guides/PHASE_3_TESTING_GUIDE.md) - RBAC testing
- [Phase 4 Testing](docs/phase-guides/PHASE_4_TESTING_GUIDE.md) - Request workflow testing
- [Phase 5 Testing](docs/phase-guides/PHASE_5_TESTING_GUIDE.md) - Multi-MR data isolation testing
- [Phase 6 Testing](docs/phase-guides/PHASE_6_TESTING_GUIDE.md) - Public directory testing

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import repository
   - Add environment variables
   - Deploy

3. **Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

### Build Output

The app builds to static pages where possible:
- Static pages: Dashboard, login, signup, etc.
- Dynamic pages: Admin reviews (with server actions)
- Middleware: Route protection

---

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npx tsc --noEmit
```

### Code Style

- **TypeScript** - Strict mode enabled
- **Mobile-First** - Responsive design starting from 320px
- **Dark Theme** - Consistent dark mode throughout
- **Accessibility** - WCAG compliant components

---

## 🐛 Troubleshooting

### Common Issues

**1. "Email address is invalid" error**
- Solution: Enable Supabase Auth in dashboard
- Guide: [`docs/troubleshooting/ENABLE_SUPABASE_AUTH_NOW.md`](docs/troubleshooting/ENABLE_SUPABASE_AUTH_NOW.md)

**2. "Error loading profile" error**
- Solution: Disable RLS on profiles table
- Guide: [`docs/troubleshooting/FIX_PROFILE_LOADING_ERROR.md`](docs/troubleshooting/FIX_PROFILE_LOADING_ERROR.md)

**3. Doctor ID sequence errors (409 Conflict)**
- Solution: Reset sequence
- Guide: [`docs/troubleshooting/FIX_409_ERROR.md`](docs/troubleshooting/FIX_409_ERROR.md)

See [`/docs/troubleshooting`](docs/troubleshooting/) for more solutions.

---

## 📊 Project Status

### ✅ Completed

- [x] Core MR application (routes, visits, doctors)
- [x] Admin panel with bulk import
- [x] Authentication system (Supabase Auth)
- [x] Role-based access control (RBAC)
- [x] Request/approval workflow (Phase 4)
- [x] MR request form UI integration (Phase 4)
- [x] Multi-MR data ownership (Phase 5)
- [x] Admin analytics dashboard (Phase 5)
- [x] Public doctor directory (Phase 6)
- [x] Public directory analytics (Phase 6)
- [x] Mobile-first responsive UI
- [x] Dark theme
- [x] Build optimization

### 🚧 Future Enhancements

- [ ] Enable Row Level Security (RLS)
- [ ] Email notifications for request approvals
- [ ] Real-time analytics updates
- [ ] Request history view for MRs
- [ ] Batch approve/reject operations
- [ ] Advanced analytics (charts, trends)
- [ ] Export to PDF/Excel
- [ ] Doctor usage heat maps
- [ ] Enhanced public directory search (fuzzy matching, autocomplete)
- [ ] Doctor profile photos and rich profiles
- [ ] Interactive maps with GPS coordinates
- [ ] Online appointment booking system

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Add documentation** (update `/docs` if needed)
5. **Test thoroughly**
6. **Commit with clear messages**
7. **Push and create a pull request**

---

## 📄 License

This project is private and confidential. All rights reserved.

---

## 👥 Team

Developed by Aadil Gugarman and team.

---

## 📞 Support

For questions or issues:
1. Check [`/docs`](docs/) directory
2. Review troubleshooting guides
3. Check phase completion documents
4. Contact the development team

---

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Supabase** - Backend infrastructure
- **Tailwind CSS** - Styling framework
- **Radix UI** - Accessible components
- **Lucide** - Icon library

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**
