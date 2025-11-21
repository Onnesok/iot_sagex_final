import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function setupAccounts() {
  try {
    console.log('🔧 Setting up Manager and Student accounts in MongoDB using Prisma...\n')

    // Hash passwords using the auth library function
    const managerPassword = await hashPassword('manager123')
    const studentPassword = await hashPassword('student123')

    // Create or update Manager Account using upsert
    console.log('Creating Manager account...')
    try {
      const manager = await prisma.user.upsert({
        where: { email: 'manager@cuet.ac.bd' },
        update: {
          password: managerPassword,
          name: 'Manager User',
          role: 'MANAGER',
        },
        create: {
          email: 'manager@cuet.ac.bd',
          password: managerPassword,
          name: 'Manager User',
          role: 'MANAGER',
        },
      })
      console.log('✅ Manager account created/updated:', manager.email)
    } catch (error: any) {
      if (error.code === 'P2002') {
        // If unique constraint fails, try to update the existing record
        const manager = await prisma.user.update({
          where: { email: 'manager@cuet.ac.bd' },
          data: {
            password: managerPassword,
            name: 'Manager User',
            role: 'MANAGER',
          },
        })
        console.log('✅ Manager account updated:', manager.email)
      } else {
        throw error
      }
    }

    // Create or update Student Account using upsert
    console.log('Creating Student account...')
    let student
    try {
      // First try with studentId
      student = await prisma.user.upsert({
        where: { email: 'student@cuet.ac.bd' },
        update: {
          password: studentPassword,
          name: 'Student User',
          role: 'STUDENT',
          studentId: 'CUET-2024-001',
        },
        create: {
          email: 'student@cuet.ac.bd',
          password: studentPassword,
          name: 'Student User',
          role: 'STUDENT',
          studentId: 'CUET-2024-001',
        },
      })
      console.log('✅ Student account created/updated:', student.email, 'with Student ID:', student.studentId)
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('studentId')) {
        // StudentId is taken, check if it's by the same user
        const existingStudentId = await prisma.user.findUnique({
          where: { studentId: 'CUET-2024-001' },
        })
        
        if (existingStudentId && existingStudentId.email === 'student@cuet.ac.bd') {
          // Same user, just update
          student = await prisma.user.update({
            where: { email: 'student@cuet.ac.bd' },
            data: {
              password: studentPassword,
              name: 'Student User',
              role: 'STUDENT',
            },
          })
          console.log('✅ Student account updated:', student.email, 'with Student ID:', student.studentId)
        } else {
          // Different user has the studentId
          console.log('⚠️  Student ID CUET-2024-001 is already taken by:', existingStudentId?.email || 'another user')
          console.log('⚠️  Creating student account without studentId')
          student = await prisma.user.upsert({
            where: { email: 'student@cuet.ac.bd' },
            update: {
              password: studentPassword,
              name: 'Student User',
              role: 'STUDENT',
            },
            create: {
              email: 'student@cuet.ac.bd',
              password: studentPassword,
              name: 'Student User',
              role: 'STUDENT',
            },
          })
          console.log('✅ Student account created/updated without studentId:', student.email)
        }
      } else if (error.code === 'P2002') {
        // Other unique constraint, try update
        student = await prisma.user.update({
          where: { email: 'student@cuet.ac.bd' },
          data: {
            password: studentPassword,
            name: 'Student User',
            role: 'STUDENT',
            studentId: 'CUET-2024-001',
          },
        })
        console.log('✅ Student account updated:', student.email)
      } else {
        throw error
      }
    }

    console.log('\n📋 Account Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Admin Account:')
    console.log('  Email: admin@cuet.ac.bd')
    console.log('  Password: admin123')
    console.log('  Role: ADMIN')
    console.log('\nManager Account:')
    console.log('  Email: manager@cuet.ac.bd')
    console.log('  Password: manager123')
    console.log('  Role: MANAGER')
    console.log('\nStudent Account:')
    console.log('  Email: student@cuet.ac.bd')
    console.log('  Password: student123')
    console.log('  Role: STUDENT')
    if (student?.studentId) {
      console.log('  Student ID: CUET-2024-001')
    } else {
      console.log('  Student ID: Not set (CUET-2024-001 was already taken)')
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('✅ All accounts set up successfully in MongoDB!')
  } catch (error) {
    console.error('❌ Error setting up accounts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupAccounts()
  .then(() => {
    console.log('✅ Setup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })

