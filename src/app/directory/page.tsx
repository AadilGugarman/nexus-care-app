'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin, Users, Search } from 'lucide-react';
import { DirectoryService } from '@/lib/supabase/services';

interface LocationStats {
  location: string;
  count: number;
}

export default function DirectoryPage() {
  const [locations, setLocations] = useState<LocationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    try {
      setLoading(true);
      setError(null);

      // Get all locations with doctor counts
      const allDoctors = await DirectoryService.getPublicDoctors();
      
      // Group by location and count
      const locationMap = new Map<string, number>();
      allDoctors.forEach(doc => {
        const current = locationMap.get(doc.location) || 0;
        locationMap.set(doc.location, current + 1);
      });

      // Convert to array and sort by count
      const locationStats: LocationStats[] = Array.from(locationMap.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count);

      setLocations(locationStats);

      // Track directory view
      DirectoryService.trackDirectoryView({
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      });
    } catch (err) {
      console.error('Error loading locations:', err);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }

  const filteredLocations = search
    ? locations.filter(loc => loc.location.toLowerCase().includes(search.toLowerCase()))
    : locations;

  const totalDoctors = locations.reduce((sum, loc) => sum + loc.count, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Loading locations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-300 font-semibold">{error}</p>
            <button
              onClick={loadLocations}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Locations</h1>
              <p className="text-sm text-slate-400 mt-1">
                {totalDoctors} doctors across {locations.length} cities
              </p>
            </div>
            <Link
              href="/"
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              Home
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Locations List */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {filteredLocations.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No locations found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLocations.map(loc => (
              <Link
                key={loc.location}
                href={`/directory/location/${encodeURIComponent(loc.location)}`}
                className="block bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl p-4 transition-colors border border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg">
                        {loc.location}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-sm text-slate-400">
                          {loc.count} {loc.count === 1 ? 'doctor' : 'doctors'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
