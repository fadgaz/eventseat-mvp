'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Event, Guest } from '@/types';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import BulkGuestEntry from '@/components/BulkGuestEntry';
import SpreadsheetImport from '@/components/SpreadsheetImport';

export default function ManageEvent() {
  const params = useParams();
  const eventId = params.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'import'>('single');

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const eventData = await response.json();
        setEvent(eventData);
      } else {
        console.error('Failed to fetch event');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingGuest(true);

    try {
      const response = await fetch(`/api/events/${eventId}/guests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: guestName,
          tableNumber: parseInt(tableNumber),
          seatNumber: seatNumber || undefined,
        }),
      });

      if (response.ok) {
        const newGuest = await response.json();
        setEvent(prev => prev ? {
          ...prev,
          guests: [...prev.guests, newGuest]
        } : null);
        
        // Reset form
        setGuestName('');
        setTableNumber('');
        setSeatNumber('');
      } else {
        console.error('Failed to add guest');
      }
    } catch (error) {
      console.error('Error adding guest:', error);
    } finally {
      setIsAddingGuest(false);
    }
  };

  const handleBulkSave = async (guests: Omit<Guest, 'id'>[]) => {
    try {
      const response = await fetch(`/api/events/${eventId}/guests/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guests }),
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh the event data to show new guests
        await fetchEvent();
        
        if (result.errors && result.errors.length > 0) {
          alert(`Added ${result.count} guests with some errors:\n${result.errors.join('\n')}`);
        } else {
          alert(`Successfully added ${result.count} guests!`);
        }
      } else {
        const error = await response.json();
        console.error('Failed to bulk add guests:', error);
        alert('Failed to add guests. Please check the data and try again.');
      }
    } catch (error) {
      console.error('Error bulk adding guests:', error);
      alert('An error occurred while adding guests.');
    }
  };

  const handleDeleteGuest = async (guestId: string, guestName: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/guests/${guestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove guest from local state
        setEvent(prev => prev ? {
          ...prev,
          guests: prev.guests.filter(g => g.id !== guestId)
        } : null);
      } else {
        console.error('Failed to delete guest');
        alert('Failed to delete guest. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting guest:', error);
      alert('An error occurred while deleting the guest.');
    }
  };

  const handleSpreadsheetImport = async (guests: { name: string; tableNumber: number; seatNumber?: string }[]) => {
    try {
      const response = await fetch(`/api/events/${eventId}/guests/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guests }),
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh event data
        const eventResponse = await fetch(`/api/events/${eventId}`);
        if (eventResponse.ok) {
          const updatedEvent = await eventResponse.json();
          setEvent(updatedEvent);
        }
        
        alert(`Successfully imported ${result.addedGuests} guests!`);
        setActiveTab('single'); // Switch back to single tab
      } else {
        console.error('Failed to import guests');
        alert('Failed to import guests. Please try again.');
      }
    } catch (error) {
      console.error('Error importing guests:', error);
      alert('An error occurred while importing guests.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const eventUrl = `${window.location.origin}/event/${eventId}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Event Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                <p className="text-gray-600 mt-1">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {event.guests.length} guest{event.guests.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Add Guest Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('single')}
                  className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'single'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Add Single Guest
                </button>
                <button
                  onClick={() => setActiveTab('bulk')}
                  className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'bulk'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Bulk Add Guests
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'import'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Import from Spreadsheet
                </button>
              </div>

              {activeTab === 'single' ? (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Guest</h2>
              
              <form onSubmit={handleAddGuest} className="space-y-4">
                <div>
                  <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., John Smith"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Table Number
                  </label>
                  <input
                    type="number"
                    id="tableNumber"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 5"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="seatNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Seat Number (Optional)
                  </label>
                  <input
                    type="text"
                    id="seatNumber"
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., A, 1, Left"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAddingGuest}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAddingGuest ? 'Adding Guest...' : 'Add Guest'}
                </button>
              </form>
                </div>
              ) : activeTab === 'bulk' ? (
                <BulkGuestEntry 
                  onSave={handleBulkSave} 
                  isLoading={isAddingGuest}
                />
              ) : (
                <SpreadsheetImport 
                  onImport={handleSpreadsheetImport}
                  onCancel={() => setActiveTab('single')}
                />
              )}
            </div>

            {/* Preview & QR Code Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Guest Experience</h2>
              
              {/* Preview Button */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">
                  Test how guests will experience your event by previewing the search page.
                </p>
                <a
                  href={eventUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  <span className="mr-2">👀</span>
                  Preview Guest Experience
                  <span className="ml-2">↗</span>
                </a>
              </div>

              {/* QR Code */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">QR Code for Event</h3>
                <QRCodeGenerator eventUrl={eventUrl} eventName={event.name} />
              </div>
            </div>
          </div>

          {/* Guest List */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Guest List</h2>
            
            {event.guests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No guests added yet. Add your first guest above!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Table</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Seat</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.guests.map((guest) => (
                      <tr key={guest.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-900">{guest.name}</td>
                        <td className="py-3 px-4 text-gray-600">{guest.tableNumber}</td>
                        <td className="py-3 px-4 text-gray-600">{guest.seatNumber || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteGuest(guest.id, guest.name)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                            title={`Delete ${guest.name}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 