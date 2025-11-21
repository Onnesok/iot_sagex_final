import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const detectionSchema = z.object({
  count: z.number().min(1).max(3),
  timestamp: z.string().optional(),
})

// This endpoint can be used by hardware to notify when person(s) are detected
// Can trigger wake-up of system, logging, etc.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { count, timestamp } = detectionSchema.parse(body)

    // Log detection event (in production, you might want to store this)
    console.log(`Person(s) detected: ${count} at ${timestamp || new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      message: `System active - ${count} person(s) detected`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

