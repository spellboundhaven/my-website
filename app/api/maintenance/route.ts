import { NextRequest, NextResponse } from 'next/server';
import {
  getAllMaintenanceTasks,
  createMaintenanceTask,
  updateMaintenanceTask,
  deleteMaintenanceTask,
  markMaintenanceComplete,
  getMaintenanceLogsForTask,
  initDatabase,
} from '@/lib/db';

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
      const { name, frequency_months, last_serviced, notes } = body;
      if (!name || !frequency_months) {
        return NextResponse.json({ error: 'Name and frequency are required' }, { status: 400 });
      }
      const task = await createMaintenanceTask({
        name,
        frequency_months: parseInt(frequency_months),
        last_serviced: last_serviced || null,
        notes,
      });
      return NextResponse.json({ success: true, task });
    }

    if (action === 'update') {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
      if (updates.frequency_months) updates.frequency_months = parseInt(updates.frequency_months);
      const task = await updateMaintenanceTask(id, updates);
      return NextResponse.json({ success: true, task });
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
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
