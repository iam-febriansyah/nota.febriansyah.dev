/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { encodeId } from '@/lib/encryption';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const isDealer = session.role === 'Dealer';
    let dealerIds: number[] = [];

    // If Dealer, fetch mapped dealer IDs
    if (isDealer) {
      const mappings = await executeQuery<{ dealer_id: number }[]>(
        'SELECT dealer_id FROM user_dealer_mapping WHERE user_id = ?',
        [session.id]
      );
      dealerIds = mappings.map(m => m.dealer_id);
      
      // If dealer has no mapped stores, return empty data immediately
      if (dealerIds.length === 0) {
        return NextResponse.json({
          widgets: { pending: 0, processing: 0, done: 0, reject: 0, total: 0 },
          trend: [],
          recent: []
        });
      }
    }

    // Helper to build WHERE clause
    const whereClause = isDealer 
      ? `WHERE dealer_id IN (${dealerIds.join(',')})` 
      : '';
    
    // For recent transactions, we need to qualify the column name
    const recentWhereClause = isDealer
      ? `WHERE h.dealer_id IN (${dealerIds.join(',')})`
      : '';

    // 1. Widgets (Counts)
    const widgetQuery = `
      SELECT 
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Proses' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN status = 'Reject' THEN 1 ELSE 0 END) as reject,
        COUNT(*) as total
      FROM trx_header
      ${whereClause}
    `;
    const counts = await executeQuery<any[]>(widgetQuery, []);

    // 2. Monthly Trend (Last 6 months)
    const trendQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%b %Y') as month,
        COUNT(*) as count,
        SUM(total_amount) as amount
      FROM trx_header
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      ${isDealer ? `AND dealer_id IN (${dealerIds.join(',')})` : ''}
      GROUP BY month
      ORDER BY MIN(created_at) ASC
    `;
    const trend = await executeQuery<any[]>(trendQuery, []);

    // 3. Recent Transactions
    const recentQuery = `
      SELECT h.*, d.name as dealer_name
      FROM trx_header h
      JOIN dealers d ON h.dealer_id = d.id
      ${recentWhereClause}
      ORDER BY h.created_at DESC
      LIMIT 5
    `;
    const recent = await executeQuery<any[]>(recentQuery, []);

    return NextResponse.json({
      widgets: counts[0] || { pending: 0, processing: 0, done: 0, reject: 0, total: 0 },
      trend,
      recent: recent.map((t: any) => ({
        ...t,
        slug: encodeId(t.id)
      }))
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ message: 'Error fetching dashboard data' }, { status: 500 });
  }
}
