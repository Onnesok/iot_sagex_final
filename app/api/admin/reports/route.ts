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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily' // 'daily' or 'monthly'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    let startDate: Date
    let endDate: Date

    if (type === 'daily') {
      startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
    } else {
      // monthly
      const [year, month] = date.split('-').map(Number)
      startDate = new Date(year, month - 1, 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(year, month, 1)
    }

    const [
      totalMeals,
      approvedMeals,
      deniedMeals,
      pendingMeals,
      activeStudents,
      fraudAttempts,
    ] = await Promise.all([
      prisma.mealRecord.count({
        where: {
          requestedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
      prisma.mealRecord.count({
        where: {
          status: MealStatus.COMPLETED,
          requestedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
      prisma.mealRecord.count({
        where: {
          status: MealStatus.DENIED,
          requestedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
      prisma.mealRecord.count({
        where: {
          status: MealStatus.PENDING,
          requestedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
      prisma.student.count({
        where: {
          enrollments: {
            some: {
              isActive: true,
            },
          },
        },
      }),
      prisma.mealRecord.count({
        where: {
          status: MealStatus.DENIED,
          requestedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
    ])

    return NextResponse.json({
      type,
      date,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      stats: {
        totalMeals,
        approvedMeals,
        deniedMeals,
        pendingMeals,
        activeStudents,
        fraudAttempts,
      },
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

