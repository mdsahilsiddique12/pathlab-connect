const { prisma } = require('./utils/prisma');
const { createResponse, createErrorResponse } = require('./utils/response');

// Import messaging function with correct path to utils folder
const { sendNotifications } = require('./utils/messaging');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, null);
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method not allowed');
  }

  try {
    const appointmentData = JSON.parse(event.body);
    console.log('Received appointment data:', appointmentData);

    // 📋 Enhanced prescription image logging
    console.log('📋 Prescription image received:', {
        hasImage: !!appointmentData.prescriptionImage,
        imageSize: appointmentData.prescriptionImage ? appointmentData.prescriptionImage.length : 0,
        imageType: appointmentData.prescriptionImage ? appointmentData.prescriptionImage.substring(0, 30) + '...' : 'none'
    });

    // Map field names correctly from frontend to database
    const customerName = appointmentData.fullName || appointmentData.customerName;
    const customerPhone = appointmentData.phoneNumber || appointmentData.customerPhone;
    const customerEmail = appointmentData.emailAddress || appointmentData.customerEmail;

    console.log('📝 Mapped customer data:', {
        name: customerName,
        phone: customerPhone ? customerPhone.substring(0, 6) + '...' : 'none',
        email: customerEmail ? customerEmail.substring(0, 5) + '...' : 'none'
    });

    // Validate required fields
    if (!customerName) {
      console.log('❌ Validation failed: Customer name is missing');
      return createErrorResponse(400, 'Customer name is required');
    }

    console.log('✅ Form validation passed');

    // Create customer with mapped field names
    const customer = await prisma.customer.create({
      data: {
        fullName: customerName,     // Use mapped value
        phone: customerPhone,       // Use mapped value  
        email: customerEmail        // Use mapped value
      }
    });

    console.log('✅ Customer created in database:', {
        id: customer.id.substring(0, 8) + '...',
        name: customer.fullName
    });

    // Create appointment with prescription image support
    const appointment = await prisma.appointment.create({
      data: {
        customerId: customer.id,
        collectionDate: new Date(appointmentData.collectionDate),
        timeSlot: appointmentData.timeSlot || null,
        tests: Array.isArray(appointmentData.tests) ? appointmentData.tests.join(', ') : (appointmentData.tests || 'General Checkup'),
        notes: appointmentData.notes || '',
        status: 'PENDING',
        address: appointmentData.address || '',
        prescriptionImage: appointmentData.prescriptionImage || null // 🖼️ Save prescription image
      },
      include: {
        customer: true
      }
    });

    console.log('✅ Appointment created in database:', {
        id: appointment.id.substring(0, 8) + '...',
        customerId: appointment.customerId.substring(0, 8) + '...',
        tests: appointment.tests,
        status: appointment.status,
        hasPrescription: !!appointment.prescriptionImage
    });

    // Additional prescription logging after database save
    if (appointmentData.prescriptionImage) {
      console.log('📋 Prescription image details:');
      console.log('  - Original size:', appointmentData.prescriptionImage.length, 'characters');
      console.log('  - Saved to database:', !!appointment.prescriptionImage);
      console.log('  - Database size:', appointment.prescriptionImage ? appointment.prescriptionImage.length : 0, 'characters');
      console.log('  - Image preview:', appointmentData.prescriptionImage.substring(0, 50) + '...');
    } else {
      console.log('📋 No prescription image provided');
    }

    console.log('🎉 Booking process completed successfully - sending immediate response');
    
    // 🚀 RESPOND IMMEDIATELY TO PREVENT TIMEOUT
    const successResponse = createResponse(201, {
      success: true,
      message: 'Appointment created successfully',
      appointment: appointment,
      bookingId: appointment.id,
      data: {
        bookingId: appointment.id,
        customerName: appointment.customer.fullName,
        tests: appointment.tests,
        collectionDate: appointment.collectionDate,
        status: appointment.status,
        hasPrescription: !!appointment.prescriptionImage
      }
    });

    // 📧 Send notifications AFTER response (async, non-blocking)
    setImmediate(async () => {
      console.log('📱 Starting background notification service...');
      try {
        const notificationResults = await sendNotifications(appointmentData, appointment.id);
        console.log('📊 Background notification results:', notificationResults);
      } catch (msgError) {
        console.error('⚠️ Background messaging service error:', msgError.message);
      }
    });

    return successResponse;

  } catch (error) {
    console.error('❌ Appointment creation error:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    return createErrorResponse(500, `Failed to create appointment: ${error.message}`);
  }
};
