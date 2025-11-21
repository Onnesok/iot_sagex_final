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

    // Get denied meals (fraud attempts) and suspicious patterns
    const deniedMeals = await prisma.mealRecord.findMany({
      where: {
        status: MealStatus.DENIED,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
      take: 100,
    })

    // Get potential double-serving attempts (same user, same day, multiple requests)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const allTodayMeals = await prisma.mealRecord.findMany({
      where: {
        requestedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true,
          },
        },
      },
    })

    // Group by user to find multiple requests
    const userMealCounts = new Map<string, any[]>()
    allTodayMeals.forEach((meal) => {
      const userId = meal.userId
      if (!userMealCounts.has(userId)) {
        userMealCounts.set(userId, [])
      }
      userMealCounts.get(userId)!.push(meal)
    })

    const doubleServingAlerts = Array.from(userMealCounts.entries())
      .filter(([_, meals]) => meals.length > 1)
      .map(([_, meals]) => ({
        type: 'DOUBLE_SERVING',
        studentId: meals[0].student.studentId || 'N/A',
        studentName: meals[0].student.name,
        description: `Multiple meal requests detected for the same day (${meals.length} requests)`,
        timestamp: meals[0].requestedAt.toISOString(),
        mealRecords: meals.map((m) => ({
          id: m.id,
          status: m.status,
          requestedAt: m.requestedAt,
        })),
      }))

    const alerts = [
      ...deniedMeals.map((meal) => ({
        id: meal.id,
        type: 'DENIED_MEAL' as const,
        studentId: meal.student.studentId || 'N/A',
        studentName: meal.student.name,
        description: meal.deniedReason || 'Meal request was denied',
        timestamp: meal.requestedAt.toISOString(),
        reviewed: false,
        status: 'PENDING',
        mealRecordId: meal.id,
      })),
      ...doubleServingAlerts.map((alert, index) => ({
        id: `double-${index}`,
        type: 'DOUBLE_SERVING' as const,
        studentId: alert.studentId,
        studentName: alert.studentName,
        description: alert.description,
        timestamp: alert.timestamp,
        reviewed: false,
        status: 'PENDING',
        mealRecords: alert.mealRecords,
      })),
    ]

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching fraud alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

