# User Guide: Doctor Contribution System

**For Medical Representatives**

## Overview

As a Medical Representative, you can now contribute to the doctor master database by submitting requests. All your requests are reviewed and approved by administrators before being applied to the live database.

---

## What You Can Do

### 1. Add a New Doctor ➕

When you discover a new doctor that should be in the system:

**Steps:**
1. Go to the **Locations** or **Days** tab
2. Tap the **blue (+) button** at bottom-right
3. Fill out the new doctor form:
   - **Doctor Name** (required)
   - **Location** (required)
   - Speciality
   - Qualification
   - Hospital
   - Mobile
   - Address
   - Notes
4. Tap **Submit Request**
5. ✅ Success! Your request has been submitted for admin approval

**What Happens Next:**
- Admin receives your request in the review panel
- Admin reviews the information
- Admin approves or rejects with optional notes
- You can check status in the doctor details dialog

---

### 2. Suggest Changes to Existing Doctor ✏️

When you notice incorrect or outdated information:

**Steps:**
1. Go to **Locations** tab
2. Expand the location group
3. Find the doctor you want to update
4. Tap the **purple Edit icon** (looks like Edit3 📝)
5. Modify the fields that need updating
   - Only changed fields are submitted
   - Original values shown with strikethrough
6. Optionally add a **Reason for Changes**
7. Review the **Changes Summary**
8. Tap **Submit Changes**
9. ✅ Success! Your edit request has been submitted

**Example Use Cases:**
- Doctor moved to new hospital
- Updated mobile number
- Corrected spelling of name
- Added missing speciality

---

### 3. Request Doctor Inactive Status 🔴

When a doctor should no longer be in active rotation:

**Steps:**
1. Go to **Locations** tab
2. Find the doctor
3. Tap the **orange Power icon** (PowerOff ⏻)
4. Provide a **Reason** (required):
   - "Doctor has retired"
   - "Doctor moved to different city"
   - "No longer prescribing our products"
   - "Clinic closed permanently"
5. Tap **Submit Request**
6. ✅ Your status change request has been submitted

**Note:** The doctor remains active until admin approves your request.

---

### 4. Check Request Status 🔍

To see the status of your submitted requests:

**Steps:**
1. Tap any **doctor card** to open details
2. Scroll to **"Your Pending Requests"** section
3. See all your requests for this doctor:
   - Request type (Edit / Status Change)
   - Status badge:
     - 🟡 **Pending** - Awaiting admin review
     - 🟢 **Approved** - Changes applied
     - 🔴 **Rejected** - Not approved
   - Submission date and time

**Request History:**
- Shows last 5 requests per doctor
- Includes pending, approved, and rejected requests
- Auto-refreshes when you open doctor details

---

## Understanding the Buttons

### In Locations Tab

Each doctor card has these action buttons:

| Icon | Color | Action | Description |
|------|-------|--------|-------------|
| ✓/○ | Green | Mark Visited | Track your visits |
| 📅 | Blue | Assign Days | Set visit schedule |
| ✏️ | Purple | Suggest Edit | Request changes |
| ⏻ | Orange | Request Inactive | Mark as inactive |

---

## Request Workflow

```
You Submit Request
        ↓
Admin Receives Notification
        ↓
Admin Reviews Information
        ↓
    ┌──────┴──────┐
    ↓             ↓
Approved      Rejected
    ↓             ↓
Applied       Not Applied
```

---

## Tips for Better Requests

### When Adding New Doctors

✅ **Do:**
- Provide complete information
- Double-check spelling of names
- Verify mobile numbers
- Include hospital/clinic name
- Add relevant notes (e.g., "Refers many patients")

❌ **Don't:**
- Submit duplicate doctors (search first!)
- Leave required fields empty
- Add personal opinions in notes

---

### When Suggesting Edits

✅ **Do:**
- Only modify fields that need updating
- Provide clear reason for changes
- Verify new information is correct
- Use "Reason" field to explain why

❌ **Don't:**
- Make unnecessary changes
- Submit without reason for significant changes
- Guess at information (mark as unknown instead)

---

### When Requesting Inactive Status

✅ **Do:**
- Provide clear, specific reason
- Verify information (e.g., actually retired)
- Use professional language
- Be factual

❌ **Don't:**
- Request inactive for personal reasons
- Use vague reasons like "Not sure"
- Request inactive just because doctor is hard to meet

---

## Frequently Asked Questions

### Q: How long does approval take?
**A:** Typically 1-2 business days. Check the doctor details dialog for status updates.

### Q: Can I cancel a pending request?
**A:** Not yet. Contact your admin if you submitted an error.

### Q: What if my request is rejected?
**A:** Admin may add notes explaining why. Review the feedback and resubmit if appropriate.

### Q: Can I see all my requests in one place?
**A:** Currently you need to check each doctor individually. A full request history view is planned for the future.

### Q: What happens to pending requests for a doctor I can't see anymore?
**A:** Your requests remain in the system. Admin can still review and approve them.

### Q: Can I edit a doctor's day assignments directly?
**A:** Yes! Day assignments are your personal schedule and don't require approval. Only master doctor data (name, location, contact info) requires approval.

---

## Common Scenarios

### Scenario 1: Doctor Moved Hospitals
1. Find doctor in Locations tab
2. Tap purple Edit icon
3. Update Hospital field
4. Add reason: "Doctor moved to XYZ Hospital"
5. Submit

### Scenario 2: Found Duplicate Doctor
1. Check if they're actually different doctors (same name, different location)
2. If duplicate: Contact admin (no self-delete yet)
3. If different: No action needed

### Scenario 3: Doctor Contact Changed
1. Find doctor
2. Tap purple Edit icon
3. Update Mobile field
4. Add reason: "Verified new number with receptionist"
5. Submit

### Scenario 4: Doctor Retired
1. Find doctor
2. Tap orange PowerOff icon
3. Reason: "Doctor retired as of [date], confirmed by clinic staff"
4. Submit

---

## Need Help?

**Contact your administrator if:**
- You submitted incorrect information
- You need to cancel a pending request
- A request was rejected and you don't understand why
- You have questions about what information to include

**Admin Panel:** Admins review all requests at `/admin/reviews`

---

## What's Next?

Future features being considered:
- Visual badges on doctor cards showing pending requests
- Request cancellation capability
- Full request history view
- Request notifications
- Bulk request operations

Your feedback helps shape these features!

---

## Summary

As an MR, you play a crucial role in maintaining accurate doctor data. Your contributions help the entire team work more efficiently. Remember:

- 🎯 **Add** new doctors as you discover them
- ✏️ **Edit** existing data when you notice errors
- 🔴 **Mark inactive** when doctors leave their practice
- 👀 **Check status** in doctor details dialog

All requests go through admin review to ensure data quality and consistency across the organization.

**Happy contributing!** 🚀
