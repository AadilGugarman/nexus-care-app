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

interface RouteFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialName?: string;
  initialLocation?: string;
  locations: string[];
  onSubmit: (data: { name: string; location: string }) => void;
}

export function RouteFormDialog({
  open,
  onOpenChange,
  initialName,
  initialLocation,
  locations,
  onSubmit,
}: RouteFormDialogProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (open) {
      setName(initialName ?? '');
      setLocation(initialLocation ?? locations[0] ?? '');
    }
  }, [open, initialName, initialLocation, locations]);

  const isEditing = !!initialName;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;
    onSubmit({ name: name.trim(), location: location.trim() });
    onOpenChange(false);
  }

  return (
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
                <Input
                  id="route-location"
                  list="route-locations-list"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Nadiad"
                />
                <datalist id="route-locations-list">
                  {locations.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
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
  );
}
