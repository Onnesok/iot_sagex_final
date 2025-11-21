const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateRFID() {
  try {
    // Update Ratul's idCardNumber to D672F500
    const updated = await prisma.student.update({
      where: { id: '69202c2f8875ac0614596127' },
      data: { idCardNumber: 'D672F500' },
    })
    console.log('✅ Updated student:', updated.name)
    console.log('   Student ID:', updated.studentId)
    console.log('   RFID UID:', updated.idCardNumber)
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

updateRFID()

