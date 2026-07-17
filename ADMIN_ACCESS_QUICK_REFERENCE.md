# Admin Access - Quick Reference Card

## 🚀 Make john@gmail.com Admin RIGHT NOW

### In Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'john@gmail.com';
SELECT email, role FROM profiles WHERE email = 'john@gmail.com';
```

### In Your App:
1. **Logout**
2. **Login** again
3. Navigate to `/admin`
4. **Success!** ✅

---

## 📊 Quick SQL Commands

### Check Your Role
```sql
SELECT email, role FROM profiles WHERE email = 'john@gmail.com';
```

### View All Users
```sql
SELECT email, role, full_name FROM profiles ORDER BY created_at DESC;
```

### View All Admins
```sql
SELECT email, role FROM profiles WHERE role = 'admin';
```

### Count by Role
```sql
SELECT role, COUNT(*) FROM profiles GROUP BY role;
```

---

## ✅ Admin Access Checklist

After promoting to admin:

- [ ] SQL shows `role = 'admin'`
- [ ] Logged out
- [ ] Logged in again
- [ ] Can access `/admin`
- [ ] Can access `/admin/reviews`
- [ ] Can access `/admin/analytics`
- [ ] See "Admin" in navigation

---

## 🔧 Files Created

1. **`ADMIN_ACCESS_SETUP.md`** - Complete documentation
2. **`make-user-admin.sql`** - Quick admin promotion script
3. **`revert-admin-to-mr.sql`** - Quick revert script
4. **`ADMIN_ACCESS_QUICK_REFERENCE.md`** - This file

---

## ⚠️ Remember

- ✅ Always logout/login after role change
- ✅ Role must be lowercase: 'admin'
- ✅ Check with SELECT before UPDATE
- ❌ Do NOT enable RLS
- ❌ Do NOT modify auth logic

---

## 🎯 Success = All Green

- ✅ Role in database: 'admin'
- ✅ Logged out and back in
- ✅ Can access all `/admin/*` pages
- ✅ See admin navigation menu
- ✅ No access errors

---

**Need more details?** See `ADMIN_ACCESS_SETUP.md`
