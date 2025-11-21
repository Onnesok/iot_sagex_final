import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function createTestAccounts() {
  try {
    console.log('Creating test accounts...')

    // Hash passwords
    const adminPassword = await hashPassword('admin123')
    const managerPassword = await hashPassword('manager123')
    const studentPassword = await hashPassword('student123')

    // Create Admin Account
    const admin = await prisma.user.upsert({
      where: { email: 'admin@cuet.ac.bd' },
      update: {},
      create: {
        email: 'admin@cuet.ac.bd',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    })
    console.log('✅ Admin account created:', admin.email)

    // Create Manager Account
    const manager = await prisma.user.upsert({
      where: { email: 'manager@cuet.ac.bd' },
      update: {},
      create: {
        email: 'manager@cuet.ac.bd',
        password: managerPassword,
        name: 'Manager User',
        role: 'MANAGER',
      },
    })
    console.log('✅ Manager account created:', manager.email)

    // Create Student Account
    const student = await prisma.user.upsert({
      where: { email: 'student@cuet.ac.bd' },
      update: {},
      create: {
        email: 'student@cuet.ac.bd',
        password: studentPassword,
        name: 'Student User',
        role: 'STUDENT',
        studentId: 'CUET-2024-001',
      },
    })
    console.log('✅ Student account created:', student.email)

    console.log('\n📋 Test Accounts Summary:')
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    console.log('\n✅ All test accounts created successfully!')
  } catch (error) {
    console.error('❌ Error creating test accounts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createTestAccounts()

