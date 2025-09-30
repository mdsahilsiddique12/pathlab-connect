const { prisma } = require('./utils/prisma');
const { createResponse, createErrorResponse } = require('./utils/response');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method not allowed');
  }


    const requestBody = JSON.parse(event.body);
    const { appointmentId, status, notes } = requestBody;

    console.log('📝 Status update request:', {
       appointmentId: appointmentId?.substring(0, 8),
       status,
       notes
    });

    if (!appointmentId || !status) {
      return createErrorResponse(400, 'appointmentId and status are required');
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        status: status,
        admin_notes: notes || '',
        updatedAt: new Date()
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

    console.log(`✅ Session authenticated - Updated appointment ${appointmentId.substring(0, 8)} to ${status}`);

    return createResponse(200, {
      success: true,
      message: 'Status updated successfully',
      data: {
        appointment: updatedAppointment
      }
    });

  } catch (error) {
    console.error('❌ Update status error:', error);
    return createErrorResponse(500, 'Failed to update status');
  }
};
