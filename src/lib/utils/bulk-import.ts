// Bulk Import Utilities
// Support for importing doctors from JSON, CSV, and Excel (future)

import { validateBulkDoctors, sanitizeDoctor, type DoctorInput } from '../validation/doctor-validation';

export interface BulkImportResult {
  success: number;
  failed: number;
  total: number;
  errors: Array<{
    row: number;
    doctor: DoctorInput;
    error: string;
  }>;
  imported: DoctorInput[];
}

/**
 * Parse JSON data for bulk import
 */
export function parseJSON(jsonString: string): DoctorInput[] {
  try {
    const data = JSON.parse(jsonString);
    
    // Handle single object
    if (!Array.isArray(data)) {
      return [normalizeDoctor(data)];
    }
    
    // Handle array of objects
    return data.map(normalizeDoctor);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

/**
 * Parse CSV data for bulk import
 */
export function parseCSV(csvString: string): DoctorInput[] {
  const lines = csvString.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  // Parse header row
  const headers = parseCSVRow(lines[0]);
  
  // Validate required columns
  const requiredColumns = ['doctor_name', 'location'];
  const missingColumns = requiredColumns.filter(col => 
    !headers.some(h => h.toLowerCase() === col.toLowerCase())
  );
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }
  
  // Parse data rows
  const doctors: DoctorInput[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i]);
    
    if (values.length === 0) continue; // Skip empty rows
    
    const doctor: any = {};
    
    headers.forEach((header, index) => {
      const normalizedHeader = normalizeColumnName(header);
      if (values[index] !== undefined && values[index].trim() !== '') {
        doctor[normalizedHeader] = values[index].trim();
      }
    });
    
    if (doctor.doctor_name || doctor.location) {
      doctors.push(normalizeDoctor(doctor));
    }
  }
  
  return doctors;
}

/**
 * Parse a single CSV row (handles quoted values with commas)
 */
function parseCSVRow(row: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of value
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add last value
  values.push(currentValue.trim());
  
  return values;
}

/**
 * Normalize column names to match database fields
 */
function normalizeColumnName(column: string): string {
  const normalized = column.toLowerCase().trim();
  
  // Map common variations to standard field names
  const mappings: Record<string, string> = {
    'name': 'doctor_name',
    'doctor': 'doctor_name',
    'doctorname': 'doctor_name',
    'dr_name': 'doctor_name',
    'dr name': 'doctor_name',
    'doctor name': 'doctor_name',
    'city': 'location',
    'area': 'location',
    'place': 'location',
    'phone': 'mobile',
    'mobile_number': 'mobile',
    'phone_number': 'mobile',
    'contact': 'mobile',
    'specialty': 'speciality',
    'spec': 'speciality',
    'qualification': 'qualification',
    'qualifications': 'qualification',
    'degree': 'qualification',
    'hospital_name': 'hospital',
    'clinic': 'hospital',
    'hospital/clinic': 'hospital',
    'address': 'address',
    'notes': 'notes',
    'remarks': 'notes',
    'comments': 'notes',
  };
  
  return mappings[normalized] || normalized;
}

/**
 * Normalize doctor object (handle different field names)
 */
function normalizeDoctor(raw: any): DoctorInput {
  const doctor: DoctorInput = {};
  
  Object.keys(raw).forEach(key => {
    const normalized = normalizeColumnName(key);
    if (raw[key] !== undefined && raw[key] !== null) {
      (doctor as any)[normalized] = String(raw[key]).trim();
    }
  });
  
  return doctor;
}

/**
 * Validate and prepare doctors for bulk import
 */
export function prepareBulkImport(doctors: DoctorInput[]): {
  ready: DoctorInput[];
  rejected: Array<{ doctor: DoctorInput; errors: string[]; index: number }>;
} {
  // Sanitize all doctors
  const sanitized = doctors.map(sanitizeDoctor);
  
  // Validate
  const { valid, invalid } = validateBulkDoctors(sanitized);
  
  // Format rejected with error messages
  const rejected = invalid.map(item => ({
    doctor: item.doctor,
    errors: item.errors.map(err => err.message),
    index: item.index
  }));
  
  return {
    ready: valid,
    rejected
  };
}

/**
 * Generate CSV template for doctor import
 */
export function generateCSVTemplate(): string {
  const headers = [
    'doctor_name',
    'location',
    'address',
    'speciality',
    'qualification',
    'hospital',
    'mobile',
    'notes'
  ];
  
  const exampleRow = [
    'Dr. John Smith',
    'Mumbai',
    '123 Main Street, Andheri',
    'Cardiologist',
    'MBBS, MD',
    'City Hospital',
    '+91 9876543210',
    'Prefers evening visits'
  ];
  
  return [
    headers.join(','),
    exampleRow.map(val => `"${val}"`).join(',')
  ].join('\n');
}

/**
 * Generate JSON template for doctor import
 */
export function generateJSONTemplate(): string {
  const example = [
    {
      doctor_name: 'Dr. John Smith',
      location: 'Mumbai',
      address: '123 Main Street, Andheri',
      speciality: 'Cardiologist',
      qualification: 'MBBS, MD',
      hospital: 'City Hospital',
      mobile: '+91 9876543210',
      notes: 'Prefers evening visits'
    },
    {
      doctor_name: 'Dr. Jane Doe',
      location: 'Delhi',
      address: '456 Park Avenue, Connaught Place',
      speciality: 'Pediatrician',
      qualification: 'MBBS, DCH',
      hospital: 'Care Clinic',
      mobile: '+91 9123456789',
      notes: 'Available on weekdays'
    }
  ];
  
  return JSON.stringify(example, null, 2);
}

/**
 * Detect file format from content
 */
export function detectFormat(content: string): 'json' | 'csv' | 'unknown' {
  const trimmed = content.trim();
  
  // Check for JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }
  
  // Check for CSV (has comma-separated values and multiple lines)
  if (trimmed.includes(',') && trimmed.includes('\n')) {
    return 'csv';
  }
  
  return 'unknown';
}

/**
 * Parse file content based on auto-detected format
 */
export function parseImportFile(content: string): DoctorInput[] {
  const format = detectFormat(content);
  
  switch (format) {
    case 'json':
      return parseJSON(content);
    case 'csv':
      return parseCSV(content);
    default:
      throw new Error('Unknown file format. Please use JSON or CSV.');
  }
}
