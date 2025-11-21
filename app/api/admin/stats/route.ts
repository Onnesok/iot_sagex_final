import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MealStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [totalStudents, totalManagers, totalAdmins, totalTokens, todayMeals, pendingApprovals, activeManagers, activeMealPlans, fraudAlerts] = await Promise.all([
      prisma.student.count(),
      prisma.manager.count(),
      prisma.admin.count(),
      prisma.token.count({
        where: {
          status: 'ACTIVE',
        },
      }),
      prisma.mealRecord.count({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.mealRecord.count({
        where: {
          status: MealStatus.PENDING,
        },
      }),
      prisma.manager.count(), // Active managers (all managers are considered active)
      prisma.mealPlan.count({
        where: {
          isActive: true,
        },
      }),
      prisma.mealRecord.count({
        where: {
          status: MealStatus.DENIED,
          requestedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ])

    const totalUsers = totalStudents + totalManagers + totalAdmins

    return NextResponse.json({
      totalUsers,
      totalStudents,
      totalManagers,
      totalAdmins,
      totalTokens,
      todayMeals,
      pendingApprovals,
      activeManagers,
      activeMealPlans,
      fraudAlerts,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

