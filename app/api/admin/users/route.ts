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
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all users from different collections
    const [students, managers, admins] = await Promise.all([
      prisma.student.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
          faceId: true,
          idCardNumber: true,
          pin: true,
          enrolledAt: true,
          createdAt: true,
          department: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.manager.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.admin.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    // Combine and format users with role
    const allUsers = [
      ...students.map(s => ({ ...s, role: 'STUDENT' as const })),
      ...managers.map(m => ({ ...m, role: 'MANAGER' as const, studentId: null, faceId: null, idCardNumber: null, pin: null, enrolledAt: null, department: null })),
      ...admins.map(a => ({ ...a, role: 'ADMIN' as const, studentId: null, faceId: null, idCardNumber: null, pin: null, enrolledAt: null, department: null })),
    ]

    return NextResponse.json(allUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

