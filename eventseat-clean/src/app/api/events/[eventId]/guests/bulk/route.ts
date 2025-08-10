import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { guests } = body;

    if (!Array.isArray(guests)) {
      return NextResponse.json(
        { error: 'Guests must be an array' },
        { status: 400 }
      );
    }

    const addedGuests = [];
    const errors = [];

    for (const guestData of guests) {
      const { name, tableNumber, seatNumber } = guestData;

      if (!name || !tableNumber) {
        errors.push(`Guest ${name || 'unnamed'}: Name and table number are required`);
        continue;
      }

      const guest = storage.addGuest(eventId, {
        name,
        tableNumber: parseInt(tableNumber),
        seatNumber,
      });

      if (guest) {
        addedGuests.push(guest);
      } else {
        errors.push(`Failed to add guest: ${name}`);
      }
    }

    return NextResponse.json({
      added: addedGuests,
      errors,
      summary: {
        total: guests.length,
        added: addedGuests.length,
        errors: errors.length,
      },
    });
  } catch (error) {
    console.error('Error adding bulk guests:', error);
    return NextResponse.json(
      { error: 'Failed to add bulk guests' },
      { status: 500 }
    );
  }
}
