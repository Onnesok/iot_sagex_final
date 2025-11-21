import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createEnrollmentSchema = z.object({
  userId: z.string(),
  mealPlanId: z.string(),
})

/**
 * POST /api/admin/enrollments
 * Assign a meal plan to a student (create enrollment)
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, mealPlanId } = createEnrollmentSchema.parse(body)

    // Get meal plan details
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
    })

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 })
    }

    if (!mealPlan.isActive) {
      return NextResponse.json({ error: 'Meal plan is not active' }, { status: 400 })
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: userId },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Check for existing active enrollment
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Student already has an active meal plan. Please deactivate it first.' },
        { status: 400 }
      )
    }

    // Calculate end date based on duration
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + mealPlan.durationDays)

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: userId,
        mealPlanId: mealPlanId,
        startDate: startDate,
        endDate: endDate,
        mealsRemaining: mealPlan.mealCount,
        isActive: true,
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
        mealPlan: {
          select: {
            id: true,
            name: true,
            mealCount: true,
            durationDays: true,
            price: true,
          },
        },
      },
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating enrollment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/enrollments
 * Get all enrollments
 */
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

    const enrollments = await prisma.enrollment.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true,
          },
        },
        mealPlan: {
          select: {
            id: true,
            name: true,
            mealCount: true,
            durationDays: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

