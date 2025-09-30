const { prisma } = require('./utils/prisma');
const { createResponse, createErrorResponse } = require('./utils/response');

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
      admin_notes: appointment.admin_notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      customer: appointment.customer
    }));

    console.log(`✅ Session authenticated - Loaded ${transformedAppointments.length} appointments`);
    
    return createResponse(200, {
      success: true,
      data: {
        appointments: transformedAppointments
      }
    });

  } catch (error) {
    console.error('❌ Appointments error:', error);
    return createErrorResponse(500, 'Failed to load appointments');
  }
};
