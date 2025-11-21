import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MealStatus } from '@prisma/client'
import { z } from 'zod'

const approveSchema = z.object({
  mealId: z.string(),
  approved: z.boolean(),
  reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { mealId, approved, reason } = approveSchema.parse(body)

    const meal = await prisma.mealRecord.findUnique({
      where: { id: mealId },
    })

    if (!meal) {
      return NextResponse.json({ error: 'Meal record not found' }, { status: 404 })
    }

    if (meal.status !== MealStatus.PENDING) {
      return NextResponse.json(
        { error: 'Meal record already processed' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status: approved ? MealStatus.APPROVED : MealStatus.DENIED,
      approvedAt: new Date(),
      approvedBy: decoded.id,
    }

    if (!approved && reason) {
      updateData.deniedReason = reason
    }

    if (approved) {
      updateData.completedAt = new Date()
    }

    await prisma.mealRecord.update({
      where: { id: mealId },
      data: updateData,
    })

    // If approved and using token, mark token as used
    if (approved && meal.tokenId) {
      await prisma.token.update({
        where: { id: meal.tokenId },
        data: { status: 'USED' },
      })
    }

    // If approved and using enrollment, decrement meals remaining
    if (approved && meal.enrollmentId) {
      await prisma.enrollment.update({
        where: { id: meal.enrollmentId },
        data: {
          mealsRemaining: {
            decrement: 1,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error approving meal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

