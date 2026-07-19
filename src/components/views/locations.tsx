'use client';

import { memo, useState } from 'react';
import type { Doctor } from '@/lib/types';
import { LocationsList } from '@/components/views/locations-list';
import { LocationDoctors } from '@/components/views/location-doctors';

interface LocationsProps {
  onEditDoctor: (d: Doctor) => void;
  onSuggestEdit?: (d: Doctor) => void;
  onRequestInactive?: (d: Doctor) => void;
}

function LocationsImpl({ onEditDoctor, onSuggestEdit, onRequestInactive }: LocationsProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Screen 1: Locations List
  if (!selectedLocation) {
    return <LocationsList onSelectLocation={setSelectedLocation} />;
  }

  // Screen 2: Location Doctors
  return (
    <LocationDoctors
      location={selectedLocation}
      onBack={() => setSelectedLocation(null)}
      onEditDoctor={onEditDoctor}
      onSuggestEdit={onSuggestEdit}
      onRequestInactive={onRequestInactive}
    />
  );
}

export const Locations = memo(LocationsImpl);
