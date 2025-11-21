import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  studentId: z.string().optional(),
  department: z.string().optional(),
  idCardNumber: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'STUDENT']).default('STUDENT'),
})

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  const mimeType = file.type || 'image/jpeg'
  return `data:${mimeType};base64,${base64}`
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== REGISTER ROUTE DEBUG START ===')
    
    // Check content type to handle both FormData and JSON
    const contentType = request.headers.get('content-type') || ''
    console.log('Content-Type:', contentType)
    
    let body: any = {}
    let photoBase64: string | undefined
    let idCardBase64: string | undefined

    if (contentType.includes('multipart/form-data')) {
      console.log('Processing FormData...')
      const formData = await request.formData()
      
      // Extract text fields
      const studentIdValue = formData.get('studentId') as string
      const departmentValue = formData.get('department') as string
      const idCardNumberValue = formData.get('idCardNumber') as string | null
      
      // Process idCardNumber - only include if it's a non-empty string
      let processedIdCardNumber: string | undefined = undefined
      if (idCardNumberValue != null && typeof idCardNumberValue === 'string') {
        const trimmed = idCardNumberValue.trim()
        if (trimmed.length > 0) {
          processedIdCardNumber = trimmed
        }
      }
      
      body = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        name: formData.get('name') as string,
        studentId: studentIdValue && studentIdValue.trim() ? studentIdValue.trim() : undefined,
        department: departmentValue && departmentValue.trim() ? departmentValue.trim() : undefined,
        idCardNumber: processedIdCardNumber,
        role: (formData.get('role') as string) || 'STUDENT',
      }

      // Handle file uploads
      const photoFile = formData.get('photo') as File | null
      const idCardFile = formData.get('idCard') as File | null

      if (photoFile && photoFile.size > 0) {
        photoBase64 = await fileToBase64(photoFile)
      }

      if (idCardFile && idCardFile.size > 0) {
        idCardBase64 = await fileToBase64(idCardFile)
      }
    } else {
      console.log('Processing JSON...')
      body = await request.json()
    }

    // Validate schema
    const { email, password, name, studentId, department, idCardNumber, role } = registerSchema.parse(body)
    console.log('Schema validation passed:', { email, name, studentId, department, idCardNumber, role })

    // Check if user already exists
    let existingUser = null
    if (role === 'STUDENT') {
      existingUser = await prisma.student.findUnique({
        where: { email },
      })
      if (!existingUser && studentId) {
        existingUser = await prisma.student.findUnique({
          where: { studentId },
        })
      }
    } else if (role === 'ADMIN') {
      existingUser = await prisma.admin.findUnique({
        where: { email },
      })
    } else if (role === 'MANAGER') {
      existingUser = await prisma.manager.findUnique({
        where: { email },
      })
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    // Create user based on role
    let user: any
    
    if (role === 'STUDENT') {
      if (!studentId) {
        return NextResponse.json(
          { error: 'Student ID is required for student registration' },
          { status: 400 }
        )
      }

      // Process optional unique fields - only include if they have valid non-empty values
      let processedIdCardNumber: string | undefined = undefined
      if (idCardNumber !== undefined && idCardNumber !== null && typeof idCardNumber === 'string') {
        const trimmed = idCardNumber.trim()
        if (trimmed.length > 0) {
          // Check if idCardNumber already exists
          const existingIdCard = await prisma.student.findUnique({
            where: { idCardNumber: trimmed },
          })
          if (existingIdCard) {
            return NextResponse.json(
              { error: `ID Card Number "${trimmed}" already exists. Please use a different ID card number or leave it empty.` },
              { status: 400 }
            )
          }
          processedIdCardNumber = trimmed
        }
      }

      // Build student data - ONLY include fields that have values
      // CRITICAL: Do NOT include idCardNumber or faceId if they're null/undefined/empty
      // This prevents unique constraint violations with sparse indexes
      const studentData: Record<string, any> = {
        email,
        password: hashedPassword,
        name,
        studentId,
      }

      // Add optional fields only if they have values
      if (department && department.trim()) {
        studentData.department = department.trim()
      }
      if (photoBase64) {
        studentData.photo = photoBase64
      }
      if (idCardBase64) {
        studentData.idCard = idCardBase64
      }
      // ONLY add idCardNumber if we have a valid value
      if (processedIdCardNumber) {
        studentData.idCardNumber = processedIdCardNumber
      }
      // faceId is not set during registration, so we don't include it
      // This ensures it's completely omitted and won't conflict with sparse index

      console.log('Creating student with data:', {
        keys: Object.keys(studentData),
        hasIdCardNumber: 'idCardNumber' in studentData,
        hasPhoto: 'photo' in studentData,
        hasIdCard: 'idCard' in studentData,
      })

      try {
        user = await prisma.student.create({
          data: studentData,
        })
        console.log('Student created successfully:', user.id)
      } catch (createError: any) {
        console.error('ERROR creating student:', {
          code: createError.code,
          message: createError.message,
          meta: createError.meta,
        })
        
        if (createError.code === 'P2002') {
          const target = createError.meta?.target || ''
          if (target.includes('idCardNumber')) {
            return NextResponse.json(
              { error: 'ID Card Number already exists. Please use a different ID card number or leave it empty.' },
              { status: 400 }
            )
          } else if (target.includes('faceId')) {
            return NextResponse.json(
              { error: 'Face ID already exists. This should not happen during registration.' },
              { status: 400 }
            )
          } else if (target.includes('studentId')) {
            return NextResponse.json(
              { error: 'Student ID already exists. Please use a different Student ID.' },
              { status: 400 }
            )
          } else if (target.includes('email')) {
            return NextResponse.json(
              { error: 'Email already exists. Please use a different email address.' },
              { status: 400 }
            )
          }
        }
        throw createError
      }
    } else if (role === 'ADMIN') {
      user = await prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      })
    } else if (role === 'MANAGER') {
      user = await prisma.manager.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: role as any,
      studentId: user.studentId || null,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: role,
        studentId: user.studentId || null,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.log('=== REGISTER ROUTE ERROR ===')
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors)
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error in register route:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    console.log('=== REGISTER ROUTE DEBUG END ===')
  }
}
