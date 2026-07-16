# ✅ Alternative: Enable Auth via Database Webhooks

**Issue:** Cannot create triggers on `auth.users` due to permissions  
**Solution:** Use Supabase Database Webhooks (built-in feature)

---

## 🎯 Option 1: Database Webhooks (Recommended)

Supabase provides Database Webhooks that can listen to auth events without needing direct trigger access.

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: **Database → Webhooks**

2. **Create New Webhook**
   - Click **"Enable Webhooks"** or **"Create a new hook"**
   - Name: `create_profile_on_signup`
   - Table: `auth.users` 
   - Events: Select **"Insert"**
   - Type: **HTTP Request** or **Database Function**

3. **Choose Method:**

   **Method A: Database Function (Simpler)**
   - Select "Database Function"
   - Function: `public.handle_new_user`
   - First, create the function in SQL Editor:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mr')::TEXT,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile: %', SQLERRM;
    RETURN NEW;
END;
$$;
```

---

## 🎯 Option 2: Use Supabase Auth Hooks (Easiest)

Supabase has a feature called **Auth Hooks** that doesn't require database triggers.

### Steps:

1. **Enable Auth Hooks in Dashboard**
   - Go to: **Authentication → Hooks** (or **Settings → Auth Hooks**)
   - This feature may require project upgrade or may not be available yet

2. **If Not Available:** Use Option 3 below

---

## 🎯 Option 3: Create Profile in Application Code (Simplest)

Since we can't create database triggers, we'll create the profile from the application when users sign up.

### Update: `src/lib/auth/auth-service.ts`

I'll update this file to create the profile automatically after signup.

---

## ✅ Implementing Option 3 (Application-Side Profile Creation)

This is the most reliable approach that doesn't require special database permissions.

### How It Works:

```
User signs up → Supabase creates auth.users entry
              ↓
       Application creates profiles entry
              ↓
       Profile ready to use
```

Let me update the auth service now...

