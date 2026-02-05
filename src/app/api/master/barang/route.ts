/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const barang = await executeQuery<any[]>('SELECT * FROM mst_barang ORDER BY name ASC');
    return NextResponse.json(barang);
  } catch {
    return NextResponse.json({ message: 'Error fetching items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== 'Superadmin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code, name } = await req.json();

    if (!code || !name) {
      return NextResponse.json({ message: 'Code and name are required' }, { status: 400 });
    }

    await executeQuery('INSERT INTO mst_barang (code, name) VALUES (?, ?)', [code, name]);
    return NextResponse.json({ message: 'Item created successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating item' }, { status: 500 });
  }
}
