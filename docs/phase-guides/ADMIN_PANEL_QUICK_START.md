# 🚀 Admin Panel Quick Start Guide

This guide helps you start building the Admin Panel using the prepared service layer.

---

## 📦 What's Ready

- ✅ **44 service methods** across 4 services
- ✅ **Complete validation layer** for doctors
- ✅ **Bulk import utilities** (JSON, CSV)
- ✅ **Type-safe operations** with TypeScript
- ✅ **Error handling** and logging
- ✅ **Build verified** - no TypeScript errors

---

## 🎯 Service Layer Overview

### Import Services

```typescript
import { 
  DoctorsService, 
  RoutesService, 
  VisitsService, 
  AssignmentsService,
  SettingsService 
} from '@/lib/supabase/services';
```

### Import Validation

```typescript
import { 
  validateDoctor, 
  sanitizeDoctor,
  formatValidationErrors 
} from '@/lib/validation';
```

### Import Bulk Import

```typescript
import { 
  parseCSV, 
  parseJSON,
  prepareBulkImport,
  generateCSVTemplate 
} from '@/lib/utils';
```

---

## 💡 Common Patterns

### 1. Create Doctor with Validation

```typescript
async function handleCreateDoctor(formData: DoctorInput) {
  try {
    // Service handles validation automatically
    const doctor = await DoctorsService.createDoctor(formData);
    toast.success('Doctor created successfully');
    return doctor;
  } catch (err: any) {
    // Validation errors are thrown with clear messages
    toast.error(err.message);
    throw err;
  }
}
```

### 2. Bulk Import from CSV

```typescript
async function handleCSVImport(csvContent: string) {
  try {
    // Parse CSV
    const doctors = parseCSV(csvContent);
    
    // Import with validation
    const result = await DoctorsService.bulkImportDoctors(doctors);
    
    toast.success(`Imported ${result.success} doctors`);
    
    if (result.failed > 0) {
      console.log('Failed imports:', result.errors);
      toast.error(`${result.failed} doctors failed validation`);
    }
    
    return result;
  } catch (err: any) {
    toast.error(err.message);
    throw err;
  }
}
```

### 3. Search and Filter

```typescript
async function searchDoctors(query: string, location?: string) {
  try {
    if (location) {
      // Filter by location
      const doctors = await DoctorsService.getDoctorsByLocation(location);
      // Client-side search
      return doctors.filter(d => 
        d.doctor_name.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      // Server-side search
      return await DoctorsService.searchDoctors(query);
    }
  } catch (err: any) {
    toast.error('Search failed');
    return [];
  }
}
```

### 4. Get Statistics

```typescript
async function getDashboardStats() {
  try {
    const [totalCount, countByLocation, locations] = await Promise.all([
      DoctorsService.getTotalCount(),
      DoctorsService.getDoctorCountByLocation(),
      DoctorsService.getLocations()
    ]);
    
    return {
      total: totalCount,
      byLocation: countByLocation,
      locations: locations
    };
  } catch (err: any) {
    toast.error('Failed to load statistics');
    throw err;
  }
}
```

### 5. Update with Validation

```typescript
async function handleUpdateDoctor(id: number, updates: Partial<DoctorInput>) {
  try {
    const updated = await DoctorsService.updateDoctor(id, updates);
    toast.success('Doctor updated successfully');
    return updated;
  } catch (err: any) {
    toast.error(err.message);
    throw err;
  }
}
```

### 6. Bulk Delete

```typescript
async function handleBulkDelete(doctorIds: number[]) {
  if (!confirm(`Delete ${doctorIds.length} doctors?`)) return;
  
  try {
    const result = await DoctorsService.bulkDeleteDoctors(doctorIds);
    toast.success(`Deleted ${result.success} doctors`);
    
    if (result.failed > 0) {
      toast.error(`Failed to delete ${result.failed} doctors`);
    }
    
    return result;
  } catch (err: any) {
    toast.error('Bulk delete failed');
    throw err;
  }
}
```

