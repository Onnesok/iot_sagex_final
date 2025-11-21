import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function createMissingAccounts() {
  try {
    console.log('Creating Manager and Student accounts...\n')

    // Hash passwords
    const managerPassword = await hashPassword('manager123')
    const studentPassword = await hashPassword('student123')

    // Check if accounts already exist
    const existingManager = await prisma.user.findUnique({
      where: { email: 'manager@cuet.ac.bd' },
    })

    const existingStudent = await prisma.user.findUnique({
      where: { email: 'student@cuet.ac.bd' },
    })

    // Create or update Manager Account using upsert
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
    console.log(existingManager ? '✅ Manager account updated:' : '✅ Manager account created:', manager.email)

    // Check if studentId is already taken by another user
    const existingStudentId = await prisma.user.findUnique({
      where: { studentId: 'CUET-2024-001' },
    })

    // Create or update Student Account using upsert
    let student
    try {
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
      console.log(existingStudent ? '✅ Student account updated:' : '✅ Student account created:', student.email)
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('studentId')) {
        // StudentId is taken by someone else, create without it
        console.log('⚠️  Student ID CUET-2024-001 is already taken')
        if (existingStudentId) {
          console.log('⚠️  Taken by:', existingStudentId.email)
        }
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
        console.log(existingStudent ? '✅ Student account updated (without studentId):' : '✅ Student account created (without studentId):', student.email)
      } else {
        throw error
      }
    }

    console.log('\n📋 Account Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Manager Account:')
    console.log('  Email: manager@cuet.ac.bd')
    console.log('  Password: manager123')
    console.log('  Role: MANAGER')
    console.log('\nStudent Account:')
    console.log('  Email: student@cuet.ac.bd')
    console.log('  Password: student123')
    console.log('  Role: STUDENT')
    console.log('  Student ID: CUET-2024-001')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('✅ All accounts created successfully!')
  } catch (error) {
    console.error('❌ Error creating accounts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createMissingAccounts()
  .then(() => {
    console.log('Script completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })

