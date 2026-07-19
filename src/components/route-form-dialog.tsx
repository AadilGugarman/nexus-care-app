'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationBottomSheet } from '@/components/location-bottom-sheet';
import { MapPin, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialName?: string;
  initialLocation?: string;
  locations: string[];
  onSubmit: (data: { name: string; location: string }) => void;
  getDoctorCount?: (location: string) => number;
}

export function RouteFormDialog({
  open,
  onOpenChange,
  initialName,
  initialLocation,
  locations,
  onSubmit,
  getDoctorCount,
}: RouteFormDialogProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName ?? '');
      setLocation(initialLocation ?? '');
    }
  }, [open, initialName, initialLocation]);

  const isEditing = !!initialName;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;
    onSubmit({ name: name.trim(), location: location.trim() });
    onOpenChange(false);
  }

  const doctorCount = location && getDoctorCount ? getDoctorCount(location) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 overflow-hidden max-w-md">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700">
            <DialogTitle>{isEditing ? 'Rename Route' : 'Create Route'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the route name.' : 'Create a new route for visits.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="route-name">Route Name</Label>
                <Input
                  id="route-name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Route 1"
                />
              </div>
              {!initialLocation && (
                <div className="space-y-1.5">
                  <Label htmlFor="route-location">Location</Label>
                  <button
                    type="button"
                    onClick={() => setLocationPickerOpen(true)}
                    className={cn(
                      'w-full h-12 px-4 rounded-lg border-2 flex items-center gap-3 text-left transition-all',
                      location
                        ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900',
                    )}
                  >
                    <div
                      className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                        location
                          ? 'bg-indigo-600 dark:bg-indigo-500'
                          : 'bg-slate-100 dark:bg-slate-700',
                      )}
                    >
                      <MapPin
                        className={cn(
                          'h-4 w-4',
                          location ? 'text-white' : 'text-slate-500 dark:text-slate-400',
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {location ? (
                        <>
                          <div className="text-sm font-bold text-indigo-900 dark:text-indigo-100 truncate">
                            {location}
                          </div>
                          {doctorCount > 0 && (
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                              {doctorCount} {doctorCount === 1 ? 'Doctor' : 'Doctors'}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Select Location
                        </div>
                      )}
                    </div>
                    <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                  </button>
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 safe-bottom">
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-11 px-4 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !location.trim()}
                  className="h-11 px-5 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isEditing ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <LocationBottomSheet
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        locations={locations}
        selectedLocation={location}
        onSelect={setLocation}
        showDoctorCount={!!getDoctorCount}
        getDoctorCount={getDoctorCount}
        title="Select Location"
        description="Choose a location for this route"
      />
    </>
  );
}

