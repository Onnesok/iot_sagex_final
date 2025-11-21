import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAllSparseIndexes() {
  try {
    console.log('🔧 Fixing all optional unique indexes to be sparse...\n')

    const indexesToFix = [
      { field: 'idCardNumber', indexName: 'Student_idCardNumber_key' },
      { field: 'faceId', indexName: 'Student_faceId_key' },
    ]

    for (const { field, indexName } of indexesToFix) {
      // Drop the existing unique index
      console.log(`Dropping existing ${field} index...`)
      try {
        await prisma.$runCommandRaw({
          dropIndexes: 'Student',
          index: indexName,
        })
        console.log(`✅ ${field} index dropped`)
      } catch (error: any) {
        console.log(`⚠️  ${field} index may not exist:`, error.message)
      }

      // Create a new sparse unique index
      console.log(`Creating sparse unique index on ${field}...`)
      await prisma.$runCommandRaw({
        createIndexes: 'Student',
        indexes: [
          {
            key: { [field]: 1 },
            name: indexName,
            unique: true,
            sparse: true, // Only index documents that have this field
          },
        ],
      })
      console.log(`✅ Sparse unique index created for ${field}\n`)
    }

    console.log('✅ All indexes fixed!')
    console.log('\n📝 Note: Sparse indexes will only enforce uniqueness on documents that have the field.')
    console.log('   Documents without these fields will not be indexed and can coexist.')
  } catch (error) {
    console.error('❌ Error fixing indexes:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixAllSparseIndexes()

