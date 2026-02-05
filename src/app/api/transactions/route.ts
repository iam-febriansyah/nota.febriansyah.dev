/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, withTransaction } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { generateTransactionPDF } from '@/lib/reports';
import { sendEmail } from '@/lib/mail';
import { Buffer } from 'buffer';
import { encodeId } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || (session.role !== 'Dealer' && session.role !== 'Superadmin')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { dealer_id, items, total_amount, invoice_number, discount, promo_description } = await req.json();

    if (!dealer_id || !items || items.length === 0 || !invoice_number) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const result = await withTransaction(async (connection) => {
      // 1. Insert into trx_header
      const [headerResult]: any = await connection.execute(
        'INSERT INTO trx_header (invoice_number, dealer_id, total_amount, status, discount, promo_description) VALUES (?, ?, ?, ?, ?, ?)',
        [invoice_number, dealer_id, total_amount, 'Pending', discount || 0, promo_description || null]
      );
      const headerId = headerResult.insertId;

      // 2. Insert into trx_items
      for (const item of items) {
        await connection.execute(
          'INSERT INTO trx_items (header_id, barang_id, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [headerId, item.barang_id, item.qty, item.unit_price, item.subtotal]
        );
      }

      // 3. Insert into trx_status_log
      await connection.execute(
        'INSERT INTO trx_status_log (trx_header_id, status, notes, updated_by) VALUES (?, ?, ?, ?)',
        [headerId, 'Pending', 'Initial submission', session.id]
      );

      return headerId;
    });

    // 4. Send Email Notification to Finance
    try {
      // Fetch full data for PDF
      const headers = await executeQuery<any[]>(
        'SELECT h.*, d.name as dealer_name FROM trx_header h JOIN dealers d ON h.dealer_id = d.id WHERE h.id = ?',
        [result]
      );
      const trxItems = await executeQuery<any[]>(
        'SELECT i.*, b.name as barang_name, b.code as barang_code FROM trx_items i JOIN mst_barang b ON i.barang_id = b.id WHERE i.header_id = ?',
        [result]
      );

      const pdfBytes = await generateTransactionPDF({
        header: headers[0],
        items: trxItems
      });

      await sendEmail({
        to: process.env.FINANCE_EMAIL || 'finance@sinfoni.com',
        subject: `New Transaction Submitted: ${invoice_number}`,
        text: `Dealer ${headers[0].dealer_name} has submitted a new note: ${invoice_number}. Total amount: Rp ${total_amount.toLocaleString()}.`,
        attachments: [
          {
            filename: `invoice_${invoice_number}.pdf`,
            content: Buffer.from(pdfBytes)
          }
        ]
      });
    } catch (mailError) {
      console.error('Failed to send submission email:', mailError);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({ message: 'Transaction submitted successfully', headerId: result }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
       return NextResponse.json({ message: 'Invoice number already exists' }, { status: 400 });
    }
    console.error('Submission error:', error);
    return NextResponse.json({ message: 'Error submitting transaction' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const dealerId = searchParams.get('dealer_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const q = searchParams.get('q'); // General search
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    try {
      let query = `
        SELECT h.*, d.name as dealer_name 
        FROM trx_header h 
        JOIN dealers d ON h.dealer_id = d.id
      `;
      let countQuery = `
        SELECT COUNT(*) as total
        FROM trx_header h
        JOIN dealers d ON h.dealer_id = d.id
      `;
      const values: any[] = [];
      const filters = [];

      if (status) {
        filters.push('h.status = ?');
        values.push(status);
      }
      if (dealerId) {
        filters.push('h.dealer_id = ?');
        values.push(dealerId);
      } else if (session.role === 'Dealer') {
        // Find dealer ID for this user. 
        // Logic: search in dealers table where name matches session name (simplification)
        const dealerRow = await executeQuery<any[]>('SELECT id FROM dealers WHERE name = ?', [session.name]);
        if (dealerRow.length > 0) {
            filters.push('h.dealer_id = ?');
            values.push(dealerRow[0].id);
        }
      }

      if (startDate && endDate) {
        filters.push('h.created_at BETWEEN ? AND ?');
        values.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      }

      if (q) {
        filters.push('(h.invoice_number LIKE ? OR d.name LIKE ?)');
        values.push(`%${q}%`, `%${q}%`);
      }

      if (filters.length > 0) {
        const whereClause = ' WHERE ' + filters.join(' AND ');
        query += whereClause;
        countQuery += whereClause;
      }

      query += ' ORDER BY h.created_at DESC LIMIT ? OFFSET ?';
      const queryValues = [...values, limit, offset];

      const [transactions, countResult]: any = await Promise.all([
        executeQuery(query, queryValues),
        executeQuery(countQuery, values)
      ]);

      return NextResponse.json({
        data: transactions.map((t: any) => ({
          ...t,
          slug: encodeId(t.id)
        })),
        pagination: {
          total: countResult[0].total,
          page,
          limit,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (error) {
       console.error('Fetch error:', error);
       return NextResponse.json({ message: 'Error fetching transactions' }, { status: 500 });
    }
}
