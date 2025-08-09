'use client';

import { useState, useRef, useEffect } from 'react';
import { Guest } from '@/types';

interface BulkGuestEntryProps {
  onSave: (guests: Omit<Guest, 'id'>[]) => Promise<void>;
  isLoading: boolean;
}

interface GuestRow {
  name: string;
  tableNumber: string;
  seatNumber: string;
}

export default function BulkGuestEntry({ onSave, isLoading }: BulkGuestEntryProps) {
  const [rows, setRows] = useState<GuestRow[]>([
    { name: '', tableNumber: '', seatNumber: '' }
  ]);
  const [currentCell, setCurrentCell] = useState<{ row: number; col: number } | null>(null);
  
  // Create refs for all input fields
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  // Initialize refs when rows change
  useEffect(() => {
    inputRefs.current = rows.map(() => [null, null, null]);
  }, [rows.length]);

  const updateRow = (rowIndex: number, field: keyof GuestRow, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [field]: value };
    setRows(newRows);
  };

  const addNewRow = () => {
    setRows([...rows, { name: '', tableNumber: '', seatNumber: '' }]);
  };

  const removeRow = (rowIndex: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, index) => index !== rowIndex);
      setRows(newRows);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      if (e.shiftKey) {
        // Shift+Tab: Go to previous cell
        if (colIndex > 0) {
          // Previous column in same row
          focusCell(rowIndex, colIndex - 1);
        } else if (rowIndex > 0) {
          // Last column of previous row
          focusCell(rowIndex - 1, 2);
        }
      } else {
        // Tab: Go to next cell
        if (colIndex < 2) {
          // Next column in same row
          focusCell(rowIndex, colIndex + 1);
        } else {
          // First column of next row (create new row if needed)
          if (rowIndex === rows.length - 1) {
            addNewRow();
            setTimeout(() => focusCell(rowIndex + 1, 0), 0);
          } else {
            focusCell(rowIndex + 1, 0);
          }
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      
      // Enter: Go to same column in next row (create new row if needed)
      if (rowIndex === rows.length - 1) {
        addNewRow();
        setTimeout(() => focusCell(rowIndex + 1, colIndex), 0);
      } else {
        focusCell(rowIndex + 1, colIndex);
      }
    }
  };

  const focusCell = (rowIndex: number, colIndex: number) => {
    const input = inputRefs.current[rowIndex]?.[colIndex];
    if (input) {
      input.focus();
      setCurrentCell({ row: rowIndex, col: colIndex });
    }
  };

  const handleSave = async () => {
    // Filter out empty rows and validate
    const validGuests = rows
      .filter(row => row.name.trim() && row.tableNumber.trim())
      .map(row => ({
        name: row.name.trim(),
        tableNumber: parseInt(row.tableNumber.trim()),
        seatNumber: row.seatNumber.trim() || undefined,
      }))
      .filter(guest => !isNaN(guest.tableNumber));

    if (validGuests.length === 0) {
      alert('Please add at least one guest with a name and table number.');
      return;
    }

    await onSave(validGuests);
    
    // Reset form
    setRows([{ name: '', tableNumber: '', seatNumber: '' }]);
    setCurrentCell(null);
  };

  const clearAll = () => {
    setRows([{ name: '', tableNumber: '', seatNumber: '' }]);
    setCurrentCell(null);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
                      <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-1/2">
                Guest Name *
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-1/6">
                Table Number *
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-1/6">
                Seat Number
              </th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100">
                <td className="py-2 px-4">
                  <input
                    ref={(el) => {
                      if (inputRefs.current[rowIndex]) {
                        inputRefs.current[rowIndex][0] = el;
                      }
                    }}
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(rowIndex, 'name', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
                    onFocus={() => setCurrentCell({ row: rowIndex, col: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., John Smith"
                  />
                </td>
                <td className="py-2 px-4">
                  <input
                    ref={(el) => {
                      if (inputRefs.current[rowIndex]) {
                        inputRefs.current[rowIndex][1] = el;
                      }
                    }}
                    type="number"
                    value={row.tableNumber}
                    onChange={(e) => updateRow(rowIndex, 'tableNumber', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 1)}
                    onFocus={() => setCurrentCell({ row: rowIndex, col: 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5"
                    min="1"
                  />
                </td>
                <td className="py-2 px-4">
                  <input
                    ref={(el) => {
                      if (inputRefs.current[rowIndex]) {
                        inputRefs.current[rowIndex][2] = el;
                      }
                    }}
                    type="text"
                    value={row.seatNumber}
                    onChange={(e) => updateRow(rowIndex, 'seatNumber', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 2)}
                    onFocus={() => setCurrentCell({ row: rowIndex, col: 2 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="A, 1, Left"
                  />
                </td>
                <td className="py-2 px-4">
                  {rows.length > 1 && (
                    <button
                      onClick={() => removeRow(rowIndex)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={clearAll}
          className="text-gray-500 hover:text-gray-700 text-sm underline"
          type="button"
        >
          Clear All
        </button>

        <div className="space-x-2">
          <span className="text-sm text-gray-500">
            {rows.filter(row => row.name.trim() && row.tableNumber.trim()).length} valid guests
          </span>
          <button
            onClick={handleSave}
            disabled={isLoading || rows.filter(row => row.name.trim() && row.tableNumber.trim()).length === 0}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Adding...' : 'Add Guests'}
          </button>
        </div>
      </div>


    </div>
  );
} 