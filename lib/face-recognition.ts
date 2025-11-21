/**
 * Face Recognition Service
 * 
 * This module handles face detection and recognition from video frames.
 * 
 * For production, you would integrate with a face recognition service like:
 * - face-api.js (client-side)
 * - OpenCV with face_recognition library (Python backend)
 * - AWS Rekognition
 * - Google Cloud Vision API
 * - Azure Face API
 * 
 * This is a placeholder implementation that shows the interface.
 */

import { prisma } from './prisma'

interface FaceDetectionResult {
  faces: Array<{
    faceId: string
    confidence: number
    boundingBox?: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
}

/**
 * Recognize faces in an image buffer
 * 
 * @param imageBuffer - JPEG image buffer from camera
 * @returns Face detection and recognition results
 */
export async function recognizeFace(
  imageBuffer: Buffer
): Promise<FaceDetectionResult | null> {
  try {
    // Use Python face recognition service
    const faceServiceUrl =
      process.env.FACE_RECOGNITION_SERVICE_URL || 'http://localhost:5000'
    
    const response = await fetch(`${faceServiceUrl}/detect`, {
      method: 'POST',
      body: imageBuffer,
      headers: {
        'Content-Type': 'image/jpeg',
      },
      // Increase timeout for face recognition processing
      signal: AbortSignal.timeout(5000),
    })
    
    if (!response.ok) {
      console.error(
        `Face recognition service error: ${response.status} ${response.statusText}`
      )
      return null
    }
    
    const result = await response.json()
    
    return {
      faces: result.faces || [],
    }
  } catch (error) {
    // If face recognition service is not available, log but don't fail
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Face recognition service timeout')
    } else {
      console.error('Error recognizing face:', error)
    }
    return null
  }
}

/**
 * Get all registered face IDs from the database
 * This can be used to build a face recognition model
 */
export async function getAllFaceIds(): Promise<string[]> {
  try {
    const students = await prisma.student.findMany({
      where: {
        faceId: {
          not: null,
        },
      },
      select: {
        faceId: true,
      },
    })
    
    return students
      .map(s => s.faceId)
      .filter((faceId): faceId is string => faceId !== null)
  } catch (error) {
    console.error('Error fetching face IDs:', error)
    return []
  }
}

/**
 * Enroll a new face (for training the recognition system)
 * 
 * @param userId - User ID to associate with the face
 * @param imageBuffer - Image containing the face
 * @returns Generated face ID
 */
export async function enrollFace(
  userId: string,
  imageBuffer: Buffer
): Promise<string | null> {
  try {
    // Use Python face recognition service for enrollment
    const faceServiceUrl =
      process.env.FACE_RECOGNITION_SERVICE_URL || 'http://localhost:5000'
    
    // Convert buffer to base64 for JSON transmission
    const base64Image = imageBuffer.toString('base64')
    
    const response = await fetch(`${faceServiceUrl}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        image: base64Image,
      }),
      signal: AbortSignal.timeout(10000), // Longer timeout for enrollment
    })
    
    if (!response.ok) {
      console.error(
        `Face enrollment service error: ${response.status} ${response.statusText}`
      )
      return null
    }
    
    const result = await response.json()
    
    if (result.success && result.faceId) {
      // Update user with face ID in database
      await prisma.student.update({
        where: { id: userId },
        data: { faceId: result.faceId },
      })
      
      return result.faceId
    }
    
    return null
  } catch (error) {
    console.error('Error enrolling face:', error)
    return null
  }
}

