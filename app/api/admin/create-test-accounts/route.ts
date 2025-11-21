import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Hash passwords
    const adminPassword = await hashPassword('admin123')
    const managerPassword = await hashPassword('manager123')
    const studentPassword = await hashPassword('student123')

    // Create or update Admin Account
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@cuet.ac.bd' },
      update: {
        password: adminPassword,
        name: 'Admin User',
      },
      create: {
        email: 'admin@cuet.ac.bd',
        password: adminPassword,
        name: 'Admin User',
      },
    })

    // Create or update Manager Account
    const manager = await prisma.manager.upsert({
      where: { email: 'manager@cuet.ac.bd' },
      update: {
        password: managerPassword,
        name: 'Manager User',
      },
      create: {
        email: 'manager@cuet.ac.bd',
        password: managerPassword,
        name: 'Manager User',
      },
    })

    // Create or update Student Account
    const student = await prisma.student.upsert({
      where: { email: 'student@cuet.ac.bd' },
      update: {
        password: studentPassword,
        name: 'Student User',
        studentId: 'CUET-2024-001',
      },
      create: {
        email: 'student@cuet.ac.bd',
        password: studentPassword,
        name: 'Student User',
        studentId: 'CUET-2024-001',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Test accounts created successfully',
      accounts: {
        admin: {
          email: admin.email,
          name: admin.name,
          role: 'ADMIN',
        },
        manager: {
          email: manager.email,
          name: manager.name,
          role: 'MANAGER',
        },
        student: {
          email: student.email,
          name: student.name,
          role: 'STUDENT',
          studentId: student.studentId,
        },
      },
    })
  } catch (error) {
    console.error('Error creating test accounts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

