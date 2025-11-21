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

    const pendingMeals = await prisma.mealRecord.findMany({
      where: {
        status: MealStatus.PENDING,
      },
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
        requestedAt: 'asc',
      },
    })

    return NextResponse.json(pendingMeals)
  } catch (error) {
    console.error('Error fetching pending meals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

