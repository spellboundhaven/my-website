import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDatabase();

    const hostEmail = process.env.HOST_EMAIL || 'spellboundhaven.disney@gmail.com';

    // Find partial_paid invoices with check-in 67 days from now (60 + 7 day buffer)
    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setDate(today.getDate() + 67);
    const targetDate = reminderDate.toISOString().split('T')[0];

    const result = await sql`
      SELECT * FROM invoices
      WHERE payment_status = 'partial_paid'
        AND status != 'cancelled'
        AND check_in_date::date = ${targetDate}::date
    `;

    const invoices = result.rows;

    if (invoices.length === 0) {
      console.log(`[INVOICE CRON] No partial_paid invoices with check-in on ${targetDate}. Skipping.`);
      return NextResponse.json({
        success: true,
        message: 'No invoices need reminders today.',
      });
    }

    if (!process.env.RESEND_API_KEY) {
      console.log('[INVOICE CRON] RESEND_API_KEY not configured. Skipping email.');
      return NextResponse.json({ success: false, message: 'Email not configured' });
    }

    const formatDate = (dateStr: string) => {
      const d = dateStr.split('T')[0];
      const [year, month, day] = d.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const invoiceRows = invoices.map(inv => {
      const amountPaid = parseFloat(inv.amount_paid) || 0;
      const totalAmount = parseFloat(inv.total_amount) || 0;
      const remaining = totalAmount - amountPaid;

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; font-weight: bold;">${inv.invoice_number}</td>
          <td style="padding: 12px 8px;">${inv.guest_name}</td>
          <td style="padding: 12px 8px;">${formatDate(inv.check_in_date)}</td>
          <td style="padding: 12px 8px;">${formatCurrency(totalAmount)}</td>
          <td style="padding: 12px 8px;">${formatCurrency(amountPaid)}</td>
          <td style="padding: 12px 8px; color: #dc2626; font-weight: bold;">${formatCurrency(remaining)}</td>
        </tr>
      `;
    }).join('');

    const totalRemaining = invoices.reduce((sum, inv) => {
      return sum + (parseFloat(inv.total_amount) || 0) - (parseFloat(inv.amount_paid) || 0);
    }, 0);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #7c3aed; margin-bottom: 5px;">💰 Invoice Payment Reminder</h1>
          <p style="color: #6b7280; margin-top: 0;">The following ${invoices.length === 1 ? 'invoice has' : 'invoices have'} a remaining balance due before check-in.</p>

          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
            <div style="font-size: 14px; color: #991b1b;">Total Remaining Balance</div>
            <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${formatCurrency(totalRemaining)}</div>
            <div style="font-size: 12px; color: #991b1b; margin-top: 4px;">Check-in is in 67 days — please prepare payment details for your guest(s)</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="text-align: left; padding: 10px 8px; color: #374151;">Invoice #</th>
              <th style="text-align: left; padding: 10px 8px; color: #374151;">Guest</th>
              <th style="text-align: left; padding: 10px 8px; color: #374151;">Check-in</th>
              <th style="text-align: left; padding: 10px 8px; color: #374151;">Total</th>
              <th style="text-align: left; padding: 10px 8px; color: #374151;">Paid</th>
              <th style="text-align: left; padding: 10px 8px; color: #374151;">Remaining</th>
            </tr>
            ${invoiceRows}
          </table>

          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <a href="https://www.spellboundhaven.com/admin" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Admin Dashboard</a>
          </div>

          <div style="margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>This is an automated reminder sent 67 days before check-in for partially paid invoices.</p>
          </div>
        </div>
      </div>
    `;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Invoice Reminder <noreply@spellboundhaven.com>',
      to: hostEmail,
      subject: `💰 Payment Reminder — ${invoices.length} invoice${invoices.length > 1 ? 's' : ''} with balance due (check-in ${formatDate(invoices[0].check_in_date)})`,
      html: emailHtml,
    });

    console.log(`[INVOICE CRON] Reminder sent for ${invoices.length} invoice(s) with check-in on ${targetDate}`);

    return NextResponse.json({
      success: true,
      message: `Reminder sent for ${invoices.length} invoice(s)`,
      invoiceCount: invoices.length,
      checkInDate: targetDate,
    });
  } catch (error) {
    console.error('[INVOICE CRON] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice reminder', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
