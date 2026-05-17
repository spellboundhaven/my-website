import { NextRequest, NextResponse } from 'next/server';
import {
  getAllMaintenanceTasks,
  createMaintenanceTask,
  updateMaintenanceTask,
  deleteMaintenanceTask,
  markMaintenanceComplete,
  getMaintenanceLogsForTask,
  initDatabase,
  MaintenanceTask,
} from '@/lib/db';
import { Resend } from 'resend';

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
  return authHeader === `Bearer ${adminPassword}`;
}

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('logs_for_task');

    if (taskId) {
      const logs = await getMaintenanceLogsForTask(parseInt(taskId));
      return NextResponse.json({ success: true, logs });
    }

    const tasks = await getAllMaintenanceTasks();
    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDatabase();
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { name, frequency_months, last_serviced, notes, alert_enabled, alert_days_before } = body;
      if (!name || !frequency_months) {
        return NextResponse.json({ error: 'Name and frequency are required' }, { status: 400 });
      }
      const task = await createMaintenanceTask({
        name,
        frequency_months: parseInt(frequency_months),
        last_serviced: last_serviced || null,
        notes,
        alert_enabled: alert_enabled ?? false,
        alert_days_before: alert_days_before ? parseInt(alert_days_before) : 14,
      });
      return NextResponse.json({ success: true, task });
    }

    if (action === 'update') {
      const { id, action: _a, ...updates } = body;
      if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
      if (updates.frequency_months) updates.frequency_months = parseInt(updates.frequency_months);
      if (updates.alert_days_before !== undefined) updates.alert_days_before = parseInt(updates.alert_days_before);
      const task = await updateMaintenanceTask(id, updates);
      return NextResponse.json({ success: true, task });
    }

    if (action === 'test-alert') {
      const { task_id } = body;
      if (!task_id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 });

      const tasks = await getAllMaintenanceTasks();
      const taskIdNum = Number(task_id);
      const task = tasks.find((t: MaintenanceTask) => Number(t.id) === taskIdNum);
      if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
      }

      const hostEmail = process.env.HOST_EMAIL || 'spellboundhaven.disney@gmail.com';
      const formatDate = (d: string) => {
        const parts = d.split('T')[0].split('-');
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
          .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      };

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
              <p>⚠️ THIS IS A TEST ALERT — Alert set to ${task.alert_days_before ?? 14} days before due date.</p>
            </div>
          </div>
        </div>
      `;

      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Maintenance Alert <noreply@spellboundhaven.com>',
        to: hostEmail,
        subject: `🔧 [TEST] Maintenance Alert — ${task.name} due ${task.next_due ? formatDate(task.next_due) : 'soon'}`,
        html: emailHtml,
      });

      return NextResponse.json({ success: true, message: `Test alert sent to ${hostEmail}` });
    }

    if (action === 'complete') {
      const { task_id, serviced_date, notes } = body;
      if (!task_id || !serviced_date) {
        return NextResponse.json({ error: 'Task ID and serviced date are required' }, { status: 400 });
      }
      const task = await markMaintenanceComplete(task_id, serviced_date, notes);
      return NextResponse.json({ success: true, task });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
      const success = await deleteMaintenanceTask(id);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing maintenance action:', error);
    return NextResponse.json({ error: 'Failed to process request', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
