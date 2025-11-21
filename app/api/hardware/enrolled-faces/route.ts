import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/hardware/enrolled-faces
 * Get all enrolled students with faceId and photo for face recognition service
 * This endpoint is for hardware/integration use - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    // Get all students who have a photo (faceId may or may not exist yet)
    // When manager approves, students become eligible for recognition
    const students = await prisma.student.findMany({
      where: {
        photo: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        studentId: true,
        email: true,
        faceId: true,
        photo: true,
      },
    })

    // Return students with their photo (faceId will be generated if missing)
    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching enrolled faces:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

