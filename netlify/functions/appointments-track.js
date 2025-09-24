const { prisma } = require('./utils/prisma');
const { createResponse, createErrorResponse } = require('./utils/response');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, null);
  }

  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method not allowed');
  }

  try {
    const appointmentId = event.path.split('/').pop();
    
    if (!appointmentId) {
      return createErrorResponse(400, 'Appointment ID required');
    }

    // Try to find by full ID first, then by partial booking ID
    let appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        technician: true
      }
    });

    // If not found, try to search by partial booking ID
    if (!appointment) {
      const appointments = await prisma.appointment.findMany({
        where: {
          id: {
            startsWith: appointmentId.toLowerCase()
          }
        },
        include: {
          customer: true,
          technician: true
        },
        take: 1
      });
      appointment = appointments[0];
    }

    if (!appointment) {
      return createErrorResponse(404, 'Appointment not found');
    }

    // Convert tests string back to array for response
    const testsArray = appointment.tests ? appointment.tests.split(',') : [];

    return createResponse(200, {
      id: appointment.id,
      bookingId: appointment.id.substring(0, 8).toUpperCase(),
      customerName: appointment.customer.fullName,
      collectionDate: appointment.collectionDate,
      timeSlot: appointment.timeSlot,
      tests: testsArray,  // Return as array for frontend
      status: appointment.status,
      technician: appointment.technician ? {
        name: appointment.technician.name,
        phone: appointment.technician.phone
      } : null,
      address: appointment.address,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    });

  } catch (error) {
    console.error('Error tracking appointment:', error);
    return createErrorResponse(500, 'Failed to track appointment');
  }
};
