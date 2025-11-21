import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixIdCardIndex() {
  try {
    console.log('🔧 Fixing idCardNumber unique index to be sparse...\n')

    // Drop the existing unique index
    console.log('Dropping existing idCardNumber index...')
    try {
      await prisma.$runCommandRaw({
        dropIndexes: 'Student',
        index: 'Student_idCardNumber_key',
      })
      console.log('✅ Index dropped\n')
    } catch (error: any) {
      console.log('⚠️  Index may not exist or already dropped:', error.message)
    }

    // Create a new sparse unique index (only indexes documents that have the field)
    console.log('Creating sparse unique index on idCardNumber...')
    await prisma.$runCommandRaw({
      createIndexes: 'Student',
      indexes: [
        {
          key: { idCardNumber: 1 },
          name: 'Student_idCardNumber_key',
          unique: true,
          sparse: true, // Only index documents that have idCardNumber field
        },
      ],
    })
    console.log('✅ Sparse unique index created\n')

    console.log('✅ Index fix completed!')
    console.log('\n📝 Note: The sparse index will only enforce uniqueness on documents that have idCardNumber.')
    console.log('   Documents without idCardNumber will not be indexed and can coexist.')
  } catch (error) {
    console.error('❌ Error fixing index:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixIdCardIndex()