---

## 🎨 UI Component Examples

### Doctor List Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { DoctorsService } from '@/lib/supabase/services';
import type { DoctorRow } from '@/lib/supabase/database.types';

export function DoctorList() {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    setLoading(true);
    try {
      const data = await DoctorsService.getAllDoctors();
      setDoctors(data);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.length < 2) {
      loadDoctors();
      return;
    }
    
    try {
      const results = await DoctorsService.searchDoctors(query);
      setDoctors(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <input
        type="text"
        placeholder="Search doctors..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="mb-4 px-4 py-2 border rounded"
      />
      
      <div className="space-y-2">
        {doctors.map(doctor => (
          <div key={doctor.id} className="p-4 border rounded">
            <h3 className="font-semibold">{doctor.doctor_name}</h3>
            <p className="text-sm text-gray-600">{doctor.location}</p>
            {doctor.speciality && (
              <p className="text-sm">{doctor.speciality}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Bulk Import Component

```typescript
'use client';

import { useState } from 'react';
import { DoctorsService } from '@/lib/supabase/services';
import { parseCSV, generateCSVTemplate } from '@/lib/utils';
import toast from 'react-hot-toast';

export function BulkImport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  function handleDownloadTemplate() {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'doctor-import-template.csv';
    a.click();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const doctors = parseCSV(text);
      
      const importResult = await DoctorsService.bulkImportDoctors(doctors);
      setResult(importResult);
      
      if (importResult.success > 0) {
        toast.success(`Successfully imported ${importResult.success} doctors`);
      }
      
      if (importResult.failed > 0) {
        toast.error(`${importResult.failed} doctors failed validation`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Bulk Import Doctors</h2>
      
      <button
        onClick={handleDownloadTemplate}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Download CSV Template
      </button>

      <div>
        <label className="block mb-2 font-semibold">Upload CSV File</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={importing}
          className="block"
        />
      </div>

      {importing && <div>Importing...</div>}

      {result && (
        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Import Results</h3>
          <p className="text-green-600">✅ Success: {result.success}</p>
          <p className="text-red-600">❌ Failed: {result.failed}</p>
          
          {result.errors.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold">Errors:</p>
              <ul className="list-disc pl-5">
                {result.errors.slice(0, 10).map((err: any, i: number) => (
                  <li key={i} className="text-sm">
                    Row {err.index + 1}: {err.errors.join(', ')}
                  </li>
                ))}
              </ul>
              {result.errors.length > 10 && (
                <p className="text-sm text-gray-600">
                  ...and {result.errors.length - 10} more errors
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Dashboard Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import { DoctorsService } from '@/lib/supabase/services';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    byLocation: {} as Record<string, number>
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [total, byLocation] = await Promise.all([
        DoctorsService.getTotalCount(),
        DoctorsService.getDoctorCountByLocation()
      ]);
      
      setStats({ total, byLocation });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-blue-100 rounded-lg">
          <h3 className="text-lg font-semibold">Total Doctors</h3>
          <p className="text-4xl font-bold">{stats.total}</p>
        </div>
        
        <div className="p-6 bg-green-100 rounded-lg">
          <h3 className="text-lg font-semibold">Locations</h3>
          <p className="text-4xl font-bold">
            {Object.keys(stats.byLocation).length}
          </p>
        </div>
        
        <div className="p-6 bg-purple-100 rounded-lg">
          <h3 className="text-lg font-semibold">Avg per Location</h3>
          <p className="text-4xl font-bold">
            {Math.round(stats.total / Object.keys(stats.byLocation).length) || 0}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Doctors by Location</h2>
        <div className="space-y-2">
          {Object.entries(stats.byLocation)
            .sort(([, a], [, b]) => b - a)
            .map(([location, count]) => (
              <div key={location} className="flex justify-between p-3 bg-gray-100 rounded">
                <span className="font-medium">{location}</span>
                <span className="text-gray-600">{count} doctors</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔍 Validation Example

```typescript
import { validateDoctor, sanitizeDoctor } from '@/lib/validation';

function DoctorForm() {
  const [errors, setErrors] = useState<string[]>([]);

  async function handleSubmit(formData: FormData) {
    // Get form values
    const doctor = {
      doctor_name: formData.get('name') as string,
      location: formData.get('location') as string,
      mobile: formData.get('mobile') as string,
      speciality: formData.get('speciality') as string,
    };

    // Sanitize
    const sanitized = sanitizeDoctor(doctor);

    // Validate
    const validation = validateDoctor(sanitized);
    
    if (!validation.valid) {
      setErrors(validation.errors.map(e => e.message));
      return;
    }

    // Clear errors
    setErrors([]);

    // Submit (service also validates, but this gives immediate feedback)
    try {
      await DoctorsService.createDoctor(sanitized);
      toast.success('Doctor created!');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(new FormData(e.currentTarget)); }}>
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-100 rounded">
          <ul className="list-disc pl-5">
            {errors.map((err, i) => (
              <li key={i} className="text-red-700">{err}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Form fields */}
    </form>
  );
}
```

---

## 🎯 Recommended Admin Panel Structure

```
src/app/admin/
├── page.tsx              # Dashboard
├── layout.tsx            # Admin layout (sidebar, header)
├── doctors/
│   ├── page.tsx          # Doctor list
│   ├── new/page.tsx      # Create doctor
│   ├── [id]/page.tsx     # Edit doctor
│   └── import/page.tsx   # Bulk import
├── locations/
│   └── page.tsx          # Manage locations
└── settings/
    └── page.tsx          # Admin settings
```

---

## ✅ Checklist for Admin Panel

### Phase 1: Basic CRUD
- [ ] Dashboard with statistics
- [ ] Doctor list with search
- [ ] Create doctor form
- [ ] Edit doctor form
- [ ] Delete doctor (with confirmation)

### Phase 2: Bulk Operations
- [ ] CSV upload interface
- [ ] Template download
- [ ] Preview before import
- [ ] Show validation errors
- [ ] Display import results

### Phase 3: Data Management
- [ ] Location management
- [ ] Duplicate detection
- [ ] Export to CSV
- [ ] Data quality reports

### Phase 4: Polish
- [ ] Pagination for large lists
- [ ] Advanced filters
- [ ] Sort by columns
- [ ] Bulk actions (select multiple)

---

## 📚 Key Files Reference

| Purpose | File |
|---------|------|
| Doctor CRUD | `src/lib/supabase/services/doctors.service.ts` |
| Validation | `src/lib/validation/doctor-validation.ts` |
| Bulk Import | `src/lib/utils/bulk-import.ts` |
| Type Definitions | `src/lib/supabase/database.types.ts` |
| Exports | `src/lib/validation/index.ts`, `src/lib/utils/index.ts` |

---

## 🚀 Get Started

1. **Read the readiness report:** `ADMIN_PANEL_READINESS_REPORT.md`
2. **Review service methods:** Check each service file for available methods
3. **Test services:** Use existing UI or create test scripts
4. **Build UI:** Start with dashboard, then CRUD screens
5. **Add bulk import:** Implement CSV upload interface

---

## 💡 Tips

- **Use existing patterns:** Check `src/lib/store.tsx` for how services are called
- **Leverage toast notifications:** Already set up with `react-hot-toast`
- **Reuse UI components:** Use existing components from `src/components/ui/`
- **Handle errors gracefully:** All services throw errors with clear messages
- **Add loading states:** Use the `loading` prop on buttons
- **Test incrementally:** Build one screen at a time and test thoroughly

---

**Ready to build!** 🎉

All backend infrastructure is complete. Focus on creating a great Admin UI using the prepared services.
