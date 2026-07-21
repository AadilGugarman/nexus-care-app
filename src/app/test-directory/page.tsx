'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { DirectoryService } from '@/lib/supabase/services';

export default function TestDirectoryPage() {
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [publicDoctors, setPublicDoctors] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [rawCount, setRawCount] = useState<number>(0);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Check table structure
      const { data: columnsData } = await supabase
        .from('doctors')
        .select('*')
        .limit(1);

      if (columnsData && columnsData.length > 0) {
        setColumns(Object.keys(columnsData[0]));
      }

      // Get raw count
      const { count, error: countError } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        setRawCount(count || 0);
      }

      // Get all doctors (admin view)
      const { data: all, error: allError } = await supabase
        .from('doctors')
        .select('*')
        .limit(10);

      if (allError) throw allError;

      // Get public doctors
      const publicDocs = await DirectoryService.getPublicDoctors();

      // Get stats
      const statistics = await DirectoryService.getPublicStatistics();

      setAllDoctors(all || []);
      setPublicDoctors(publicDocs);
      setStats(statistics);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function makeAllPublic() {
    try {
      setLoading(true);
      
      // First, ensure columns exist
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE doctors 
          ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
          ADD COLUMN IF NOT EXISTS public_visible BOOLEAN DEFAULT false;
        `
      }).catch(() => ({ error: null })); // Ignore if RPC doesn't exist

      // Update all doctors to be active and public
      const { error: updateError, count } = await supabase
        .from('doctors')
        .update({ 
          is_active: true,
          public_visible: true,
          updated_at: new Date().toISOString()
        })
        .neq('id', 0) // Update all rows
        .select('*', { count: 'exact', head: true });

      if (updateError) throw updateError;

      alert(`Success! Updated ${count || 'all'} doctors to be public visible`);
      await loadData();
    } catch (err: any) {
      console.error('Update error:', err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addMissingColumns() {
    try {
      // Try to update a doctor with the new columns to test if they exist
      const { data: testDoc } = await supabase
        .from('doctors')
        .select('id')
        .limit(1)
        .single();

      if (!testDoc) {
        alert('No doctors found in database. Add some doctors first.');
        return;
      }

      const { error } = await supabase
        .from('doctors')
        .update({
          is_active: true,
          public_visible: true
        })
        .eq('id', testDoc.id);

      if (error && error.message.includes('column')) {
        alert('Missing columns detected. Please run the SQL script in Supabase SQL Editor:\n\n' + 
              'ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;\n' +
              'ALTER TABLE doctors ADD COLUMN IF NOT EXISTS public_visible BOOLEAN DEFAULT true;');
      } else if (error) {
        throw error;
      } else {
        alert('Columns exist! You can now use "Make All Public" button.');
        loadData();
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <p className="text-slate-900 dark:text-white">Loading diagnostic information...</p>
            <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasPublicVisibleColumn = columns.includes('public_visible');
  const hasIsActiveColumn = columns.includes('is_active');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            🔍 Directory Diagnostic Tool
          </h1>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-700 dark:text-red-400 font-semibold">Error:</p>
              <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* System Status */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mb-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">System Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Total Doctors in DB:</span>
                <span className="font-bold text-slate-900 dark:text-white">{rawCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">has "public_visible" column:</span>
                <span className={`font-bold ${hasPublicVisibleColumn ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {hasPublicVisibleColumn ? '✅ YES' : '❌ NO'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">has "is_active" column:</span>
                <span className={`font-bold ${hasIsActiveColumn ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {hasIsActiveColumn ? '✅ YES' : '❌ NO'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {(!hasPublicVisibleColumn || !hasIsActiveColumn) && (
              <div className="w-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4 mb-2">
                <p className="text-amber-800 dark:text-amber-300 font-semibold mb-2">⚠️ Missing Required Columns</p>
                <p className="text-amber-700 dark:text-amber-400 text-sm mb-3">
                  Your doctors table is missing required columns. Run the SQL script to fix this.
                </p>
                <button
                  onClick={addMissingColumns}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  Check & Add Missing Columns
                </button>
              </div>
            )}
            
            <button
              onClick={makeAllPublic}
              disabled={loading || rawCount === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
            >
              Make All Doctors Public
            </button>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="px-5 py-2.5 bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              Refresh Data
            </button>
          </div>

          <div className="space-y-6">
            {/* Statistics */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                📊 Public Directory Statistics
              </h2>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                {stats ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.totalDoctors}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Doctors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.totalLocations}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Cities</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.totalSpecialities}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Specialities</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-center">No stats available</p>
                )}
              </div>
            </div>

            {/* Sample Doctors */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                👥 Sample Doctors (First 10)
              </h2>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                {allDoctors.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 dark:text-slate-400 font-semibold mb-2">
                      No doctors found in database
                    </p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm">
                      Add doctors through the admin panel first
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-slate-900 dark:text-white font-semibold">
                              {doc.doctor_name || 'Unnamed'}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {doc.location || 'No location'} 
                              {doc.speciality && ` • ${doc.speciality}`}
                            </p>
                          </div>
                          <div className="text-right text-xs space-y-1">
                            {hasIsActiveColumn && (
                              <div className={doc.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {doc.is_active ? '✅ Active' : '❌ Inactive'}
                              </div>
                            )}
                            {hasPublicVisibleColumn && (
                              <div className={doc.public_visible ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-500'}>
                                {doc.public_visible ? '🌐 Public' : '🔒 Hidden'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Public Doctors */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                🌐 Public Directory Results ({publicDoctors.length})
              </h2>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                {publicDoctors.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">⚠️</div>
                    <p className="text-rose-600 dark:text-rose-400 font-semibold mb-2">
                      No Public Doctors Found!
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                      Doctors need both <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">is_active = true</code> AND{' '}
                      <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">public_visible = true</code>
                    </p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm">
                      Click "Make All Doctors Public" above to fix this.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {publicDoctors.slice(0, 5).map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-white dark:bg-slate-800 rounded-lg border-2 border-emerald-500/30 dark:border-emerald-400/30"
                      >
                        <p className="text-slate-900 dark:text-white font-semibold">
                          {doc.doctor_name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {doc.location}
                          {doc.speciality && ` • ${doc.speciality}`}
                        </p>
                      </div>
                    ))}
                    {publicDoctors.length > 5 && (
                      <p className="text-slate-500 dark:text-slate-400 text-sm text-center pt-2">
                        ... and {publicDoctors.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Column List */}
            <details className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <summary className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                🔧 Database Columns ({columns.length})
              </summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {columns.map((col) => (
                  <code
                    key={col}
                    className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs"
                  >
                    {col}
                  </code>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
