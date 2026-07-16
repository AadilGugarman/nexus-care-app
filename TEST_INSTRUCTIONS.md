# 🔍 Debug Instructions

## Current Issue
Getting empty error object `{}` when trying to insert doctor.

## Steps to Debug

### 1. Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
# Then run:
npm run dev
```

### 2. Check Server Console
Look for this output when server starts:
```
Supabase client initialized: { url: '...', keyLength: 200+ }
```

If you see "MISSING" - check `.env.local` file.

### 3. Try Adding Doctor Again
1. Open browser console (F12)
2. Go to Doctors tab
3. Click "+ Add Doctor"
4. Fill in form
5. Click Save

### 4. Check Browser Console
You should see these logs:
```
Attempting to insert doctor: { doctor_name: '...', location: '...' }
```

Then either:
- ✅ `Doctor inserted successfully: { id: 675, ... }`
- ❌ `Supabase error details: { message: '...', code: '...' }`

### 5. Check Network Tab
1. Open Dev Tools (F12)
2. Go to **Network** tab
3. Filter by "doctors"
4. Try adding doctor again
5. Click on the failed request
6. Check:
   - **Status code:** Should be 409
   - **Response tab:** Shows error message
   - **Headers tab:** Check authorization header

### 6. Share These Details

If still failing, share:
- ✅ Server console output (Supabase client initialized line)
- ✅ Browser console logs (all lines)
- ✅ Network tab response body
- ✅ Status code from network tab

## Common Issues

### Issue: Missing env variables
**Fix:** Check `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://eypgvkhylfrklwfnhaus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Issue: Wrong API key
**Fix:** Make sure using **anon key** (starts with `eyJ`), not service key

### Issue: RLS still enabled
**Fix:** Run the aggressive SQL fix again in Supabase

### Issue: CORS or network error
**Fix:** Check if Supabase project is paused/sleeping
- Go to: https://supabase.com/dashboard/project/eypgvkhylfrklwfnhaus
- Check project status

## Alternative: Test with cURL

Test if database is accessible:

```bash
curl -X POST \
  'https://eypgvkhylfrklwfnhaus.supabase.co/rest/v1/doctors' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d '{
    "doctor_name": "Test Doctor",
    "location": "Test Location"
  }'
```

Replace `YOUR_ANON_KEY` with your actual anon key from `.env.local`.

Expected:
- ✅ Success: Returns doctor JSON with ID
- ❌ 409: Shows error message in response

## Next Steps

After collecting debug info, we can:
1. Identify the exact error
2. Fix the specific issue
3. Get CRUD working

Try the steps above and share what you find!
