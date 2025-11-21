import { NextRequest, NextResponse } from 'next/server'
import { recognizeFace } from '@/lib/face-recognition'

// Store recent frames in memory (in production, use Redis or similar)
const recentFrames: Buffer[] = []
const MAX_FRAMES = 10 // Keep last 10 frames

export async function POST(request: NextRequest) {
  try {
    // Get the image buffer from the request
    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Add frame to recent frames
    recentFrames.push(buffer)
    if (recentFrames.length > MAX_FRAMES) {
      recentFrames.shift() // Remove oldest frame
    }
    
    // Process frame for face detection and recognition
    // This runs asynchronously so we don't block the response
    processFrameAsync(buffer).catch(error => {
      console.error('Error processing frame:', error)
    })
    
    return NextResponse.json({
      success: true,
      message: 'Frame received',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error receiving video frame:', error)
    return NextResponse.json(
      { error: 'Failed to process video frame' },
      { status: 500 }
    )
  }
}

async function processFrameAsync(buffer: Buffer) {
  try {
    // Detect and recognize faces in the frame
    const result = await recognizeFace(buffer)
    
    if (result && result.faces.length > 0) {
      console.log(`Detected ${result.faces.length} face(s)`)
      
      // For each recognized face, call the verify endpoint
      for (const face of result.faces) {
        if (face.faceId) {
          console.log(`Recognized face: ${face.faceId}`)
          
          // Verify the user (this will create a meal record if eligible)
          await verifyUser(face.faceId)
        }
      }
    }
  } catch (error) {
    console.error('Error in frame processing:', error)
  }
}

async function verifyUser(faceId: string) {
  try {
    // Call the internal verify endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/hardware/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'FACE',
        faceId: faceId,
      }),
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.verified && data.eligible) {
        console.log(`User ${data.user.name} verified and eligible for meal`)
      } else {
        console.log(`User verified but not eligible: ${data.reason}`)
      }
    }
  } catch (error) {
    console.error('Error verifying user:', error)
  }
}

// Export function to get recent frames (for debugging or live view)
export async function GET() {
  return NextResponse.json({
    framesReceived: recentFrames.length,
    timestamp: new Date().toISOString(),
  })
}

