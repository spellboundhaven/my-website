import { NextRequest, NextResponse } from 'next/server';
import { getAllMaintenanceTasks, initDatabase } from '@/lib/db';
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

    if (!process.env.RESEND_API_KEY) {
      console.log('[MAINTENANCE CRON] RESEND_API_KEY not configured. Skipping.');
      return NextResponse.json({ success: false, message: 'Email not configured' });
    }

    const allTasks = await getAllMaintenanceTasks();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const formatDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('T')[0].split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Find tasks with alerts enabled that are due within their alert window
    const tasksToAlert = allTasks.filter(t => {
      if (!t.alert_enabled || !t.next_due) return false;
      const dueDate = new Date(t.next_due.split('T')[0] + 'T00:00:00');
      const alertDate = new Date(dueDate);
      alertDate.setDate(alertDate.getDate() - (t.alert_days_before ?? 14));
      const alertStr = alertDate.toISOString().split('T')[0];
      return alertStr === todayStr;
    });

    // Also find overdue tasks with alerts enabled
    const overdueTasks = allTasks.filter(t => {
      if (!t.alert_enabled || !t.next_due) return false;
      return t.next_due.split('T')[0] < todayStr;
    });

    if (tasksToAlert.length === 0 && overdueTasks.length === 0) {
      console.log('[MAINTENANCE CRON] No alerts to send today.');
      return NextResponse.json({ success: true, message: 'No alerts needed today.' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    let sentCount = 0;

    // Send individual alert for each task hitting its alert window today
    for (const task of tasksToAlert) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #4f46e5; margin-bottom: 5px;">🔧 Maintenance Alert</h1>
            <p style="color: #6b7280; margin-top: 0;">Spellbound Haven Property Maintenance</p>

            <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #92400e; margin-top: 0; margin-bottom: 12px;">${task.name}</h2>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 4px 0; color: #78716c; width: 120px;">Due Date</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #92400e;">${task.next_due ? formatDate(task.next_due) : 'Not set'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #78716c;">Days Until Due</td>
                  <td style="padding: 4px 0; font-weight: bold;">${task.alert_days_before ?? 14} days</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #78716c;">Frequency</td>
                  <td style="padding: 4px 0;">Every ${task.frequency_months} month${task.frequency_months > 1 ? 's' : ''}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #78716c;">Last Serviced</td>
                  <td style="padding: 4px 0;">${task.last_serviced ? formatDate(task.last_serviced) : 'Never'}</td>
                </tr>
                ${task.notes ? `<tr><td style="padding: 4px 0; color: #78716c;">Notes</td><td style="padding: 4px 0;">${task.notes}</td></tr>` : ''}
              </table>
            </div>

            <div style="text-align: center;">
              <a href="https://www.spellboundhaven.com/admin" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Admin Dashboard</a>
            </div>

            <div style="margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p>This alert was triggered ${task.alert_days_before ?? 14} days before the due date.</p>
            </div>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'Maintenance Alert <noreply@spellboundhaven.com>',
        to: hostEmail,
        subject: `🔧 Maintenance Alert — ${task.name} due ${task.next_due ? formatDate(task.next_due) : 'soon'}`,
        html: emailHtml,
      });
      sentCount++;
      console.log(`[MAINTENANCE CRON] Alert sent for: ${task.name}`);
    }

    // Send a single consolidated overdue reminder if any
    if (overdueTasks.length > 0) {
      const overdueDate = today.getDate();
      // Only send overdue reminder once a week (every Monday)
      if (today.getDay() === 1 || overdueDate === 1) {
        const overdueHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #dc2626; margin-bottom: 5px;">⚠️ Overdue Maintenance</h1>
              <p style="color: #6b7280; margin-top: 0;">The following tasks are past due.</p>

              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr style="background-color: #fef2f2; border-bottom: 2px solid #fecaca;">
                  <th style="text-align: left; padding: 10px 8px; color: #991b1b;">Task</th>
                  <th style="text-align: left; padding: 10px 8px; color: #991b1b;">Was Due</th>
                  <th style="text-align: left; padding: 10px 8px; color: #991b1b;">Last Serviced</th>
                </tr>
                ${overdueTasks.map(t => `
                  <tr style="border-bottom: 1px solid #fecaca;">
                    <td style="padding: 10px 8px; font-weight: bold;">${t.name}</td>
                    <td style="padding: 10px 8px; color: #dc2626;">${t.next_due ? formatDate(t.next_due) : 'Never'}</td>
                    <td style="padding: 10px 8px;">${t.last_serviced ? formatDate(t.last_serviced) : 'Never'}</td>
                  </tr>
                `).join('')}
              </table>

              <div style="margin-top: 20px; text-align: center;">
                <a href="https://www.spellboundhaven.com/admin" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Admin Dashboard</a>
              </div>

              <div style="margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                <p>Overdue reminders are sent weekly on Mondays and the 1st of each month.</p>
              </div>
            </div>
          </div>
        `;

        await resend.emails.send({
          from: 'Maintenance Alert <noreply@spellboundhaven.com>',
          to: hostEmail,
          subject: `⚠️ ${overdueTasks.length} Overdue Maintenance Task${overdueTasks.length > 1 ? 's' : ''} — Action Needed`,
          html: overdueHtml,
        });
        sentCount++;
        console.log(`[MAINTENANCE CRON] Overdue reminder sent for ${overdueTasks.length} task(s)`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} alert(s)`,
      alerts: tasksToAlert.length,
      overdue: overdueTasks.length,
    });
  } catch (error) {
    console.error('[MAINTENANCE CRON] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send maintenance alerts', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
