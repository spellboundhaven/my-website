import { NextRequest, NextResponse } from 'next/server';
import { saveRentalTemplate, loadRentalTemplate, getAllRentalTemplates, deleteRentalTemplate, initDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const template = await loadRentalTemplate(id);
      return NextResponse.json({ template });
    }

    const templates = await getAllRentalTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching rental templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    const body = await request.json();
    const { action, name, content, id } = body;

    if (action === 'delete') {
      if (!id) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        );
      }

      const success = await deleteRentalTemplate(id);
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Template deleted successfully',
        });
      } else {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
    }

    // Default action: save template
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Template name and content are required' },
        { status: 400 }
      );
    }

    const template = await saveRentalTemplate(name, content);
    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Error saving/deleting rental template:', error);
    return NextResponse.json(
      { error: 'Failed to process rental template' },
      { status: 500 }
    );
  }
}

