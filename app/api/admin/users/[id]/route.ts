import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  department: z.string().optional(),
  studentId: z.string().optional(),
  idCardNumber: z.union([z.string(), z.null()]).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const data = updateUserSchema.parse(body)

    // Find user in all collections
    const [student, manager, admin] = await Promise.all([
      prisma.student.findUnique({ where: { id: params.id } }),
      prisma.manager.findUnique({ where: { id: params.id } }),
      prisma.admin.findUnique({ where: { id: params.id } }),
    ])

    if (!student && !manager && !admin) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: any = { ...data }

    if (typeof data.idCardNumber !== 'undefined') {
      if (data.idCardNumber === null) {
        updateData.idCardNumber = null
      } else {
        const normalized = data.idCardNumber.replace(/\s+/g, '').trim()
        if (normalized === '') {
          updateData.idCardNumber = null
        } else {
          const formatted = normalized.toUpperCase()
          const existing = await prisma.student.findFirst({
            where: {
              idCardNumber: formatted,
              id: { not: params.id },
            },
            select: { id: true },
          })
          if (existing) {
            return NextResponse.json(
              { error: 'ID card already assigned to another student' },
              { status: 409 }
            )
          }
          updateData.idCardNumber = formatted
        }
      }
    }
    if (data.password) {
      updateData.password = await hashPassword(data.password)
    }

    let updatedUser
    if (student) {
      updatedUser = await prisma.student.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
          department: true,
          faceId: true,
          idCardNumber: true,
          pin: true,
        },
      })
      return NextResponse.json({ ...updatedUser, role: 'STUDENT' })
    } else if (manager) {
      updatedUser = await prisma.manager.update({
        where: { id: params.id },
        data: updateData,
      })
      return NextResponse.json({ ...updatedUser, role: 'MANAGER' })
    } else if (admin) {
      updatedUser = await prisma.admin.update({
        where: { id: params.id },
        data: updateData,
      })
      return NextResponse.json({ ...updatedUser, role: 'ADMIN' })
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent admin from deleting themselves
    if (decoded.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Try to delete from all collections
    const [student, manager, admin] = await Promise.all([
      prisma.student.findUnique({ where: { id: params.id } }),
      prisma.manager.findUnique({ where: { id: params.id } }),
      prisma.admin.findUnique({ where: { id: params.id } }),
    ])

    if (student) {
      await prisma.student.delete({ where: { id: params.id } })
    } else if (manager) {
      await prisma.manager.delete({ where: { id: params.id } })
    } else if (admin) {
      await prisma.admin.delete({ where: { id: params.id } })
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

