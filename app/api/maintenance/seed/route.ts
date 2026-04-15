import { NextRequest, NextResponse } from 'next/server';
import { createMaintenanceTask, getAllMaintenanceTasks, initDatabase } from '@/lib/db';

const DEFAULT_TASKS = [
  { name: 'HVAC Maintenance', frequency_months: 6 },
  { name: 'Pool Filter Change', frequency_months: 4 },
  { name: 'Fridge Filter Change', frequency_months: 6 },
  { name: 'AC Filter Change', frequency_months: 1 },
  { name: 'Power Wash', frequency_months: 6 },
  { name: 'Deep Clean', frequency_months: 6 },
  { name: 'Grout Line Clean', frequency_months: 12 },
];

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
  if (authHeader !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDatabase();

    const existing = await getAllMaintenanceTasks();
    const existingNames = new Set(existing.map(t => t.name.toLowerCase()));

    let created = 0;
    for (const task of DEFAULT_TASKS) {
      if (!existingNames.has(task.name.toLowerCase())) {
        await createMaintenanceTask({
          name: task.name,
          frequency_months: task.frequency_months,
          last_serviced: null,
          next_due: null,
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} default tasks (${DEFAULT_TASKS.length - created} already existed)`,
      created,
    });
  } catch (error) {
    console.error('Error seeding maintenance tasks:', error);
    return NextResponse.json({ error: 'Failed to seed tasks' }, { status: 500 });
  }
}
