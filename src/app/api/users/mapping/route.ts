/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, withTransaction } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

// GET /api/users/mapping?userId=[id]
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== 'Superadmin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const mappings = await executeQuery<{ dealer_id: number }[]>(
      'SELECT dealer_id FROM user_dealer_mapping WHERE user_id = ?',
      [userId]
    );
    return NextResponse.json(mappings.map(m => m.dealer_id));
  } catch (error) {
    console.error('Error fetching mappings:', error);
    return NextResponse.json({ message: 'Error fetching mappings' }, { status: 500 });
  }
}

// POST /api/users/mapping
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== 'Superadmin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, dealerIds } = await req.json();

    if (!userId || !Array.isArray(dealerIds)) {
      return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
    }

    await withTransaction(async (connection) => {
      // 1. Clear existing mappings
      await connection.execute('DELETE FROM user_dealer_mapping WHERE user_id = ?', [userId]);

      // 2. Insert new mappings
      for (const dealerId of dealerIds) {
        await connection.execute(
          'INSERT INTO user_dealer_mapping (user_id, dealer_id) VALUES (?, ?)',
          [userId, dealerId]
        );
      }
    });

    return NextResponse.json({ message: 'Mappings updated successfully' });
  } catch (error) {
    console.error('Error updating mappings:', error);
    return NextResponse.json({ message: 'Error updating mappings' }, { status: 500 });
  }
}
