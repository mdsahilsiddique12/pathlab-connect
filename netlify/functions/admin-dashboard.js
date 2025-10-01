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

  try {
    // Get dashboard statistics (authentication removed)
    const stats = await getDashboardStats();
    const recentAppointments = await getRecentAppointments();
    const todayAppointments = await getTodayAppointments();

    return createResponse(200, { stats, recentAppointments, todayAppointments });
  } catch (error) {
    console.error('Dashboard error:', error);
    return createErrorResponse(500, 'Failed to load dashboard data');
  }
};

async function getDashboardStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalAppointments,
    todayAppointments, 
    monthlyAppointments,
    pendingAppointments,
    completedAppointments,
    totalCustomers
  ] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({ where: { collectionDate: { gte: startOfDay, lte: endOfDay } } }),
    prisma.appointment.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.appointment.count({ where: { status: 'PENDING' } }),
    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
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
  return prisma.appointment.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { fullName: true, phone: true, email: true } }
    }
  });
}

async function getTodayAppointments() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return prisma.appointment.findMany({
    where: { collectionDate: { gte: startOfDay, lte: endOfDay } },
    orderBy: { collectionDate: 'asc' },
    include: {
      customer: { select: { fullName: true, phone: true, email: true } }
    }
  });
}
