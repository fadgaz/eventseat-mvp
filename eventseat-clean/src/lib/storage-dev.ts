import { Event, Guest } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Simple file-based storage for MVP to persist between hot reloads
// In production, this would be replaced with a proper database
const DATA_FILE = path.join(process.cwd(), 'data', 'events.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load events from file
const loadEvents = (): Event[] => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading events:', error);
  }
  return [];
};

// Save events to file
const saveEvents = (events: Event[]): void => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2));
  } catch (error) {
    console.error('Error saving events:', error);
  }
};

// Don't load events at module level - load on each request to avoid hot-reload issues
let events: Event[] = [];

export const storage = {
  // Event operations
  createEvent: (eventData: Omit<Event, 'id' | 'createdAt' | 'guests'>): Event => {
    events = loadEvents(); // Reload from file each time
    const event: Event = {
      ...eventData,
      id: uuidv4(),
      guests: [],
      createdAt: new Date().toISOString(),
    };
    events.push(event);
    saveEvents(events);
    return event;
  },

  getEvent: (eventId: string): Event | null => {
    events = loadEvents(); // Reload from file each time
    return events.find(event => event.id === eventId) || null;
  },

  getAllEvents: (): Event[] => {
    events = loadEvents(); // Reload from file each time
    return events;
  },

  updateEvent: (eventId: string, updates: Partial<Event>): Event | null => {
    events = loadEvents(); // Reload from file each time
    const eventIndex = events.findIndex(event => event.id === eventId);
    if (eventIndex === -1) return null;
    
    events[eventIndex] = { ...events[eventIndex], ...updates };
    saveEvents(events);
    return events[eventIndex];
  },

  // Guest operations
  addGuest: (eventId: string, guestData: Omit<Guest, 'id'>): Guest | null => {
    events = loadEvents(); // Reload from file each time
    const event = events.find(e => e.id === eventId);
    if (!event) return null;

    const guest: Guest = {
      ...guestData,
      id: uuidv4(),
    };

    event.guests.push(guest);
    saveEvents(events);
    return guest;
  },

  updateGuest: (eventId: string, guestId: string, updates: Partial<Guest>): Guest | null => {
    events = loadEvents(); // Reload from file each time
    const event = events.find(e => e.id === eventId);
    if (!event) return null;

    const guestIndex = event.guests.findIndex(g => g.id === guestId);
    if (guestIndex === -1) return null;

    event.guests[guestIndex] = { ...event.guests[guestIndex], ...updates };
    saveEvents(events);
    return event.guests[guestIndex];
  },

  deleteGuest: (eventId: string, guestId: string): boolean => {
    events = loadEvents(); // Reload from file each time
    const event = events.find(e => e.id === eventId);
    if (!event) return false;

    const guestIndex = event.guests.findIndex(g => g.id === guestId);
    if (guestIndex === -1) return false;

    event.guests.splice(guestIndex, 1);
    saveEvents(events);
    return true;
  },

  // Search functionality
  searchGuests: (eventId: string, searchTerm: string): Guest[] => {
    events = loadEvents(); // Reload from file each time
    const event = events.find(e => e.id === eventId);
    if (!event) return [];

    const normalizedSearch = searchTerm.toLowerCase().trim();
    return event.guests.filter(guest => 
      guest.name.toLowerCase().includes(normalizedSearch)
    );
  },
}; 