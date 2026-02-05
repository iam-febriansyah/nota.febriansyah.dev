/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, withTransaction } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { sendEmail } from '@/lib/mail';
import { decodeId } from '@/lib/encryption';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session || (session.role !== 'Finance' && session.role !== 'Superadmin')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id: encryptedId } = await params;
  const id = decodeId(encryptedId);

  try {
    const { status, notes } = await req.json();

    if (!status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    await withTransaction(async (connection) => {
      // 1. Update status in trx_header
      await connection.execute(
        'UPDATE trx_header SET status = ? WHERE id = ?',
        [status, id]
      );

      // 2. Insert into trx_status_log
      await connection.execute(
        'INSERT INTO trx_status_log (trx_header_id, status, notes, updated_by) VALUES (?, ?, ?, ?)',
        [id, status, notes || 'Status updated', session.id]
      );
    });

    // 3. Send Email Notification to Dealer
    try {
      const dealerInfo = await executeQuery<any[]>(
        `SELECT u.email, h.invoice_number 
         FROM trx_header h 
         JOIN dealers d ON h.dealer_id = d.id 
         JOIN users u ON u.role = 'Dealer' 
         WHERE h.id = ? LIMIT 1`,
        [id]
      );

      if (dealerInfo.length > 0) {
        await sendEmail({
          to: dealerInfo[0].email,
          subject: `Transaction Status Update: ${dealerInfo[0].invoice_number}`,
          text: `Your transaction ${dealerInfo[0].invoice_number} status has been updated to: ${status}.\nNotes: ${notes || 'No extra notes.'}`,
          html: `<p>Your transaction <strong>${dealerInfo[0].invoice_number}</strong> status has been updated to: <strong>${status}</strong>.</p><p>Notes: ${notes || 'No extra notes.'}</p>`
        });
      }
    } catch (mailError) {
      console.error('Failed to send status update email:', mailError);
    }

    return NextResponse.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json({ message: 'Error updating status' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: encryptedId } = await params;
    const id = decodeId(encryptedId);

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
      const items = await executeQuery<any[]>(
        'SELECT i.*, b.name as barang_name, b.code as barang_code FROM trx_items i JOIN mst_barang b ON i.barang_id = b.id WHERE i.header_id = ?',
        [id]
      );

      // Get Logs
      const logs = await executeQuery<any[]>(
        'SELECT l.*, u.name as updater_name FROM trx_status_log l JOIN users u ON l.updated_by = u.id WHERE l.trx_header_id = ? ORDER BY l.created_at DESC',
        [id]
      );

      return NextResponse.json({
        header: headers[0],
        items,
        logs
      });
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return NextResponse.json({ message: 'Error fetching transaction details' }, { status: 500 });
    }
}
