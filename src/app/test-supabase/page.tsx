'use client';

import { useStore } from '@/lib/store';
import { useEffect, useState } from 'react';

export default function TestSupabasePage() {
  const { state, isLoaded, error } = useStore();
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    if (isLoaded) {
      const results: string[] = [];
      results.push(`✅ Store loaded successfully`);
      results.push(`📊 Doctors loaded: ${state.doctors.length}`);
      results.push(`📍 Routes loaded: ${state.routes.length}`);
      results.push(`📅 Assignments loaded: ${Object.keys(state.assignments).length}`);
      results.push(`⚙️ Theme: ${state.settings.theme}`);
      
      if (state.doctors.length > 0) {
        const firstDoctor = state.doctors[0];
        results.push(`\n👨‍⚕️ First Doctor:`);
        results.push(`   Name: ${firstDoctor.doctorName}`);
        results.push(`   Location: ${firstDoctor.location}`);
        results.push(`   ID: ${firstDoctor.id}`);
      }
      
      setTestResults(results);
    }
  }, [isLoaded, state]);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Error Loading Data</h1>
        <pre className="bg-red-50 p-4 rounded border border-red-200 text-red-800">
          {error}
        </pre>
        <div className="mt-4">
          <p className="text-sm text-gray-600">Check:</p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
            <li>.env.local has correct NEXT_PUBLIC_SUPABASE_URL</li>
            <li>.env.local has correct NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>supabase-schema-no-auth.sql was executed</li>
            <li>Supabase project is running</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading from Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎉 Supabase Integration Test</h1>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-green-800 mb-4">✅ Success!</h2>
        <div className="space-y-2">
          {testResults.map((result, idx) => (
            <p key={idx} className="text-green-700 font-mono text-sm">
              {result}
            </p>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">📊 Doctors</h3>
          <p className="text-3xl font-bold text-blue-600">{state.doctors.length}</p>
          <p className="text-sm text-gray-500">Total doctors loaded</p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">📍 Routes</h3>
          <p className="text-3xl font-bold text-purple-600">{state.routes.length}</p>
          <p className="text-sm text-gray-500">Total routes created</p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">📅 Assignments</h3>
          <p className="text-3xl font-bold text-orange-600">
            {Object.keys(state.assignments).length}
          </p>
          <p className="text-sm text-gray-500">Doctors with day assignments</p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">⚙️ Settings</h3>
          <p className="text-3xl font-bold text-gray-600 capitalize">{state.settings.theme}</p>
          <p className="text-sm text-gray-500">Current theme</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-3">🎯 What's Working</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✅</span>
            <span>Supabase connection established</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✅</span>
            <span>Data loaded from database</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✅</span>
            <span>Store hydrated with Supabase data</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✅</span>
            <span>All services integrated</span>
          </li>
        </ul>
      </div>

      <div className="mt-6 bg-gray-50 border rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-3">🔍 Sample Doctors</h3>
        <div className="space-y-2">
          {state.doctors.slice(0, 10).map((doctor) => (
            <div key={doctor.id} className="flex items-center justify-between p-2 bg-white rounded border">
              <div>
                <p className="font-medium">{doctor.doctorName}</p>
                <p className="text-sm text-gray-500">{doctor.location}</p>
              </div>
              <div className="text-sm text-gray-400">ID: {doctor.id}</div>
            </div>
          ))}
          {state.doctors.length > 10 && (
            <p className="text-center text-gray-500 text-sm pt-2">
              ... and {state.doctors.length - 10} more doctors
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <a
          href="/verify-migration"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-bold"
        >
          🔍 View Migration Verification
        </a>
        <a
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go to App
        </a>
        <a
          href="https://eypgvkhylfrklwfnhaus.supabase.co"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Open Supabase Dashboard
        </a>
      </div>
    </div>
  );
}
