import { NextRequest, NextResponse } from 'next/server';
import { createRentalSubmission, getAllRentalSubmissions, getRentalSubmissionsByAgreement, deleteRentalSubmission, initDatabase, getRentalAgreement } from '@/lib/db';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    const body = await request.json();
    const {
      agreement_id,
      guest_name,
      guest_email,
      guest_phone,
      guest_address,
      num_adults,
      num_children,
      additional_adults,
      vehicles,
      security_deposit_authorized,
      electronic_signature_agreed,
      signature_data,
      check_in_date,
      check_out_date,
    } = body;

    if (!agreement_id || !guest_name || !guest_email || !guest_phone || !signature_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const submission = await createRentalSubmission({
      agreement_id,
      guest_name,
      guest_email,
      guest_phone,
      guest_address,
      num_adults: num_adults || 0,
      num_children: num_children || 0,
      additional_adults: additional_adults || [],
      vehicles: vehicles || [],
      security_deposit_authorized: security_deposit_authorized || false,
      electronic_signature_agreed: electronic_signature_agreed || false,
      signature_data,
      check_in_date,
      check_out_date,
    });

    // Send email notifications directly
    try {
      const agreement = await getRentalAgreement(agreement_id);
      console.log('Attempting to send emails for rental agreement:', agreement_id);
      console.log('Agreement found:', agreement ? 'yes' : 'no');
      console.log('Host email:', agreement?.host_email);
      
      if (agreement && agreement.host_email && process.env.RESEND_API_KEY) {
        console.log('Sending emails to:', agreement.host_email, 'and', guest_email);
        
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // Format vehicle information
        let vehicleInfo = 'None';
        if (vehicles && vehicles.length > 0) {
          vehicleInfo = vehicles
            .map(
              (v: any, idx: number) =>
                `<li><strong>Vehicle ${idx + 1}:</strong> ${v.make || 'N/A'} ${v.model || ''}, ${v.color || 'N/A'}, License: ${v.license_plate || 'N/A'}</li>`
            )
            .join('');
          vehicleInfo = `<ul>${vehicleInfo}</ul>`;
        }

        // Create HTML email content
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spellboundhaven.com';
        const viewUrl = `${baseUrl}/rental-submission/${submission.view_token}`;
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #4f46e5; margin-bottom: 20px;">Rental Agreement - Signed</h1>
              
              <div style="background-color: #eef2ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #312e81; margin-top: 0;">Property Information</h2>
                <p><strong>Property:</strong> ${agreement.property_name}</p>
                <p><strong>Address:</strong> ${agreement.property_address}</p>
                <p><strong>Check-in:</strong> ${check_in_date}</p>
                <p><strong>Check-out:</strong> ${check_out_date}</p>
              </div>
              
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #1f2937; margin-top: 0;">Guest Information</h2>
                <p><strong>Name:</strong> ${guest_name}</p>
                <p><strong>Email:</strong> ${guest_email}</p>
                <p><strong>Guests:</strong> ${num_adults || 0} Adult(s), ${num_children || 0} Child(ren)</p>
                <p><strong>Vehicles:</strong> ${vehicleInfo}</p>
              </div>
              
              ${agreement.rental_terms ? `
              <div style="background-color: #fffbeb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #92400e; margin-top: 0;">Rental Terms & Conditions</h2>
                <div style="font-size: 14px; color: #44403c;">
                  ${agreement.rental_terms}
                </div>
              </div>
              ` : ''}
              
              <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
                <h2 style="color: #166534; margin-top: 0;">View Signed Agreement</h2>
                <p style="color: #166534; margin-bottom: 20px;">Click the button below to view the complete signed agreement with the guest signature.</p>
                <a href="${viewUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Signed Agreement</a>
                <p style="font-size: 12px; color: #6b7280; margin-top: 15px;">
                  Or copy this link: <br/>
                  <a href="${viewUrl}" style="color: #4f46e5; word-break: break-all;">${viewUrl}</a>
                </p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </div>
        `;

        // Send email to host
        console.log('Sending email to host...');
        const hostEmailResponse = await resend.emails.send({
          from: 'Rental Agreement <noreply@spellboundhaven.com>',
          to: agreement.host_email,
          subject: `New Rental Agreement Signed - ${guest_name}`,
          html: emailHtml,
        });
        console.log('Host email sent:', hostEmailResponse);

        // Send email to guest
        console.log('Sending email to guest...');
        const guestEmailResponse = await resend.emails.send({
          from: 'Rental Agreement <noreply@spellboundhaven.com>',
          to: guest_email,
          subject: `Your Rental Agreement for ${agreement.property_name}`,
          html: emailHtml,
        });
        console.log('Guest email sent:', guestEmailResponse);
      } else {
        console.log('Skipping email send - no host email, agreement not found, or RESEND_API_KEY not configured');
      }
    } catch (emailError) {
      // Log error but don't fail the submission
      console.error('Error sending emails:', emailError);
    }

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error('Error creating rental submission:', error);
    return NextResponse.json(
      { error: 'Failed to submit rental agreement' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const agreementId = searchParams.get('agreement_id');

    if (agreementId) {
      const submissions = await getRentalSubmissionsByAgreement(agreementId);
      return NextResponse.json({ submissions });
    }

    const submissions = await getAllRentalSubmissions();
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching rental submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental submissions' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteRentalSubmission(parseInt(id));

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Rental submission deleted successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Rental submission not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting rental submission:', error);
    return NextResponse.json(
      { error: 'Failed to delete rental submission' },
      { status: 500 }
    );
  }
}

