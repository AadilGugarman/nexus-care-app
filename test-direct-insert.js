// Direct test of Supabase insert without Next.js
// Run with: node test-direct-insert.js

const SUPABASE_URL = 'https://eypgvkhylfrklwfnhaus.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cGd2a2h5bGZya2x3Zm5oYXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTIyOTEsImV4cCI6MjA5OTY2ODI5MX0.yzq8_ZEsk1DYGvo_yU2C_QEyIDA8dKwF1EsbN9tokes';

async function testInsert() {
  console.log('Testing direct POST to Supabase...\n');
  
  const testDoctor = {
    doctor_name: 'Direct Test Doctor',
    location: 'Test Location',
    address: '123 Test St',
    speciality: 'General',
  };
  
  console.log('Data to insert:', testDoctor);
  console.log('\nSending request...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/doctors`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testDoctor)
    });
    
    console.log('Status:', response.status, response.statusText);
    console.log('\nResponse Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    const text = await response.text();
    console.log('\nResponse Body:');
    console.log(text);
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Doctor inserted.');
      const data = JSON.parse(text);
      console.log('Doctor ID:', data[0]?.id);
      
      // Clean up - delete the test doctor
      console.log('\nCleaning up test doctor...');
      const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/doctors?id=eq.${data[0]?.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });
      console.log('Cleanup status:', deleteResponse.status);
    } else {
      console.log('\n❌ FAILED!');
      try {
        const errorData = JSON.parse(text);
        console.log('Error details:', JSON.stringify(errorData, null, 2));
      } catch {
        console.log('Raw error:', text);
      }
    }
    
  } catch (err) {
    console.error('\n❌ Exception:', err.message);
  }
}

testInsert();
