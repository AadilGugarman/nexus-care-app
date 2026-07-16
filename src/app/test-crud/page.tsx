'use client';

import { useState } from 'react';
import { DoctorsService } from '@/lib/supabase/services/doctors.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TestCRUDPage() {
  const [results, setResults] = useState<string[]>([]);
  const [testDoctorId, setTestDoctorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCreate = async () => {
    setLoading(true);
    try {
      addResult('🧪 Testing CREATE...');
      const doctor = await DoctorsService.addDoctor({
        doctor_name: 'Test Doctor',
        location: 'Test Location',
        address: '123 Test St',
        speciality: 'General',
        qualification: 'MBBS',
        hospital: 'Test Hospital',
        mobile: '1234567890',
        notes: 'Test notes',
      });
      setTestDoctorId(doctor.id);
      addResult(`✅ CREATE SUCCESS: Doctor ID ${doctor.id} created`);
    } catch (err: any) {
      addResult(`❌ CREATE FAILED: ${err.message}`);
    }
    setLoading(false);
  };

  const testRead = async () => {
    setLoading(true);
    try {
      addResult('🧪 Testing READ...');
      const doctors = await DoctorsService.getAllDoctors();
      addResult(`✅ READ SUCCESS: Found ${doctors.length} doctors`);
    } catch (err: any) {
      addResult(`❌ READ FAILED: ${err.message}`);
    }
    setLoading(false);
  };

  const testUpdate = async () => {
    if (!testDoctorId) {
      addResult('⚠️ Run CREATE test first to get a doctor ID');
      return;
    }
    setLoading(true);
    try {
      addResult('🧪 Testing UPDATE...');
      await DoctorsService.updateDoctor(testDoctorId, {
        doctor_name: 'Updated Test Doctor',
        notes: 'Updated notes',
      });
      addResult(`✅ UPDATE SUCCESS: Doctor ID ${testDoctorId} updated`);
    } catch (err: any) {
      addResult(`❌ UPDATE FAILED: ${err.message}`);
    }
    setLoading(false);
  };

  const testDelete = async () => {
    if (!testDoctorId) {
      addResult('⚠️ Run CREATE test first to get a doctor ID');
      return;
    }
    setLoading(true);
    try {
      addResult('🧪 Testing DELETE (soft delete)...');
      await DoctorsService.deleteDoctor(testDoctorId);
      addResult(`✅ DELETE SUCCESS: Doctor ID ${testDoctorId} soft deleted`);
      setTestDoctorId(null);
    } catch (err: any) {
      addResult(`❌ DELETE FAILED: ${err.message}`);
    }
    setLoading(false);
  };

  const testAll = async () => {
    setResults([]);
    await testCreate();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testRead();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testUpdate();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testDelete();
    addResult('🎉 All tests completed!');
  };

  const clearResults = () => {
    setResults([]);
    setTestDoctorId(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">🧪 CRUD Operations Test</h1>
          <p className="text-slate-400">
            Test all database operations to verify RLS fix
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Test</h2>
          <div className="flex gap-3 flex-wrap">
            <Button 
              onClick={testAll} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Run All Tests
            </Button>
            <Button 
              onClick={clearResults} 
              variant="outline"
              disabled={loading}
            >
              Clear Results
            </Button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold mb-4">Individual Tests</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={testCreate} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              1. Test CREATE
            </Button>
            <Button 
              onClick={testRead} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              2. Test READ
            </Button>
            <Button 
              onClick={testUpdate} 
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              3. Test UPDATE
            </Button>
            <Button 
              onClick={testDelete} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              4. Test DELETE
            </Button>
          </div>
          {testDoctorId && (
            <div className="mt-4 p-3 bg-slate-700 rounded text-sm">
              <strong>Test Doctor ID:</strong> {testDoctorId}
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-slate-400 text-sm">No tests run yet</p>
            ) : (
              results.map((result, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded text-sm font-mono ${
                    result.includes('✅') 
                      ? 'bg-green-950 text-green-300 border border-green-800' 
                      : result.includes('❌')
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : result.includes('⚠️')
                      ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-300 mb-2">📋 Instructions</h3>
          <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
            <li>First, run the fix SQL script in Supabase SQL Editor</li>
            <li>Click "Run All Tests" to verify all operations work</li>
            <li>Check for ✅ green success messages</li>
            <li>If you see ❌ red errors, the RLS fix may not be applied</li>
          </ol>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            ← Back to App
          </Button>
          <Button 
            onClick={() => window.location.href = '/verify-migration'}
            variant="outline"
          >
            Go to Migration Verification →
          </Button>
        </div>
      </div>
    </div>
  );
}
