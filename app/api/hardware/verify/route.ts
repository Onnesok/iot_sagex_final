import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MealStatus } from '@prisma/client'
import { z } from 'zod'

const verifySchema = z.object({
  method: z.enum(['FACE', 'ID_CARD', 'PIN']),
  faceId: z.string().optional(),
  idCardNumber: z.string().optional(),
  pin: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { method, faceId, idCardNumber, pin } = verifySchema.parse(body)

    let user = null

    // Find user based on verification method (only students can use these methods)
    if (method === 'FACE' && faceId) {
      user = await prisma.student.findUnique({
        where: { faceId },
      })
    } else if (method === 'ID_CARD' && idCardNumber) {
      user = await prisma.student.findUnique({
        where: { idCardNumber },
      })
    } else if (method === 'PIN' && pin) {
      user = await prisma.student.findFirst({
        where: { pin },
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', verified: false },
        { status: 404 }
      )
    }

    // Check if user already ate today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayMeal = await prisma.mealRecord.findFirst({
      where: {
        userId: user.id,
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
      return NextResponse.json({
        verified: true,
        user: {
          id: user.id,
          name: user.name,
          studentId: user.studentId,
          email: user.email,
        },
        eligible: false,
        reason: 'Already received meal today',
      })
    }

    // Check eligibility (active token or enrollment)
    const [activeToken, activeEnrollment] = await Promise.all([
      prisma.token.findFirst({
        where: {
          userId: user.id,
          status: 'ACTIVE',
        },
      }),
      prisma.enrollment.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          mealsRemaining: {
            gt: 0,
          },
        },
        include: {
          mealPlan: true,
        },
      }),
    ])

    const eligible = !!(activeToken || activeEnrollment)

    // Create pending meal record
    let mealRecord = null
    if (eligible) {
      mealRecord = await prisma.mealRecord.create({
        data: {
          userId: user.id,
          tokenId: activeToken?.id,
          enrollmentId: activeEnrollment?.id,
          status: MealStatus.PENDING,
          verificationMethod: method,
        },
      })
    }

    return NextResponse.json({
      verified: true,
      user: {
        id: user.id,
        name: user.name,
        studentId: user.studentId,
        email: user.email,
      },
      eligible,
      mealRecordId: mealRecord?.id,
      tokenNumber: activeToken?.tokenNumber,
      mealPlan: activeEnrollment?.mealPlan.name,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error verifying user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

