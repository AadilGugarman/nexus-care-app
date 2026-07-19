# ✅ Pre-Deployment Checklist

Run through this checklist before deploying to Vercel.

---

## 1. Build Check

```bash
npm run build
```

**Expected:** Build completes successfully with no errors.

---

## 2. TypeScript Check

```bash
npm run typecheck
```

**Expected:** No TypeScript errors.

---

## 3. Environment Variables Check

Verify you have these values ready from Supabase:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (from Supabase Dashboard → Settings → API)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase Dashboard → Settings → API)

---

## 4. Git Repository Check

```bash
git status
```

**Expected:** 
- All files committed
- No sensitive data (`.env.local` should NOT be tracked)
- Repository pushed to GitHub/GitLab/Bitbucket

---

## 5. Database Security Check

✅ **RLS Audit Results:** PASSED (all 0s)
- [x] All tables have RLS enabled
- [x] No anonymous access to sensitive data
- [x] All policies have user isolation

---

## 6. Critical Features Test

Before deploying, test these locally:

- [ ] Login/Signup works
- [ ] MR dashboard loads
- [ ] Admin panel accessible
- [ ] Directory page loads
- [ ] Doctor CRUD operations work
- [ ] Notifications work

---

## 🚀 Ready to Deploy?

If all checks pass, follow: **VERCEL_DEPLOYMENT_GUIDE.md**

---

## Quick Deploy Commands

```bash
# 1. Final commit
git add .
git commit -m "Ready for production deployment"
git push origin main

# 2. Deploy to Vercel (first time)
npx vercel

# 3. Deploy to production
npx vercel --prod
```

**Then add environment variables in Vercel Dashboard!**
