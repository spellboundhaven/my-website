import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
  if (authHeader !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const sampleInvoices = [
    { invoice_number: 'INV-2026-001', guest_name: 'John Smith', check_in: 'Sat, Jul 25, 2026', total: 3850, paid: 1155, remaining: 2695 },
    { invoice_number: 'INV-2026-002', guest_name: 'Sarah Johnson', check_in: 'Sat, Jul 25, 2026', total: 2400, paid: 720, remaining: 1680 },
  ];

  const totalRemaining = sampleInvoices.reduce((sum, inv) => sum + inv.remaining, 0);

  const invoiceRows = sampleInvoices.map(inv => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; font-weight: bold;">${inv.invoice_number}</td>
      <td style="padding: 12px 8px;">${inv.guest_name}</td>
      <td style="padding: 12px 8px;">${inv.check_in}</td>
      <td style="padding: 12px 8px;">${formatCurrency(inv.total)}</td>
      <td style="padding: 12px 8px;">${formatCurrency(inv.paid)}</td>
      <td style="padding: 12px 8px; color: #dc2626; font-weight: bold;">${formatCurrency(inv.remaining)}</td>
    </tr>
  `).join('');

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #7c3aed; margin-bottom: 5px;">💰 Invoice Payment Reminder</h1>
        <p style="color: #6b7280; margin-top: 0;">The following invoices have a remaining balance due before check-in.</p>

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
          <p>⚠️ THIS IS A TEST EMAIL — This is an automated reminder sent 67 days before check-in for partially paid invoices.</p>
        </div>
      </div>
    </div>
  `;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Invoice Reminder <noreply@spellboundhaven.com>',
    to: 'spellboundhaven.disney@gmail.com',
    subject: '💰 [TEST] Payment Reminder — 2 invoices with balance due (check-in Sat, Jul 25, 2026)',
    html: emailHtml,
  });

  return NextResponse.json({ success: true, message: 'Test email sent to spellboundhaven.disney@gmail.com' });
}
