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
    // Verify authentication
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    // Simple token validation (same as other admin endpoints)
    if (!token || token.length < 10) {
        return createErrorResponse(401, 'Invalid token');
    }

    
    // Get dashboard statistics
    const stats = await getDashboardStats();
    const recentAppointments = await getRecentAppointments();
    const todayAppointments = await getTodayAppointments();
    
    return createResponse(200, {
      stats,
      recentAppointments,
      todayAppointments,
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return createErrorResponse(500, 'Failed to load dashboard data');
  }
};

async function getDashboardStats() {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [
    totalAppointments,
    todayAppointments,
    monthlyAppointments,
    pendingAppointments,
    completedAppointments,
    totalCustomers
  ] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({
      where: {
        collectionDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    }),
    prisma.appointment.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    }),
    prisma.appointment.count({
      where: {
        status: 'PENDING'
      }
    }),
    prisma.appointment.count({
      where: {
        status: 'COMPLETED'
      }
    }),
    prisma.customer.count()
  ]);

  return {
    total: totalAppointments,
    today: todayAppointments,
    monthly: monthlyAppointments,
    pending: pendingAppointments,
    completed: completedAppointments,
    customers: totalCustomers
  };
}

async function getRecentAppointments() {
  return await prisma.appointment.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc'
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
}

async function getTodayAppointments() {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  return await prisma.appointment.findMany({
    where: {
      collectionDate: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
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
      collectionDate: 'asc'
    }
  });
}
