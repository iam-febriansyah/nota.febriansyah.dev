/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { generateTransactionPDF } from '@/lib/reports';

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
     return NextResponse.json({ message: 'ID is required' }, { status: 400 });
  }

  try {
    // Get Header
    const headers = await executeQuery<any[]>(
      'SELECT h.*, d.name as dealer_name FROM trx_header h JOIN dealers d ON h.dealer_id = d.id WHERE h.id = ?',
      [id]
    );

    if (headers.length === 0) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    // Get Items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = await executeQuery<any[]>(
      'SELECT i.*, b.name as barang_name, b.code as barang_code FROM trx_items i JOIN mst_barang b ON i.barang_id = b.id WHERE i.header_id = ?',
      [id]
    );

    const pdfBytes = await generateTransactionPDF({
      header: headers[0],
      items
    });

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice_${headers[0].invoice_number}.pdf`,
      },
    });
  } catch (error) {
    console.error('PDF error:', error);
    return NextResponse.json({ message: 'Error generating PDF' }, { status: 500 });
  }
}
