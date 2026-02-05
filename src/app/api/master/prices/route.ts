/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const barangId = searchParams.get('barang_id');

  try {
    let query = 'SELECT p.*, b.name as barang_name FROM mst_barang_price p JOIN mst_barang b ON p.barang_id = b.id';
    const values = [];

    if (barangId) {
      query += ' WHERE p.barang_id = ?';
      values.push(barangId);
    }

    query += ' ORDER BY p.effective_date DESC';
    
    const prices = await executeQuery<any[]>(query, values);
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json({ message: 'Error fetching prices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== 'Superadmin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { barang_id, price, effective_date } = await req.json();

    if (!barang_id || !price || !effective_date) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await executeQuery(
      'INSERT INTO mst_barang_price (barang_id, price, effective_date) VALUES (?, ?, ?)',
      [barang_id, price, effective_date]
    );

    return NextResponse.json({ message: 'Price added successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error adding price:', error);
    return NextResponse.json({ message: 'Error adding price' }, { status: 500 });
  }
}
