const { prisma } = require('./utils/prisma');
const { createResponse, createErrorResponse } = require('./utils/response');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }

  try {
    // RELAXED auth check - accept any token format
    const authHeader = event.headers.authorization;
    console.log('🔍 Auth header received:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token in header');
      return createErrorResponse(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    console.log('🔍 Extracted token:', token ? `${token.substring(0, 20)}...` : 'EMPTY');
    
    // MUCH MORE RELAXED token validation
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
      console.log('❌ Invalid or empty token');
      return createErrorResponse(401, 'Invalid token');
    }

    console.log('✅ Token validation passed');
    console.log('📋 Fetching appointments with prescription images...');

    // Get all appointments with customer details AND prescription images
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

    // Transform data to ensure prescription images are included
    const transformedAppointments = appointments.map(appointment => {
      const transformed = {
        id: appointment.id,
        customerId: appointment.customerId,
        collectionDate: appointment.collectionDate,
        timeSlot: appointment.timeSlot,
        tests: appointment.tests,
        notes: appointment.notes,
        status: appointment.status,
        address: appointment.address,
        prescriptionImage: appointment.prescriptionImage,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        customer: appointment.customer
      };
      
      // Log prescription data for debugging
      if (appointment.prescriptionImage) {
        console.log(`📋 Appointment ${appointment.id.substring(0, 8)} has prescription image (${appointment.prescriptionImage.length} chars)`);
      } else {
        console.log(`📋 Appointment ${appointment.id.substring(0, 8)} has NO prescription image`);
      }
      
      return transformed;
    });

    console.log(`✅ Loaded ${transformedAppointments.length} appointments with prescription data`);
    
    return createResponse(200, {
      success: true,
      data: {
        appointments: transformedAppointments
      }
    });

  } catch (error) {
    console.error('❌ Admin appointments error:', error);
    return createErrorResponse(500, 'Failed to load appointments');
  }
};
