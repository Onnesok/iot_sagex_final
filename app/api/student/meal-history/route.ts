import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const [meals, total] = await Promise.all([
      prisma.mealRecord.findMany({
        where: {
          userId: decoded.id,
        },
        orderBy: {
          requestedAt: 'desc',
        },
        take: limit,
        skip: offset,
        include: {
          token: {
            select: {
              tokenNumber: true,
            },
          },
          enrollment: {
            include: {
              mealPlan: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.mealRecord.count({
        where: {
          userId: decoded.id,
        },
      }),
    ])

    return NextResponse.json({
      meals,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching meal history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

