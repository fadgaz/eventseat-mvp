import { Event, Guest } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory storage for production MVP
// This will reset on each deployment, but gets us live quickly
// Can be upgraded to proper database later
let events: Event[] = [];

// In production, data will reset on deployment
// For a real production app, we'd use a database
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  console.log('⚠️  Using in-memory storage - data will reset on deployment');
}

export const storage = {
  // Event operations
  createEvent: (eventData: Omit<Event, 'id' | 'createdAt' | 'guests'>): Event => {
    const event: Event = {
      ...eventData,
      id: uuidv4(),
      guests: [],
      createdAt: new Date().toISOString(),
    };
    events.push(event);
    return event;
  },

  getEvent: (id: string): Event | null => {
    return events.find(event => event.id === id) || null;
  },

  getAllEvents: (): Event[] => {
    return events;
  },

  updateEvent: (id: string, updates: Partial<Event>): Event | null => {
    const index = events.findIndex(event => event.id === id);
    if (index !== -1) {
      events[index] = { ...events[index], ...updates };
      return events[index];
    }
    return null;
  },

  // Guest operations
  addGuest: (eventId: string, guestData: Omit<Guest, 'id'>): Guest | null => {
    const event = events.find(e => e.id === eventId);
    if (!event) return null;

    const guest: Guest = {
      ...guestData,
      id: uuidv4(),
    };
    event.guests.push(guest);
    return guest;
  },

  updateGuest: (eventId: string, guestId: string, updates: Partial<Guest>): Guest | null => {
    const event = events.find(e => e.id === eventId);
    if (!event) return null;

    const guestIndex = event.guests.findIndex(g => g.id === guestId);
    if (guestIndex === -1) return null;

    event.guests[guestIndex] = { ...event.guests[guestIndex], ...updates };
    return event.guests[guestIndex];
  },

  deleteGuest: (eventId: string, guestId: string): boolean => {
    const event = events.find(e => e.id === eventId);
    if (!event) return false;

    const initialLength = event.guests.length;
    event.guests = event.guests.filter(g => g.id !== guestId);
    return event.guests.length < initialLength;
  },

  searchGuests: (eventId: string, searchTerm: string): Guest[] => {
    const event = events.find(e => e.id === eventId);
    if (!event) return [];

    if (!searchTerm.trim()) return event.guests;

    const term = searchTerm.toLowerCase();
    return event.guests.filter(guest =>
      guest.name.toLowerCase().includes(term)
    );
  }
}; 