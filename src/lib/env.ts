// Environment Variable Validation
// This ensures all required environment variables are present and valid

/**
 * Validate required environment variables at startup
 * Throws error if any required variables are missing
 */
export function validateEnv() {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const missing: string[] = [];
  const invalid: string[] = [];

  // Check for missing variables
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  // Validate Supabase URL format
  if (required.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = new URL(required.NEXT_PUBLIC_SUPABASE_URL);
      if (!url.protocol.startsWith('http')) {
        invalid.push('NEXT_PUBLIC_SUPABASE_URL: Must be a valid HTTP(S) URL');
      }
    } catch {
      invalid.push('NEXT_PUBLIC_SUPABASE_URL: Invalid URL format');
    }
  }

  // Validate anon key format (should be a JWT)
  if (required.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const key = required.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (key.split('.').length !== 3) {
      invalid.push('NEXT_PUBLIC_SUPABASE_ANON_KEY: Invalid JWT format');
    }
  }

  // Throw error if validation fails
  if (missing.length > 0 || invalid.length > 0) {
    const errors: string[] = [];
    
    if (missing.length > 0) {
      errors.push(`Missing environment variables: ${missing.join(', ')}`);
    }
    
    if (invalid.length > 0) {
      errors.push(`Invalid environment variables: ${invalid.join('; ')}`);
    }
    
    throw new Error(
      `Environment validation failed:\n${errors.join('\n')}\n\n` +
      `Please check your .env.local file and ensure all required variables are set correctly.`
    );
  }
}

/**
 * Get environment variables safely
 * Returns typed environment configuration
 */
export function getEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    isProd: process.env.NODE_ENV === 'production',
    isDev: process.env.NODE_ENV === 'development',
  };
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
