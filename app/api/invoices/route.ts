import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  createInvoice,
  getAllInvoices,
  updateInvoice,
  deleteInvoice,
  generateInvoiceNumber,
  type Invoice
} from '@/lib/db';

export const dynamic = 'force-dynamic';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
  
  if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
    return false;
  }
  
  return true;
}

// Generate invoice HTML template
function generateInvoiceHTML(invoice: Invoice): string {
  const checkInDate = new Date(invoice.check_in_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const checkOutDate = new Date(invoice.check_out_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  const nights = Math.ceil(
    (new Date(invoice.check_out_date).getTime() - new Date(invoice.check_in_date).getTime()) / 
    (1000 * 60 * 60 * 24)
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #6B46C1;
        }
        .header h1 {
          color: #6B46C1;
          margin: 0;
          font-size: 32px;
        }
        .header p {
          color: #666;
          margin: 5px 0;
        }
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .section {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
        }
        .section h3 {
          margin: 0 0 10px 0;
          color: #6B46C1;
          font-size: 14px;
          text-transform: uppercase;
        }
        .section p {
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background: #6B46C1;
          color: white;
          padding: 12px;
          text-align: left;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #ddd;
        }
        .text-right {
          text-align: right;
        }
        .total-row {
          background: #f9f9f9;
          font-weight: bold;
          font-size: 18px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #ddd;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .notes {
          background: #fff9e6;
          padding: 15px;
          border-left: 4px solid #ffc107;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏰 Spellbound Haven</h1>
        <p>Windsor Island Resort, Orlando, FL</p>
        <p>Email: spellboundhaven.disney@gmail.com</p>
      </div>

      <div class="invoice-details">
        <div class="section">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Date:</strong> ${new Date(invoice.created_at || '').toLocaleDateString()}</p>
          <p><strong>Payment Method:</strong> ${invoice.payment_method}</p>
          <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
        </div>

        <div class="section">
          <h3>Guest Information</h3>
          <p><strong>Name:</strong> ${invoice.guest_name}</p>
          <p><strong>Email:</strong> ${invoice.guest_email}</p>
        </div>
      </div>

      <div class="section">
        <h3>Reservation Details</h3>
        <p><strong>Check-in:</strong> ${checkInDate}</p>
        <p><strong>Check-out:</strong> ${checkOutDate}</p>
        <p><strong>Number of Nights:</strong> ${nights}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Accommodation (${nights} nights)</td>
            <td class="text-right">$${Number(invoice.accommodation_cost).toFixed(2)}</td>
          </tr>
          ${invoice.cleaning_fee > 0 ? `
          <tr>
            <td>Cleaning Fee</td>
            <td class="text-right">$${Number(invoice.cleaning_fee).toFixed(2)}</td>
          </tr>
          ` : ''}
          ${invoice.tax_amount > 0 ? `
          <tr>
            <td>Tax</td>
            <td class="text-right">$${Number(invoice.tax_amount).toFixed(2)}</td>
          </tr>
          ` : ''}
          ${invoice.additional_fees > 0 ? `
          <tr>
            <td>${invoice.additional_fees_description || 'Additional Fees'}</td>
            <td class="text-right">$${Number(invoice.additional_fees).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td>TOTAL AMOUNT DUE</td>
            <td class="text-right">$${Number(invoice.total_amount).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      ${invoice.notes ? `
      <div class="notes">
        <h3 style="margin-top: 0;">Notes</h3>
        <p>${invoice.notes}</p>
      </div>
      ` : ''}

      <div class="footer">
        <p>Thank you for choosing Spellbound Haven!</p>
        <p>We look forward to hosting your magical Disney vacation.</p>
        <p style="margin-top: 20px; font-size: 12px;">
          Windsor Island Resort | Orlando, FL<br>
          spellboundhaven.disney@gmail.com
        </p>
      </div>
    </body>
    </html>
  `;
}

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const invoices = await getAllInvoices();
    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action, data, id } = body;

    if (action === 'create') {
      try {
        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber();

        const newInvoice = await createInvoice({
          invoice_number: invoiceNumber,
          booking_id: data.booking_id || null,
          guest_name: data.guest_name,
          guest_email: data.guest_email,
          check_in_date: data.check_in_date,
          check_out_date: data.check_out_date,
          accommodation_cost: parseFloat(data.accommodation_cost),
          cleaning_fee: parseFloat(data.cleaning_fee || 0),
          tax_amount: parseFloat(data.tax_amount || 0),
          additional_fees: parseFloat(data.additional_fees || 0),
          additional_fees_description: data.additional_fees_description || null,
          total_amount: parseFloat(data.total_amount),
          payment_method: data.payment_method,
          status: 'draft',
          notes: data.notes || null
        });

        return NextResponse.json({
          success: true,
          invoice: newInvoice,
          message: 'Invoice created successfully'
        });
      } catch (createError) {
        console.error('Error creating invoice:', createError);
        return NextResponse.json(
          { 
            error: 'Failed to create invoice',
            details: createError instanceof Error ? createError.message : String(createError)
          },
          { status: 500 }
        );
      }
    }

    if (action === 'send') {
      if (!resend) {
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 500 }
        );
      }

      // Update invoice status to sent
      const invoice = await updateInvoice(id, {
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      // Generate invoice HTML
      const invoiceHTML = generateInvoiceHTML(invoice);

      // Send to host email
      await resend.emails.send({
        from: 'noreply@spellboundhaven.com',
        to: 'spellboundhaven.disney@gmail.com',
        subject: `Invoice ${invoice.invoice_number} - ${invoice.guest_name}`,
        html: invoiceHTML
      });

      // Optionally send to guest if requested
      if (data.send_to_guest) {
        await resend.emails.send({
          from: 'noreply@spellboundhaven.com',
          to: invoice.guest_email,
          subject: `Your Spellbound Haven Invoice - ${invoice.invoice_number}`,
          html: invoiceHTML
        });
      }

      return NextResponse.json({
        success: true,
        invoice,
        message: 'Invoice sent successfully'
      });
    }

    if (action === 'update') {
      const updatedInvoice = await updateInvoice(id, data);
      return NextResponse.json({
        success: true,
        invoice: updatedInvoice,
        message: 'Invoice updated successfully'
      });
    }

    if (action === 'delete') {
      await deleteInvoice(id);
      return NextResponse.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing invoice request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

