"use client";

import { useEffect, useState } from "react";

import { DoctorsService } from "@/lib/supabase/services";
import type { DoctorRow } from "@/lib/supabase/database.types";
import {
  AlertCircle,
  Phone,
  MapPin,
  Stethoscope,
  Users,
  ChevronDown,
} from "lucide-react";

interface QualityIssues {
  missingSpeciality: DoctorRow[];
  missingMobile: DoctorRow[];
  missingAddress: DoctorRow[];
  duplicateNames: Array<{ name: string; doctors: DoctorRow[] }>;
}

export default function DataQualityPage() {
  const [issues, setIssues] = useState<QualityIssues | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    loadQualityIssues();
  }, []);

  async function loadQualityIssues() {
    setLoading(true);
    try {
      const doctors = await DoctorsService.getAllDoctors();

      // Find missing data
      const missingSpeciality = doctors.filter(
        (d) => !d.speciality || d.speciality.trim() === "",
      );
      const missingMobile = doctors.filter(
        (d) => !d.mobile || d.mobile.trim() === "",
      );
      const missingAddress = doctors.filter(
        (d) => !d.address || d.address.trim() === "",
      );

      // Find duplicates by name (case-insensitive)
      const nameMap = new Map<string, DoctorRow[]>();
      doctors.forEach((doctor) => {
        const normalizedName = doctor.doctor_name.toLowerCase().trim();
        if (!nameMap.has(normalizedName)) {
          nameMap.set(normalizedName, []);
        }
        nameMap.get(normalizedName)!.push(doctor);
      });

      const duplicateNames = Array.from(nameMap.entries())
        .filter(([, docs]) => docs.length > 1)
        .map(([name, docs]) => ({ name, doctors: docs }));

      setIssues({
        missingSpeciality,
        missingMobile,
        missingAddress,
        duplicateNames,
      });
    } catch (err) {
      console.error("Failed to load quality issues:", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(section: string) {
    setExpandedSection(expandedSection === section ? null : section);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-8">
        <div className="px-4 sm:px-5 lg:px-6 max-w-7xl mx-auto py-20">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400">Analyzing data quality...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!issues) {
    return (
      <div className="min-h-screen bg-slate-950 pt-8">
        <div className="px-4 sm:px-5 lg:px-6 max-w-7xl mx-auto py-20">
          <div className="text-center text-slate-400">
            Failed to load quality data
          </div>
        </div>
      </div>
    );
  }

  const totalIssues =
    issues.missingSpeciality.length +
    issues.missingMobile.length +
    issues.missingAddress.length +
    issues.duplicateNames.reduce((sum, dup) => sum + dup.doctors.length, 0);

  return (
    <div className="min-h-screen bg-slate-950 pt-8">
      <div className="px-4 sm:px-5 lg:px-6 max-w-7xl mx-auto space-y-6">
        {/* Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                {totalIssues} {totalIssues === 1 ? "Issue" : "Issues"} Found
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Review and fix data quality issues below to improve data
                completeness
              </p>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          {/* Missing Speciality */}
          <QualitySection
            icon={Stethoscope}
            title="Missing Speciality"
            count={issues.missingSpeciality.length}
            color="blue"
            expanded={expandedSection === "speciality"}
            onToggle={() => toggleSection("speciality")}
          >
            <div className="space-y-2">
              {issues.missingSpeciality.map((doctor) => (
                <DoctorItem key={doctor.id} doctor={doctor} />
              ))}
            </div>
          </QualitySection>

          {/* Missing Mobile */}
          <QualitySection
            icon={Phone}
            title="Missing Mobile Number"
            count={issues.missingMobile.length}
            color="green"
            expanded={expandedSection === "mobile"}
            onToggle={() => toggleSection("mobile")}
          >
            <div className="space-y-2">
              {issues.missingMobile.map((doctor) => (
                <DoctorItem key={doctor.id} doctor={doctor} />
              ))}
            </div>
          </QualitySection>

          {/* Missing Address */}
          <QualitySection
            icon={MapPin}
            title="Missing Address"
            count={issues.missingAddress.length}
            color="purple"
            expanded={expandedSection === "address"}
            onToggle={() => toggleSection("address")}
          >
            <div className="space-y-2">
              {issues.missingAddress.map((doctor) => (
                <DoctorItem key={doctor.id} doctor={doctor} />
              ))}
            </div>
          </QualitySection>

          {/* Duplicate Names */}
          <QualitySection
            icon={Users}
            title="Duplicate Names"
            count={issues.duplicateNames.reduce(
              (sum, dup) => sum + dup.doctors.length,
              0,
            )}
            color="red"
            expanded={expandedSection === "duplicates"}
            onToggle={() => toggleSection("duplicates")}
          >
            <div className="space-y-4">
              {issues.duplicateNames.map((duplicate, i) => (
                <div
                  key={i}
                  className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <p className="font-medium text-red-900 dark:text-red-300 mb-3">
                    "{duplicate.name}" ({duplicate.doctors.length} occurrences)
                  </p>
                  <div className="space-y-2">
                    {duplicate.doctors.map((doctor) => (
                      <DoctorItem key={doctor.id} doctor={doctor} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </QualitySection>
        </div>

        {/* No Issues */}
        {totalIssues === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
              No Data Quality Issues Found!
            </h3>
            <p className="text-green-700 dark:text-green-400">
              All doctors have complete information
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function QualitySection({
  icon: Icon,
  title,
  count,
  color,
  expanded,
  onToggle,
  children,
}: {
  icon: any;
  title: string;
  count: number;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600",
    green:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600",
  };

  if (count === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {count} {count === 1 ? "doctor" : "doctors"}
            </p>
          </div>
        </div>
        <div
          className={`w-6 h-6 rounded flex items-center justify-center transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
          {children}
        </div>
      )}
    </div>
  );
}

function DoctorItem({ doctor }: { doctor: DoctorRow }) {
  return (
    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">
            {doctor.doctor_name}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-slate-600 dark:text-slate-400">
            <span>📍 {doctor.location}</span>
            {doctor.speciality && <span>🩺 {doctor.speciality}</span>}
            {doctor.hospital && <span>🏥 {doctor.hospital}</span>}
          </div>
        </div>
        <button
          onClick={() => (window.location.href = `/admin/doctors`)}
          className="text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
