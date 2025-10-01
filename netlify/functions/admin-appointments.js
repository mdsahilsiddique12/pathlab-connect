const { prisma } = require('./utils/prisma');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  try {
    console.log('📋 Loading appointments...');
    const appointments = await prisma.appointment.findMany({
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const transformedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      customerId: appointment.customerId,
      collectionDate: appointment.collectionDate,
      timeSlot: appointment.timeSlot,
      tests: appointment.tests,
      notes: appointment.notes,
      status: appointment.status,
      address: appointment.address,
      prescriptionImage: appointment.prescriptionImage,
      admin_notes: appointment.notes, // Use existing notes field
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      customer: appointment.customer
    }));

    // Return direct object - server.js will wrap it
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        data: { appointments: transformedAppointments } 
      })
    };
  } catch (error) {
    console.error('❌ Appointments error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to load appointments' })
    };
  }
};
