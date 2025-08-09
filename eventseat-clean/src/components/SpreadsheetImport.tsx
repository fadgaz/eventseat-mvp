'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';

interface Guest {
  name: string;
  tableNumber: number;
  seatNumber?: string;
}

interface SpreadsheetImportProps {
  onImport: (guests: Guest[]) => void;
  onCancel: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

export default function SpreadsheetImport({ onImport, onCancel }: SpreadsheetImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState({
    name: '',
    tableNumber: '',
    seatNumber: ''
  });
  const [preview, setPreview] = useState<Guest[]>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrors([]);

    // Check file type
    const fileType = uploadedFile.name.toLowerCase();
    if (!fileType.endsWith('.csv') && !fileType.endsWith('.xlsx') && !fileType.endsWith('.xls')) {
      setErrors(['Please upload a CSV or Excel file (.csv, .xlsx, .xls)']);
      return;
    }

    // For now, we'll only handle CSV files
    // Excel support can be added later with a library like xlsx
    if (!fileType.endsWith('.csv')) {
      setErrors(['Excel files are not yet supported. Please save your file as CSV format.']);
      return;
    }

    // Parse CSV
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrors(results.errors.map(error => error.message));
          return;
        }

        const data = results.data as ParsedRow[];
        const headerNames = Object.keys(data[0] || {});
        
        setParsedData(data);
        setHeaders(headerNames);
        setStep('mapping');

        // Auto-detect common column names
        const autoMapping = {
          name: headerNames.find(h => 
            h.toLowerCase().includes('name') || 
            h.toLowerCase().includes('guest')
          ) || '',
          tableNumber: headerNames.find(h => 
            h.toLowerCase().includes('table') || 
            h.toLowerCase().includes('tbl')
          ) || '',
          seatNumber: headerNames.find(h => 
            h.toLowerCase().includes('seat') || 
            h.toLowerCase().includes('chair')
          ) || ''
        };
        setColumnMapping(autoMapping);
      },
      error: (error) => {
        setErrors([`Error parsing CSV: ${error.message}`]);
      }
    });
  }, []);

  const handleMappingChange = (field: keyof typeof columnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePreview = () => {
    const validationErrors: string[] = [];
    
    // Validate required mappings
    if (!columnMapping.name) {
      validationErrors.push('Please select a column for Guest Name');
    }
    if (!columnMapping.tableNumber) {
      validationErrors.push('Please select a column for Table Number');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Generate preview data
    const previewData: Guest[] = [];
    const rowErrors: string[] = [];

    parsedData.forEach((row, index) => {
      const name = row[columnMapping.name]?.trim();
      const tableStr = row[columnMapping.tableNumber]?.trim();
      const seatNumber = columnMapping.seatNumber ? row[columnMapping.seatNumber]?.trim() : undefined;

      // Validate required fields
      if (!name) {
        rowErrors.push(`Row ${index + 2}: Missing guest name`);
        return;
      }

      if (!tableStr) {
        rowErrors.push(`Row ${index + 2}: Missing table number`);
        return;
      }

      const tableNumber = parseInt(tableStr);
      if (isNaN(tableNumber) || tableNumber < 1) {
        rowErrors.push(`Row ${index + 2}: Invalid table number "${tableStr}"`);
        return;
      }

      previewData.push({
        name,
        tableNumber,
        seatNumber: seatNumber || undefined
      });
    });

    setErrors(rowErrors);
    setPreview(previewData);
    setStep('preview');
  };

  const handleImport = () => {
    onImport(preview);
  };

  const reset = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setColumnMapping({ name: '', tableNumber: '', seatNumber: '' });
    setPreview([]);
    setStep('upload');
    setErrors([]);
  };

  return (
    <div className="space-y-6">
      {/* Step 1: File Upload */}
      {step === 'upload' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Guest List</h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="space-y-2">
                <div className="text-4xl text-gray-400">📊</div>
                <div>
                  <p className="text-lg font-medium text-gray-900">Choose a CSV file</p>
                  <p className="text-sm text-gray-500">or drag and drop here</p>
                </div>
                <p className="text-xs text-gray-400">CSV files only (.csv)</p>
              </div>
            </label>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium mb-3">Format your spreadsheet like this:</p>
            
            {/* Excel-style table */}
            <div className="bg-white border border-gray-300 rounded overflow-hidden mb-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-600">A</th>
                    <th className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-600">B</th>
                    <th className="px-3 py-2 text-center font-bold text-gray-600">C</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-300">
                    <td className="border-r border-gray-300 px-3 py-2 font-semibold bg-blue-50">Guest Name</td>
                    <td className="border-r border-gray-300 px-3 py-2 font-semibold bg-blue-50">Table Number</td>
                    <td className="px-3 py-2 font-semibold bg-blue-50">Seat Number</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="border-r border-gray-300 px-3 py-2">John Smith</td>
                    <td className="border-r border-gray-300 px-3 py-2">1</td>
                    <td className="px-3 py-2">A</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="border-r border-gray-300 px-3 py-2">Jane Doe</td>
                    <td className="border-r border-gray-300 px-3 py-2">1</td>
                    <td className="px-3 py-2">B</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="border-r border-gray-300 px-3 py-2">Michael Johnson</td>
                    <td className="border-r border-gray-300 px-3 py-2">2</td>
                    <td className="px-3 py-2">1</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="border-r border-gray-300 px-3 py-2">Sarah Wilson</td>
                    <td className="border-r border-gray-300 px-3 py-2">2</td>
                    <td className="px-3 py-2">2</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="border-r border-gray-300 px-3 py-2">Robert Brown</td>
                    <td className="border-r border-gray-300 px-3 py-2">3</td>
                    <td className="px-3 py-2 text-gray-400 italic">(empty)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 space-y-2">
              <div className="bg-blue-50 p-3 rounded border">
                <p className="font-semibold text-blue-800 mb-1">📋 Steps to create this in Excel:</p>
                <ol className="space-y-1 text-blue-700">
                  <li><strong>1.</strong> Put column headers in row 1 (Guest Name, Table Number, Seat Number)</li>
                  <li><strong>2.</strong> Fill in your guest data starting from row 2</li>
                  <li><strong>3.</strong> Save as CSV format: File → Save As → CSV (Comma delimited)</li>
                  <li><strong>4.</strong> Upload the CSV file here</li>
                </ol>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Map Columns</h3>
            <button
              onClick={reset}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Upload Different File
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Map your CSV columns to guest information fields:
          </p>

          <div className="space-y-4">
            {/* Name Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guest Name <span className="text-red-500">*</span>
              </label>
              <select
                value={columnMapping.name}
                onChange={(e) => handleMappingChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select column...</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            {/* Table Number Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table Number <span className="text-red-500">*</span>
              </label>
              <select
                value={columnMapping.tableNumber}
                onChange={(e) => handleMappingChange('tableNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select column...</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            {/* Seat Number Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seat Number <span className="text-gray-400">(Optional)</span>
              </label>
              <select
                value={columnMapping.seatNumber}
                onChange={(e) => handleMappingChange('seatNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select column...</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={generatePreview}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Preview Import
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Preview Import</h3>
            <button
              onClick={() => setStep('mapping')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Mapping
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {preview.length} guests will be imported:
          </p>

          <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Seat</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.slice(0, 10).map((guest, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">{guest.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{guest.tableNumber}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{guest.seatNumber || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && (
              <div className="bg-gray-50 px-4 py-2 text-sm text-gray-500 text-center">
                ... and {preview.length - 10} more guests
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleImport}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Import {preview.length} Guests
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Please fix these issues:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 