import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await request.json();
    const { name, tableNumber, seatNumber } = body;

    if (!name || !tableNumber) {
      return NextResponse.json(
        { error: 'Guest name and table number are required' },
        { status: 400 }
      );
    }

    const guest = storage.addGuest(params.eventId, {
      name,
      tableNumber: parseInt(tableNumber),
      seatNumber,
    });

    if (!guest) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    console.error('Error adding guest:', error);
    return NextResponse.json(
      { error: 'Failed to add guest' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');

    if (!searchTerm) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      );
    }

    const guests = storage.searchGuests(params.eventId, searchTerm);
    return NextResponse.json(guests);
  } catch (error) {
    console.error('Error searching guests:', error);
    return NextResponse.json(
      { error: 'Failed to search guests' },
      { status: 500 }
    );
  }
} 