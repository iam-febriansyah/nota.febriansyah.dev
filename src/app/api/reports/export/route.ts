/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { generateExcelBuffer } from '@/lib/reports';

export async function GET() {
  const session = await getAuthSession();
  if (!session || (session.role !== 'Finance' && session.role !== 'Superadmin')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const transactions = await executeQuery<any[]>(`
      SELECT h.invoice_number, d.name as dealer_name, h.total_amount, h.status, h.created_at 
      FROM trx_header h 
      JOIN dealers d ON h.dealer_id = d.id
      ORDER BY h.created_at DESC
    `);

    const buffer = await generateExcelBuffer(transactions);

    return new Response(Buffer.from(buffer as ArrayBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=transactions_report.xlsx',
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ message: 'Error generating report' }, { status: 500 });
  }
}
