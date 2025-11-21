import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MealStatus } from '@prisma/client'
import { z } from 'zod'

const requestSchema = z.object({
  verificationMethod: z.enum(['FACE', 'ID_CARD', 'PIN', 'MANUAL']),
  faceId: z.string().optional(),
  idCardNumber: z.string().optional(),
  pin: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { verificationMethod, faceId, idCardNumber, pin } = requestSchema.parse(body)

    // Check if user already ate today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayMeal = await prisma.mealRecord.findFirst({
      where: {
        userId: decoded.id,
        status: {
          in: [MealStatus.APPROVED, MealStatus.COMPLETED],
        },
        completedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (todayMeal) {
      return NextResponse.json(
        { error: 'You have already received a meal today' },
        { status: 400 }
      )
    }

    // Find active token or enrollment
    const user = await prisma.student.findUnique({
      where: { id: decoded.id },
      include: {
        tokens: {
          where: {
            status: 'ACTIVE',
          },
          take: 1,
        },
        enrollments: {
          where: {
            isActive: true,
            mealsRemaining: {
              gt: 0,
            },
          },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.tokens.length === 0 && user.enrollments.length === 0) {
      return NextResponse.json(
        { error: 'No active tokens or meal plans found' },
        { status: 400 }
      )
    }

    // Create meal record
    const mealRecord = await prisma.mealRecord.create({
      data: {
        userId: decoded.id,
        tokenId: user.tokens[0]?.id,
        enrollmentId: user.enrollments[0]?.id,
        status: MealStatus.PENDING,
        verificationMethod,
      },
    })

    return NextResponse.json({ success: true, mealRecord })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error requesting meal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

