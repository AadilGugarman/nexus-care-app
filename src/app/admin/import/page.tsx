'use client';

import { useState } from 'react';
import { DoctorsService } from '@/lib/supabase/services';
import { parseCSV, parseJSON, generateCSVTemplate, generateJSONTemplate, detectFormat } from '@/lib/utils/bulk-import';
import type { DoctorInput } from '@/lib/validation/doctor-validation';
import { Upload, Download, FileJson, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ index: number; doctor: DoctorInput; errors: string[] }>;
}

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DoctorInput[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  function handleDownloadTemplate(format: 'csv' | 'json') {
    const template = format === 'csv' ? generateCSVTemplate() : generateJSONTemplate();
    const blob = new Blob([template], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor-import-template.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${format.toUpperCase()} template downloaded`);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview([]);
    setResult(null);

    try {
      const text = await selectedFile.text();
      const format = detectFormat(text);
      
      if (format === 'unknown') {
        toast.error('Unknown file format. Please use JSON or CSV');
        return;
      }

      const doctors = format === 'json' ? parseJSON(text) : parseCSV(text);
      setPreview(doctors);
      toast.success(`Loaded ${doctors.length} doctors for preview`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse file');
      setFile(null);
    }
  }

  async function handleImport() {
    if (preview.length === 0) {
      toast.error('No data to import');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const importResult = await DoctorsService.bulkImportDoctors(preview);
      setResult(importResult);
      
      if (importResult.success > 0) {
        toast.success(`Successfully imported ${importResult.success} doctors`);
      }
      
      if (importResult.failed > 0) {
        toast.error(`${importResult.failed} doctors failed validation`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setFile(null);
    setPreview([]);
    setResult(null);
    setShowErrors(false);
  }

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bulk Import</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Import multiple doctors from CSV or JSON files
        </p>
      </div>

      {/* Download Templates */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Download Template
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Download a template file with sample data and correct column names
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => handleDownloadTemplate('csv')}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Download CSV Template
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDownloadTemplate('json')}
            className="flex items-center gap-2"
          >
            <FileJson className="w-4 h-4" />
            Download JSON Template
          </Button>
        </div>
      </div>

      {/* Upload File */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Upload File
          </h2>
        </div>
        
        {!file ? (
          <div>
            <label className="block">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-slate-500">
                  CSV or JSON files supported
                </p>
              </div>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  {file.name.endsWith('.json') ? (
                    <FileJson className="w-5 h-5 text-blue-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {preview.length} doctors ready to import
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Change File
              </Button>
            </div>

            {/* Preview */}
            {preview.length > 0 && !result && (
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-3">
                  Preview (first 5 records)
                </h3>
                <div className="space-y-2 mb-4">
                  {preview.slice(0, 5).map((doctor, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {doctor.doctor_name || <span className="text-red-500">Missing name</span>}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        {doctor.location || <span className="text-red-500">Missing location</span>}
                        {doctor.speciality && ` • ${doctor.speciality}`}
                      </div>
                    </div>
                  ))}
                  {preview.length > 5 && (
                    <p className="text-sm text-slate-500 text-center">
                      ...and {preview.length - 5} more
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleImport}
                  disabled={importing}
                  loading={importing}
                  className="w-full"
                >
                  {importing ? 'Importing...' : `Import ${preview.length} Doctors`}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import Result */}
      {result && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
            Import Results
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{result.success}</p>
                <p className="text-sm text-green-700 dark:text-green-400">Successfully imported</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-red-700 dark:text-red-400">Failed validation</p>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-3"
              >
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span className="font-medium">
                  View {result.errors.length} Validation Errors
                </span>
              </button>

              {showErrors && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.errors.map((error, i) => (
                    <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="font-medium text-red-900 dark:text-red-300 mb-1">
                        Row {error.index + 1}: {error.doctor.doctor_name || 'Unnamed'}
                      </p>
                      <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                        {error.errors.map((err, j) => (
                          <li key={j}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Import Another File
            </Button>
            <Button onClick={() => window.location.href = '/admin/doctors'} className="flex-1">
              View All Doctors
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
