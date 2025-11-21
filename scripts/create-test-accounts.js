const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestAccounts() {
  try {
    console.log('Creating test accounts...\n')

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12)
    const managerPassword = await bcrypt.hash('manager123', 12)
    const studentPassword = await bcrypt.hash('student123', 12)

    // Admin Account
    const admin = await prisma.user.upsert({
      where: { email: 'admin@cuet.ac.bd' },
      update: {
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
        studentId: null,
        faceId: null,
        idCardNumber: null,
        pin: null,
      },
      create: {
        email: 'admin@cuet.ac.bd',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    })
    console.log('✅ Admin account:', admin.email)

    // Manager Account - explicitly set all nullable fields to null
    let manager
    const existingManager = await prisma.user.findUnique({
      where: { email: 'manager@cuet.ac.bd' },
    })

    if (existingManager) {
      manager = await prisma.user.update({
        where: { email: 'manager@cuet.ac.bd' },
        data: {
          password: managerPassword,
          name: 'Manager User',
          role: 'MANAGER',
          studentId: null,
          faceId: null,
          idCardNumber: null,
          pin: null,
        },
      })
    } else {
      manager = await prisma.user.create({
        data: {
          email: 'manager@cuet.ac.bd',
          password: managerPassword,
          name: 'Manager User',
          role: 'MANAGER',
        },
      })
    }
    console.log('✅ Manager account:', manager.email)

    // Student Account
    let student
    const existingStudent = await prisma.user.findUnique({
      where: { email: 'student@cuet.ac.bd' },
    })

    // Check if studentId is available
    const studentIdUser = await prisma.user.findUnique({
      where: { studentId: 'CUET-2024-001' },
    })

    if (existingStudent) {
      const updateData = {
        password: studentPassword,
        name: 'Student User',
        role: 'STUDENT',
      }
      
      // Only update studentId if it's available or belongs to this user
      if (!studentIdUser || studentIdUser.email === 'student@cuet.ac.bd') {
        updateData.studentId = 'CUET-2024-001'
      }
      
      student = await prisma.user.update({
        where: { email: 'student@cuet.ac.bd' },
        data: updateData,
      })
    } else {
      const createData = {
        email: 'student@cuet.ac.bd',
        password: studentPassword,
        name: 'Student User',
        role: 'STUDENT',
      }
      
      if (!studentIdUser) {
        createData.studentId = 'CUET-2024-001'
      }
      
      student = await prisma.user.create({
        data: createData,
      })
    }
    console.log('✅ Student account:', student.email)

    // Final verification
    const finalAdmin = await prisma.user.findUnique({ where: { email: 'admin@cuet.ac.bd' } })
    const finalManager = await prisma.user.findUnique({ where: { email: 'manager@cuet.ac.bd' } })
    const finalStudent = await prisma.user.findUnique({ where: { email: 'student@cuet.ac.bd' } })

    console.log('\n' + '='.repeat(60))
    console.log('📋 TEST ACCOUNTS SUMMARY')
    console.log('='.repeat(60))
    console.log('\n🔑 Admin Account:')
    console.log('   Email: admin@cuet.ac.bd')
    console.log('   Password: admin123')
    console.log('   Role: ADMIN')
    console.log('\n👔 Manager Account:')
    console.log('   Email: manager@cuet.ac.bd')
    console.log('   Password: manager123')
    console.log('   Role: MANAGER')
    console.log('\n🎓 Student Account:')
    console.log('   Email: student@cuet.ac.bd')
    console.log('   Password: student123')
    console.log('   Role: STUDENT')
    console.log('   Student ID:', finalStudent?.studentId || 'CUET-2024-001')
    console.log('\n' + '='.repeat(60))
    console.log('✅ All test accounts created successfully!')
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code === 'P2002') {
      console.error('   Unique constraint violation. An account may already exist.')
      console.error('   Try deleting existing accounts first or use different credentials.')
    }
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createTestAccounts()
