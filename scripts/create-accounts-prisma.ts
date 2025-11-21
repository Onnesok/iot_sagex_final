import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function createAccounts() {
  try {
    console.log('🔧 Creating Manager and Student accounts using Prisma...\n')

    // Hash passwords
    const managerPassword = await hashPassword('manager123')
    const studentPassword = await hashPassword('student123')

    // Check existing accounts
    const existingManager = await prisma.user.findUnique({
      where: { email: 'manager@cuet.ac.bd' },
    })

    const existingStudent = await prisma.user.findUnique({
      where: { email: 'student@cuet.ac.bd' },
    })

    // Create Manager Account
    if (existingManager) {
      await prisma.user.update({
        where: { email: 'manager@cuet.ac.bd' },
        data: {
          password: managerPassword,
          name: 'Manager User',
          role: 'MANAGER',
        },
      })
      console.log('✅ Manager account updated')
    } else {
      await prisma.user.create({
        data: {
          email: 'manager@cuet.ac.bd',
          password: managerPassword,
          name: 'Manager User',
          role: 'MANAGER',
        },
      })
      console.log('✅ Manager account created')
    }

    // Create Student Account
    if (existingStudent) {
      // Check if studentId is available
      const studentIdOwner = await prisma.user.findUnique({
        where: { studentId: 'CUET-2024-001' },
      })

      if (studentIdOwner && studentIdOwner.email !== 'student@cuet.ac.bd') {
        // StudentId is taken by someone else
        await prisma.user.update({
          where: { email: 'student@cuet.ac.bd' },
          data: {
            password: studentPassword,
            name: 'Student User',
            role: 'STUDENT',
          },
        })
        console.log('✅ Student account updated (without studentId - CUET-2024-001 is taken)')
      } else {
        // StudentId is available or belongs to this student
        await prisma.user.update({
          where: { email: 'student@cuet.ac.bd' },
          data: {
            password: studentPassword,
            name: 'Student User',
            role: 'STUDENT',
            studentId: 'CUET-2024-001',
          },
        })
        console.log('✅ Student account updated with Student ID: CUET-2024-001')
      }
    } else {
      // Create new student
      try {
        await prisma.user.create({
          data: {
            email: 'student@cuet.ac.bd',
            password: studentPassword,
            name: 'Student User',
            role: 'STUDENT',
            studentId: 'CUET-2024-001',
          },
        })
        console.log('✅ Student account created with Student ID: CUET-2024-001')
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('studentId')) {
          // StudentId is taken, create without it
          await prisma.user.create({
            data: {
              email: 'student@cuet.ac.bd',
              password: studentPassword,
              name: 'Student User',
              role: 'STUDENT',
            },
          })
          console.log('⚠️  Student account created without studentId (CUET-2024-001 was already taken)')
        } else {
          throw error
        }
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

createAccounts()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })

