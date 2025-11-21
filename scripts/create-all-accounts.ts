import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function createAllAccounts() {
  try {
    console.log('🔧 Creating Admin, Manager, and Student accounts...\n')

    // Hash passwords
    const adminPassword = await hashPassword('admin123')
    const managerPassword = await hashPassword('manager123')
    const studentPassword = await hashPassword('student123')

    // Create Admin Account (no studentId)
    console.log('Creating Admin account...')
    const admin = await prisma.user.create({
      data: {
        email: 'admin@cuet.ac.bd',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    })
    console.log('✅ Admin account created:', admin.email)

    // Create Manager Account (no studentId)
    console.log('Creating Manager account...')
    const manager = await prisma.user.create({
      data: {
        email: 'manager@cuet.ac.bd',
        password: managerPassword,
        name: 'Manager User',
        role: 'MANAGER',
      },
    })
    console.log('✅ Manager account created:', manager.email)

    // Create Student Account (with studentId)
    console.log('Creating Student account...')
    const student = await prisma.user.create({
      data: {
        email: 'student@cuet.ac.bd',
        password: studentPassword,
        name: 'Student User',
        role: 'STUDENT',
        studentId: 'CUET-2024-001',
      },
    })
    console.log('✅ Student account created:', student.email, 'with Student ID:', student.studentId)

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

createAllAccounts()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })

