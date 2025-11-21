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
    const filter = searchParams.get('filter') || 'ALL'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (filter !== 'ALL') {
      where.status = filter as MealStatus
    }

    const [meals, total] = await Promise.all([
      prisma.mealRecord.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              studentId: true,
            },
          },
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
        orderBy: {
          requestedAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.mealRecord.count({ where }),
    ])

    return NextResponse.json({
      meals,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching admin meals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

