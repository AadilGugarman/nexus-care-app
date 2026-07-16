// Doctor Validation Layer
// Provides validation for doctor data before database operations

export interface DoctorValidationError {
  field: string;
  message: string;
  code: string;
}

export interface DoctorValidationResult {
  valid: boolean;
  errors: DoctorValidationError[];
}

export interface DoctorInput {
  doctor_name?: string;
  location?: string;
  mobile?: string;
  speciality?: string;
  address?: string;
  qualification?: string;
  hospital?: string;
  notes?: string;
}

/**
 * Validate doctor name
 */
function validateDoctorName(name: string | undefined): DoctorValidationError | null {
  if (!name || name.trim().length === 0) {
    return {
      field: 'doctor_name',
      message: 'Doctor name is required',
      code: 'REQUIRED_FIELD'
    };
  }
  
  if (name.trim().length < 2) {
    return {
      field: 'doctor_name',
      message: 'Doctor name must be at least 2 characters',
      code: 'MIN_LENGTH'
    };
  }
  
  if (name.length > 100) {
    return {
      field: 'doctor_name',
      message: 'Doctor name must not exceed 100 characters',
      code: 'MAX_LENGTH'
    };
  }
  
  // Check for valid characters (letters, spaces, dots, hyphens)
  const validPattern = /^[a-zA-Z.\s-]+$/;
  if (!validPattern.test(name.trim())) {
    return {
      field: 'doctor_name',
      message: 'Doctor name can only contain letters, spaces, dots, and hyphens',
      code: 'INVALID_FORMAT'
    };
  }
  
  return null;
}

/**
 * Validate location
 */
function validateLocation(location: string | undefined): DoctorValidationError | null {
  if (!location || location.trim().length === 0) {
    return {
      field: 'location',
      message: 'Location is required',
      code: 'REQUIRED_FIELD'
    };
  }
  
  if (location.trim().length < 2) {
    return {
      field: 'location',
      message: 'Location must be at least 2 characters',
      code: 'MIN_LENGTH'
    };
  }
  
  if (location.length > 100) {
    return {
      field: 'location',
      message: 'Location must not exceed 100 characters',
      code: 'MAX_LENGTH'
    };
  }
  
  return null;
}

/**
 * Validate mobile number
 */
function validateMobile(mobile: string | undefined): DoctorValidationError | null {
  if (!mobile || mobile.trim().length === 0) {
    // Mobile is optional
    return null;
  }
  
  // Remove spaces, hyphens, parentheses for validation
  const cleaned = mobile.replace(/[\s\-()]/g, '');
  
  // Check if it contains only digits and optional + prefix
  const validPattern = /^\+?\d+$/;
  if (!validPattern.test(cleaned)) {
    return {
      field: 'mobile',
      message: 'Mobile number can only contain digits, spaces, hyphens, and + prefix',
      code: 'INVALID_FORMAT'
    };
  }
  
  // Check length (should be between 10-15 digits)
  const digitsOnly = cleaned.replace(/\+/g, '');
  if (digitsOnly.length < 10) {
    return {
      field: 'mobile',
      message: 'Mobile number must be at least 10 digits',
      code: 'MIN_LENGTH'
    };
  }
  
  if (digitsOnly.length > 15) {
    return {
      field: 'mobile',
      message: 'Mobile number must not exceed 15 digits',
      code: 'MAX_LENGTH'
    };
  }
  
  return null;
}

/**
 * Validate speciality
 */
function validateSpeciality(speciality: string | undefined): DoctorValidationError | null {
  if (!speciality || speciality.trim().length === 0) {
    // Speciality is optional
    return null;
  }
  
  if (speciality.length > 100) {
    return {
      field: 'speciality',
      message: 'Speciality must not exceed 100 characters',
      code: 'MAX_LENGTH'
    };
  }
  
  return null;
}

/**
 * Validate address
 */
