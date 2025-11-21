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
    if (!decoded || decoded.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [pending, approved, denied] = await Promise.all([
      prisma.mealRecord.count({
        where: {
          status: MealStatus.PENDING,
        },
      }),
      prisma.mealRecord.count({
        where: {
          status: MealStatus.APPROVED,
          approvedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.mealRecord.count({
        where: {
          status: MealStatus.DENIED,
          approvedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ])

    return NextResponse.json({
      pending,
      todayApproved: approved,
      todayDenied: denied,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

