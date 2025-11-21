import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TokenStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [activeTokens, activeEnrollments, todayMeals] = await Promise.all([
      prisma.token.count({
        where: {
          userId: decoded.id,
          status: TokenStatus.ACTIVE,
        },
      }),
      prisma.enrollment.count({
        where: {
          userId: decoded.id,
          isActive: true,
          mealsRemaining: {
            gt: 0,
          },
        },
      }),
      prisma.mealRecord.count({
        where: {
          userId: decoded.id,
          status: 'COMPLETED',
          completedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ])

    return NextResponse.json({
      activeTokens,
      activeEnrollments,
      todayMeals,
    })
  } catch (error) {
    console.error('Error fetching student stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

