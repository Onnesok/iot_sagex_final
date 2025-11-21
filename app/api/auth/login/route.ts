import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, generateToken, getUserByEmail } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'STUDENT']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, role } = loginSchema.parse(body)

    // Get user from the specific collection based on role
    const user = await getUserByEmail(email, role || undefined)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials or role mismatch' },
        { status: 401 }
      )
    }

    // If role is specified, verify it matches
    if (role && user.role !== role) {
      return NextResponse.json(
        { error: `This account is not authorized for ${role} login. Please select the correct role.` },
        { status: 403 }
      )
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.studentId,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

