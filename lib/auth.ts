import { compare, hash } from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  studentId?: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch {
    return null
  }
}

export async function getUserByEmail(email: string, role?: 'ADMIN' | 'MANAGER' | 'STUDENT') {
  // Check specific collection if role is provided
  if (role) {
    switch (role) {
      case 'ADMIN':
        const admin = await prisma.admin.findUnique({ where: { email } })
        if (admin) {
          return { ...admin, role: 'ADMIN' as UserRole, studentId: null }
        }
        break
      case 'MANAGER':
        const manager = await prisma.manager.findUnique({ where: { email } })
        if (manager) {
          return { ...manager, role: 'MANAGER' as UserRole, studentId: null }
        }
        break
      case 'STUDENT':
        const student = await prisma.student.findUnique({ where: { email } })
        if (student) {
          return { ...student, role: 'STUDENT' as UserRole, studentId: student.studentId }
        }
        break
    }
    return null
  }

  // If no role specified, check all collections
  const admin = await prisma.admin.findUnique({ where: { email } })
  if (admin) return { ...admin, role: 'ADMIN' as UserRole, studentId: null }

  const manager = await prisma.manager.findUnique({ where: { email } })
  if (manager) return { ...manager, role: 'MANAGER' as UserRole, studentId: null }

  const student = await prisma.student.findUnique({ where: { email } })
  if (student) return { ...student, role: 'STUDENT' as UserRole, studentId: student.studentId }

  return null
}

export async function getUserById(id: string, role?: 'ADMIN' | 'MANAGER' | 'STUDENT') {
  // Check specific collection if role is provided
  if (role) {
    switch (role) {
      case 'ADMIN':
        const admin = await prisma.admin.findUnique({ where: { id } })
        if (admin) {
          return { 
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: 'ADMIN' as UserRole,
            studentId: null,
            faceId: null,
            idCardNumber: null,
          }
        }
        break
      case 'MANAGER':
        const manager = await prisma.manager.findUnique({ where: { id } })
        if (manager) {
          return {
            id: manager.id,
            email: manager.email,
            name: manager.name,
            role: 'MANAGER' as UserRole,
            studentId: null,
            faceId: null,
            idCardNumber: null,
          }
        }
        break
      case 'STUDENT':
        const student = await prisma.student.findUnique({ where: { id } })
        if (student) {
          return {
            id: student.id,
            email: student.email,
            name: student.name,
            role: 'STUDENT' as UserRole,
            studentId: student.studentId,
            faceId: student.faceId || null,
            idCardNumber: student.idCardNumber || null,
          }
        }
        break
    }
    return null
  }

  // If no role specified, check all collections
  const admin = await prisma.admin.findUnique({ where: { id } })
  if (admin) {
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'ADMIN' as UserRole,
      studentId: null,
      faceId: null,
      idCardNumber: null,
    }
  }

  const manager = await prisma.manager.findUnique({ where: { id } })
  if (manager) {
    return {
      id: manager.id,
      email: manager.email,
      name: manager.name,
      role: 'MANAGER' as UserRole,
      studentId: null,
      faceId: null,
      idCardNumber: null,
    }
  }

  const student = await prisma.student.findUnique({ where: { id } })
  if (student) {
    return {
      id: student.id,
      email: student.email,
      name: student.name,
      role: 'STUDENT' as UserRole,
      studentId: student.studentId,
      faceId: student.faceId || null,
      idCardNumber: student.idCardNumber || null,
    }
  }

  return null
}

