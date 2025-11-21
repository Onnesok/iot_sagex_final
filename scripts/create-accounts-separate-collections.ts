import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function createAccounts() {
  try {
    console.log('🔧 Creating accounts in separate collections...\n')

    // Hash passwords
    const adminPassword = await hashPassword('admin123')
    const managerPassword = await hashPassword('manager123')
    const studentPassword = await hashPassword('student123')

    // Create Admin Account in Admin collection
    console.log('Creating Admin account in Admin collection...')
    const admin = await prisma.admin.create({
      data: {
        email: 'admin@cuet.ac.bd',
        password: adminPassword,
        name: 'Admin User',
      },
    })
    console.log('✅ Admin account created:', admin.email)

    // Create Manager Account in Manager collection
    console.log('Creating Manager account in Manager collection...')
    const manager = await prisma.manager.create({
      data: {
        email: 'manager@cuet.ac.bd',
        password: managerPassword,
        name: 'Manager User',
      },
    })
    console.log('✅ Manager account created:', manager.email)

    // Create Student Account in Student collection
    console.log('Creating Student account in Student collection...')
    const student = await prisma.student.create({
      data: {
        email: 'student@cuet.ac.bd',
        password: studentPassword,
        name: 'Student User',
        studentId: 'CUET-2024-001',
      },
    })
    console.log('✅ Student account created:', student.email, 'with Student ID:', student.studentId)

    console.log('\n📋 Account Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Admin Account (Admin collection):')
    console.log('  Email: admin@cuet.ac.bd')
    console.log('  Password: admin123')
    console.log('  Role: ADMIN')
    console.log('\nManager Account (Manager collection):')
    console.log('  Email: manager@cuet.ac.bd')
    console.log('  Password: manager123')
    console.log('  Role: MANAGER')
    console.log('\nStudent Account (Student collection):')
    console.log('  Email: student@cuet.ac.bd')
    console.log('  Password: student123')
    console.log('  Role: STUDENT')
    console.log('  Student ID: CUET-2024-001')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('✅ All accounts created successfully in separate collections!')
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

