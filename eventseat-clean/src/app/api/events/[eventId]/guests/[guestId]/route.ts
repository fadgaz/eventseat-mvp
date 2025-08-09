import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; guestId: string } }
) {
  try {
    const success = storage.deleteGuest(params.eventId, params.guestId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting guest:', error);
    return NextResponse.json(
      { error: 'Failed to delete guest' },
      { status: 500 }
    );
  }
} 