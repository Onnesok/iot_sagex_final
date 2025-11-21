import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateFaceIdSchema = z.object({
  studentId: z.string(),
  faceId: z.string(),
})

/**
 * PUT /api/hardware/update-face-id
 * Update faceId for a student (called by face recognition service)
 * No authentication required - for hardware integration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, faceId } = updateFaceIdSchema.parse(body)

    // Update student's faceId
    const student = await prisma.student.update({
      where: { id: studentId },
      data: { faceId },
      select: {
        id: true,
        name: true,
        faceId: true,
      },
    })

    return NextResponse.json({
      success: true,
      student,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating faceId:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

