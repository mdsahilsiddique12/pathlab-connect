const { prisma } = require('./utils/prisma');
const { createResponse, createErrorResponse } = require('./utils/response');

exports.handler = async (event, _context) => {
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
        customer: { select: { fullName: true, phone: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformed = appointments.map(a => ({
      id:               a.id,
      customerId:       a.customerId,
      collectionDate:   a.collectionDate,
      timeSlot:         a.timeSlot,
      tests:            a.tests,
      notes:            a.notes,
      status:           a.status,
      address:          a.address,
      prescriptionImage:a.prescriptionImage,
      admin_notes:      a.admin_notes,
      createdAt:        a.createdAt,
      updatedAt:        a.updatedAt,
      customer:         a.customer
    }));

    return createResponse(200, { success: true, data: { appointments: transformed } });
  } catch (error) {
    console.error('❌ Appointments error:', error);
    return createErrorResponse(500, 'Failed to load appointments');
  }
};
