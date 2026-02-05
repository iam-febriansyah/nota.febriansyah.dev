/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

interface Dealer {
  id: number;
  name: string;
  address?: string;
  phone?: string;
}

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    let query = 'SELECT * FROM dealers ORDER BY name ASC';
    const values: any[] = [];

    if (session.role === 'Dealer') {
      query = `
        SELECT d.* 
        FROM dealers d
        JOIN user_dealer_mapping m ON d.id = m.dealer_id
        WHERE m.user_id = ?
        ORDER BY d.name ASC
      `;
      values.push(session.id);
    }

    const dealers = await executeQuery<Dealer[]>(query, values);
    return NextResponse.json(dealers);
  } catch {
    return NextResponse.json({ message: 'Error fetching dealers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== 'Superadmin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, address, phone } = await req.json();

    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    await executeQuery('INSERT INTO dealers (name, address, phone) VALUES (?, ?, ?)', [name, address, phone]);
    return NextResponse.json({ message: 'Dealer created successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating dealer' }, { status: 500 });
  }
}
