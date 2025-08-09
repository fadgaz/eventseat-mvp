import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
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

      const guest = storage.addGuest(params.eventId, {
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

    if (addedGuests.length === 0) {
      return NextResponse.json(
        { error: 'No guests were added', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      addedGuests,
      count: addedGuests.length,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 201 });

  } catch (error) {
    console.error('Error bulk adding guests:', error);
    return NextResponse.json(
      { error: 'Failed to add guests' },
      { status: 500 }
    );
  }
} 