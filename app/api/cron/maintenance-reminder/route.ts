import { NextRequest, NextResponse } from 'next/server';
import { getTasksDueInMonth, getAllMaintenanceTasks, initDatabase } from '@/lib/db';
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

    // Get tasks due NEXT month (reminder sent on 1st of current month for next month)
    const now = new Date();
    const nextMonth = now.getMonth() + 2; // +1 for 0-indexed, +1 for next month
    const nextMonthYear = nextMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();
    const normalizedMonth = nextMonth > 12 ? nextMonth - 12 : nextMonth;

    const tasksDueNextMonth = await getTasksDueInMonth(nextMonthYear, normalizedMonth);

    // Also get overdue tasks (next_due is before today)
    const allTasks = await getAllMaintenanceTasks();
    const todayStr = now.toISOString().split('T')[0];
    const overdueTasks = allTasks.filter(t => t.next_due && t.next_due < todayStr);

    if (tasksDueNextMonth.length === 0 && overdueTasks.length === 0) {
      console.log('[MAINTENANCE CRON] No tasks due next month and no overdue tasks. Skipping email.');
      return NextResponse.json({
        success: true,
        message: 'No maintenance tasks due. No email sent.',
      });
    }

    if (!process.env.RESEND_API_KEY) {
      console.log('[MAINTENANCE CRON] RESEND_API_KEY not configured. Skipping email.');
      return NextResponse.json({
        success: false,
        message: 'Email not configured',
      });
    }

    const monthName = new Date(nextMonthYear, normalizedMonth - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const formatDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('T')[0].split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    let overdueHtml = '';
    if (overdueTasks.length > 0) {
      overdueHtml = `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #991b1b; margin-top: 0;">⚠️ Overdue Tasks (${overdueTasks.length})</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #fecaca;">
              <th style="text-align: left; padding: 8px; color: #991b1b;">Task</th>
              <th style="text-align: left; padding: 8px; color: #991b1b;">Was Due</th>
              <th style="text-align: left; padding: 8px; color: #991b1b;">Last Serviced</th>
            </tr>
            ${overdueTasks.map(t => `
              <tr style="border-bottom: 1px solid #fecaca;">
                <td style="padding: 8px; font-weight: bold;">${t.name}</td>
                <td style="padding: 8px; color: #dc2626;">${t.next_due ? formatDate(t.next_due) : 'Never'}</td>
                <td style="padding: 8px;">${t.last_serviced ? formatDate(t.last_serviced) : 'Never'}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }

    let upcomingHtml = '';
    if (tasksDueNextMonth.length > 0) {
      upcomingHtml = `
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin-top: 0;">📅 Due in ${monthName} (${tasksDueNextMonth.length})</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #bfdbfe;">
              <th style="text-align: left; padding: 8px; color: #1e40af;">Task</th>
              <th style="text-align: left; padding: 8px; color: #1e40af;">Due Date</th>
              <th style="text-align: left; padding: 8px; color: #1e40af;">Frequency</th>
            </tr>
            ${tasksDueNextMonth.map(t => `
              <tr style="border-bottom: 1px solid #bfdbfe;">
                <td style="padding: 8px; font-weight: bold;">${t.name}</td>
                <td style="padding: 8px;">${t.next_due ? formatDate(t.next_due) : 'TBD'}</td>
                <td style="padding: 8px;">Every ${t.frequency_months} month${t.frequency_months > 1 ? 's' : ''}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #4f46e5; margin-bottom: 5px;">🔧 Maintenance Reminder</h1>
          <p style="color: #6b7280; margin-top: 0;">Spellbound Haven Property Maintenance</p>
          
          ${overdueHtml}
          ${upcomingHtml}
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <a href="https://www.spellboundhaven.com/admin" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Admin Dashboard</a>
          </div>
          
          <div style="margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>This is an automated monthly maintenance reminder.</p>
          </div>
        </div>
      </div>
    `;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Maintenance Reminder <noreply@spellboundhaven.com>',
      to: hostEmail,
      subject: `🔧 Maintenance Reminder — ${overdueTasks.length > 0 ? `${overdueTasks.length} overdue, ` : ''}${tasksDueNextMonth.length} due in ${monthName}`,
      html: emailHtml,
    });

    console.log(`[MAINTENANCE CRON] Reminder sent: ${overdueTasks.length} overdue, ${tasksDueNextMonth.length} due next month`);

    return NextResponse.json({
      success: true,
      message: `Reminder sent: ${overdueTasks.length} overdue, ${tasksDueNextMonth.length} due in ${monthName}`,
      overdue: overdueTasks.length,
      upcoming: tasksDueNextMonth.length,
    });
  } catch (error) {
    console.error('[MAINTENANCE CRON] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send maintenance reminder', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
