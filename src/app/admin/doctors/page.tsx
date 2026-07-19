"use client";

import { useEffect, useState } from "react";

import { DoctorsService, DirectoryService } from "@/lib/supabase/services";
import type { DoctorRow } from "@/lib/supabase/database.types";
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  Globe,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

export default function DoctorsManagement() {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [specialityFilter, setSpecialityFilter] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [specialities, setSpecialities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Dialog states
  const [viewDoctor, setViewDoctor] = useState<DoctorRow | null>(null);
  const [editDoctor, setEditDoctor] = useState<DoctorRow | null>(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery, locationFilter, specialityFilter]);

  async function loadDoctors() {
    setLoading(true);
    try {
      const [data, locs] = await Promise.all([
        DoctorsService.getAllDoctors(),
        DoctorsService.getLocations(),
      ]);

      setDoctors(data);
      setLocations(locs);

      // Extract unique specialities
      const specs = [
        ...new Set(data.map((d) => d.speciality).filter(Boolean) as string[]),
      ];
      setSpecialities(specs.sort());
    } catch (err) {
      console.error("Failed to load doctors:", err);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }

  function filterDoctors() {
    let filtered = [...doctors];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.doctor_name.toLowerCase().includes(query) ||
          d.location.toLowerCase().includes(query) ||
          (d.speciality?.toLowerCase() || "").includes(query) ||
          (d.hospital?.toLowerCase() || "").includes(query),
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter((d) => d.location === locationFilter);
    }

    // Speciality filter
    if (specialityFilter) {
      filtered = filtered.filter((d) => d.speciality === specialityFilter);
    }

    setFilteredDoctors(filtered);
  }

  async function handleDelete(doctor: DoctorRow) {
    if (!confirm(`Delete ${doctor.doctor_name}?`)) return;

    try {
      await DoctorsService.deleteDoctor(doctor.id);
      toast.success("Doctor deleted successfully");
      loadDoctors();
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error("Failed to delete doctor");
    }
  }

  async function toggleVisibility(doctor: DoctorRow) {
    const newVisibility = !doctor.public_visible;
    try {
      await DirectoryService.updateDoctorVisibility(doctor.id, newVisibility);
      toast.success(
        newVisibility
          ? "Doctor is now visible in public directory"
          : "Doctor is now hidden from public directory",
      );
      loadDoctors();
    } catch (err) {
      console.error("Failed to update visibility:", err);
      toast.error("Failed to update visibility");
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setLocationFilter("");
    setSpecialityFilter("");
    setShowFilters(false);
  }

  const activeFilters = [locationFilter, specialityFilter].filter(
    Boolean,
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-8">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-slate-400">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8">
      <div className="px-4 sm:px-5 lg:px-6 max-w-7xl mx-auto space-y-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilters > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-900 dark:text-white">
                  Filters
                </h3>
                {activeFilters > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">All Locations</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speciality Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Speciality
                  </label>
                  <select
                    value={specialityFilter}
                    onChange={(e) => setSpecialityFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">All Specialities</option>
                    {specialities.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Doctors List */}
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-slate-400">No doctors found</p>
            {(searchQuery || activeFilters > 0) && (
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {doctor.doctor_name}
                      </h3>
                      {doctor.public_visible && doctor.is_active && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <Globe className="w-3 h-3" />
                          Public
                        </span>
                      )}
                      {!doctor.public_visible && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400">
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-600 dark:text-slate-400">
                      <span>📍 {doctor.location}</span>
                      {doctor.speciality && <span>🩺 {doctor.speciality}</span>}
                      {doctor.hospital && <span>🏥 {doctor.hospital}</span>}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleVisibility(doctor)}
                      className={`p-2 rounded-lg transition-colors ${
                        doctor.public_visible
                          ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                      title={
                        doctor.public_visible
                          ? "Hide from public directory"
                          : "Show in public directory"
                      }
                    >
                      {doctor.public_visible ? (
                        <Globe className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setViewDoctor(doctor)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditDoctor(doctor)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doctor)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Dialog */}
        {viewDoctor && (
          <Dialog open={!!viewDoctor} onOpenChange={() => setViewDoctor(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{viewDoctor.doctor_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <DetailRow label="Location" value={viewDoctor.location} />
                {viewDoctor.speciality && (
                  <DetailRow label="Speciality" value={viewDoctor.speciality} />
                )}
                {viewDoctor.qualification && (
                  <DetailRow
                    label="Qualification"
                    value={viewDoctor.qualification}
                  />
                )}
                {viewDoctor.hospital && (
                  <DetailRow label="Hospital" value={viewDoctor.hospital} />
                )}
                {viewDoctor.mobile && (
                  <DetailRow label="Mobile" value={viewDoctor.mobile} />
                )}
                {viewDoctor.address && (
                  <DetailRow label="Address" value={viewDoctor.address} />
                )}
                {viewDoctor.notes && (
                  <DetailRow label="Notes" value={viewDoctor.notes} />
                )}
                <DetailRow
                  label="Public Visibility"
                  value={
                    viewDoctor.public_visible
                      ? "Visible in public directory"
                      : "Hidden from public directory"
                  }
                />
                <DetailRow
                  label="Created"
                  value={new Date(viewDoctor.created_at).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Dialog */}
        {editDoctor && (
          <Dialog open={!!editDoctor} onOpenChange={() => setEditDoctor(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Doctor</DialogTitle>
              </DialogHeader>
              <EditDoctorForm
                doctor={editDoctor}
                onSuccess={() => {
                  setEditDoctor(null);
                  loadDoctors();
                }}
                onCancel={() => setEditDoctor(null)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </p>
      <p className="text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function EditDoctorForm({
  doctor,
  onSuccess,
  onCancel,
}: {
  doctor: DoctorRow;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    doctor_name: doctor.doctor_name,
    location: doctor.location,
    address: doctor.address || "",
    speciality: doctor.speciality || "",
    qualification: doctor.qualification || "",
    hospital: doctor.hospital || "",
    mobile: doctor.mobile || "",
    notes: doctor.notes || "",
    public_visible: doctor.public_visible,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      await DoctorsService.updateDoctor(doctor.id, formData);
      toast.success("Doctor updated successfully");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update doctor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div>
        <Label>Doctor Name *</Label>
        <Input
          value={formData.doctor_name}
          onChange={(e) =>
            setFormData({ ...formData, doctor_name: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label>Location *</Label>
        <Input
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label>Speciality</Label>
        <Input
          value={formData.speciality}
          onChange={(e) =>
            setFormData({ ...formData, speciality: e.target.value })
          }
        />
      </div>

      <div>
        <Label>Mobile</Label>
        <Input
          value={formData.mobile}
          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          type="tel"
        />
      </div>

      <div>
        <Label>Hospital</Label>
        <Input
          value={formData.hospital}
          onChange={(e) =>
            setFormData({ ...formData, hospital: e.target.value })
          }
        />
      </div>

      <div>
        <Label>Qualification</Label>
        <Input
          value={formData.qualification}
          onChange={(e) =>
            setFormData({ ...formData, qualification: e.target.value })
          }
        />
      </div>

      <div>
        <Label>Address</Label>
        <Input
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
        />
      </div>

      <div>
        <Label>Notes</Label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
          rows={3}
        />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="public_visible"
            checked={formData.public_visible}
            onChange={(e) =>
              setFormData({ ...formData, public_visible: e.target.checked })
            }
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="public_visible" className="cursor-pointer">
            Show in public directory
          </Label>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
          When enabled, this doctor will appear in the public directory at
          /directory
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving}
          loading={saving}
          className="flex-1"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