function validateAddress(address: string | undefined): DoctorValidationError | null {
  if (!address || address.trim().length === 0) {
    // Address is optional
    return null;
  }
  
  if (address.length > 500) {
    return {
      field: 'address',
      message: 'Address must not exceed 500 characters',
      code: 'MAX_LENGTH'
    };
  }
  
  return null;
}

/**
 * Validate qualification
 */
function validateQualification(qualification: string | undefined): DoctorValidationError | null {
  if (!qualification || qualification.trim().length === 0) {
    // Qualification is optional
    return null;
  }
  
  if (qualification.length > 200) {
    return {
      field: 'qualification',
      message: 'Qualification must not exceed 200 characters',
      code: 'MAX_LENGTH'
    };
  }
  
  return null;
}

/**
 * Validate hospital
 */
function validateHospital(hospital: string | undefined): DoctorValidationError | null {
  if (!hospital || hospital.trim().length === 0) {
    // Hospital is optional
    return null;
  }
  
  if (hospital.length > 200) {
    return {
      field: 'hospital',
      message: 'Hospital must not exceed 200 characters',
      code: 'MAX_LENGTH'
    };
  }
  
  return null;
}

/**
 * Validate notes
 */
function validateNotes(notes: string | undefined): DoctorValidationError | null {
  if (!notes || notes.trim().length === 0) {
    // Notes are optional
    return null;
  }
  
  if (notes.length > 1000) {
    return {
      field: 'notes',
      message: 'Notes must not exceed 1000 characters',
      code: 'MAX_LENGTH'
    };
  }
  
  return null;
}

/**
 * Validate complete doctor input
 */
export function validateDoctor(doctor: DoctorInput): DoctorValidationResult {
  const errors: DoctorValidationError[] = [];
  
  // Validate required fields
  const nameError = validateDoctorName(doctor.doctor_name);
  if (nameError) errors.push(nameError);
  
  const locationError = validateLocation(doctor.location);
  if (locationError) errors.push(locationError);
  
  // Validate optional fields
  const mobileError = validateMobile(doctor.mobile);
  if (mobileError) errors.push(mobileError);
  
  const specialityError = validateSpeciality(doctor.speciality);
  if (specialityError) errors.push(specialityError);
  
  const addressError = validateAddress(doctor.address);
  if (addressError) errors.push(addressError);
  
  const qualificationError = validateQualification(doctor.qualification);
  if (qualificationError) errors.push(qualificationError);
  
  const hospitalError = validateHospital(doctor.hospital);
  if (hospitalError) errors.push(hospitalError);
  
  const notesError = validateNotes(doctor.notes);
  if (notesError) errors.push(notesError);
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate bulk doctor import
 */
export function validateBulkDoctors(doctors: DoctorInput[]): {
  valid: DoctorInput[];
  invalid: Array<{ doctor: DoctorInput; errors: DoctorValidationError[]; index: number }>;
} {
  const valid: DoctorInput[] = [];
  const invalid: Array<{ doctor: DoctorInput; errors: DoctorValidationError[]; index: number }> = [];
  
  doctors.forEach((doctor, index) => {
    const result = validateDoctor(doctor);
    if (result.valid) {
      valid.push(doctor);
    } else {
      invalid.push({ doctor, errors: result.errors, index });
    }
  });
  
  return { valid, invalid };
}

/**
 * Sanitize doctor input (trim whitespace, normalize data)
 */
export function sanitizeDoctor(doctor: DoctorInput): DoctorInput {
  return {
    doctor_name: doctor.doctor_name?.trim(),
    location: doctor.location?.trim(),
    mobile: doctor.mobile?.trim(),
    speciality: doctor.speciality?.trim(),
    address: doctor.address?.trim(),
    qualification: doctor.qualification?.trim(),
    hospital: doctor.hospital?.trim(),
    notes: doctor.notes?.trim(),
  };
}

/**
 * Format error messages for display
 */
export function formatValidationErrors(errors: DoctorValidationError[]): string {
  return errors.map(err => `${err.field}: ${err.message}`).join('\n');
}
