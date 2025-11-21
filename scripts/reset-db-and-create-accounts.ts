import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function resetDatabase() {
  try {
    console.log('🗑️  Resetting database...\n')

    // Drop all collections to reset indexes
    console.log('Dropping all collections...')
    await prisma.$runCommandRaw({
      drop: 'User'
    }).catch(() => {}) // Ignore if collection doesn't exist

    await prisma.$runCommandRaw({
      drop: 'Token'
    }).catch(() => {})

    await prisma.$runCommandRaw({
      drop: 'Enrollment'
    }).catch(() => {})

    await prisma.$runCommandRaw({
      drop: 'MealRecord'
    }).catch(() => {})

    await prisma.$runCommandRaw({
      drop: 'MealPlan'
    }).catch(() => {})

    await prisma.$runCommandRaw({
      drop: 'SystemConfig'
    }).catch(() => {})

    console.log('✅ All collections dropped\n')
    
    // Push schema again to recreate collections with indexes
    console.log('Recreating collections with schema...')
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    try {
      const { stdout, stderr } = await execAsync('npx prisma db push --skip-generate')
      console.log(stdout)
      if (stderr) console.log(stderr)
    } catch (error: any) {
      console.log('Schema push result:', error.stdout || error.message)
    }
    
    console.log('✅ Collections recreated\n')
  } catch (error) {
    console.error('❌ Error resetting database:', error)
    throw error
  }
}

async function createAccounts() {
  try {
    console.log('🔧 Creating accounts...\n')

    // Hash passwords
    const adminPassword = await hashPassword('admin123')
    const managerPassword = await hashPassword('manager123')
    const studentPassword = await hashPassword('student123')

    // Create Admin Account
    const admin = await prisma.user.create({
      data: {
        email: 'admin@cuet.ac.bd',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    })
    console.log('✅ Admin account created:', admin.email)

    // Create Manager Account
    const manager = await prisma.user.create({
      data: {
        email: 'manager@cuet.ac.bd',
        password: managerPassword,
        name: 'Manager User',
        role: 'MANAGER',
      },
    })
    console.log('✅ Manager account created:', manager.email)

    // Create Student Account
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
  }
}

async function main() {
  try {
    // Reset database
    await resetDatabase()

    // Recreate accounts
    await createAccounts()

    console.log('\n✅ Database reset and accounts created successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

