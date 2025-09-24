const { prisma } = require('./utils/prisma');
const { createResponse, createErrorResponse } = require('./utils/response');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method not allowed');
  }

  try {
    // Simple auth check (no JWT verification)
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    
    // Simple token validation
    if (!token || token.length < 10) {
      return createErrorResponse(401, 'Invalid token');
    }

    const requestBody = JSON.parse(event.body);
    const { appointmentId, status, notes } = requestBody;

    console.log('📝 Status update request:', { appointmentId, status, notes });

    if (!appointmentId || !status) {
      return createErrorResponse(400, 'Appointment ID and status required');
    }

    // Valid status values
    const validStatuses = ['PENDING', 'Received', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return createErrorResponse(400, 'Invalid status value');
    }

    // Update appointment status in database
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: status,
        notes: notes || '',
        updatedAt: new Date() // Force update timestamp
      },
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
            email: true
          }
        }
      }
    });

    console.log('✅ Status updated successfully in database:', {
      id: updatedAppointment.id,
      newStatus: updatedAppointment.status,
      customer: updatedAppointment.customer.fullName
    });

    // Send notification to customer about status change (optional)
    if (updatedAppointment.customer) {
      console.log(`📱 Status change notification: ${updatedAppointment.customer.fullName} - ${status}`);
      
      // You can add WhatsApp/Email notification logic here if needed
      // await sendStatusUpdateNotification(updatedAppointment);
    }

    return createResponse(200, {
      success: true,
      message: 'Status updated successfully',
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        notes: updatedAppointment.notes,
        updatedAt: updatedAppointment.updatedAt,
        customer: updatedAppointment.customer
      }
    });

  } catch (error) {
    console.error('❌ Status update error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return createErrorResponse(404, 'Appointment not found');
    }
    
    if (error.code === 'P2002') {
      return createErrorResponse(409, 'Appointment conflict');
    }
    
    return createErrorResponse(500, `Failed to update status: ${error.message}`);
  }
};
