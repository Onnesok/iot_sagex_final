import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  idCardNumber: z.string().optional(),
  pin: z.string().optional(),
  faceId: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    // Update user based on role (only students have these fields)
    let user: any
    if (decoded.role === 'STUDENT') {
      user = await prisma.student.update({
        where: { id: decoded.id },
        data,
      })
    } else {
      return NextResponse.json(
        { error: 'Only students can update these fields' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        idCardNumber: user.idCardNumber,
        faceId: user.faceId,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

