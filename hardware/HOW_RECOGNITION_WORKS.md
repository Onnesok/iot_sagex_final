# How Person Recognition Works

## Complete Flow: From IR Sensor to Face Recognition

### Step 1: IR Sensor Detection 🔴
```
IR Sensor → Detects object (person) → GPIO 13 goes LOW
```
- **Hardware**: IR sensor connected to GPIO 13
- **Detection**: When person stands in front, sensor output goes LOW
- **ESP32**: Reads sensor state continuously in `loop()`

### Step 2: ESP32 Activates Camera 📹
```cpp
if (personDetected && !lastDetectionState) {
  // Person just detected
  cameraActive = true;
  notifyPersonDetected();  // Notify Python service
}
```
- ESP32 activates camera when person detected
- Sends notification to Python service: `POST /api/hardware/person-detected`
- Camera starts capturing frames

### Step 3: ESP32 Captures & Sends Video Frames 📸
```cpp
void sendVideoFrame() {
  camera_fb_t * fb = esp_camera_fb_get();  // Capture frame
  http.POST((uint8_t *)fb->buf, fb->len);  // Send to Python service
}
```
- Camera captures JPEG image (320x240 @ 10 FPS)
- Sends frame to: `POST http://192.168.1.110:5000/api/hardware/video-stream`
- **Content-Type**: `image/jpeg`

### Step 4: Python Service Receives Frame 🐍
```python
@app.route('/api/hardware/video-stream', methods=['POST'])
def video_stream():
    image_buffer = request.data  # JPEG image bytes
    faces = detect_and_recognize_faces(image_buffer)
```
- Python Flask service receives JPEG image bytes
- Decodes image using OpenCV
- Converts BGR to RGB for InsightFace

### Step 5: InsightFace Detects Face 👤
```python
# Detect faces using InsightFace
faces = face_analyzer.get(rgb_image)

# Get face embedding (512-dimensional vector)
embedding = face.embedding
```
- **InsightFace Model**: Uses `buffalo_l` model (state-of-the-art)
- **Face Detection**: Finds all faces in the image
- **Face Embedding**: Extracts 512-dimensional feature vector
  - This is a mathematical representation of the face
  - Each person's face has a unique embedding pattern

### Step 6: Face Recognition (Comparing Embeddings) 🔍
```python
# Compare with known faces
for known_id, known_embedding in known_face_embeddings.items():
    # Calculate cosine similarity
    similarity = np.dot(embedding, known_embedding) / (
        np.linalg.norm(embedding) * np.linalg.norm(known_embedding)
    )
    
    if similarity > best_match_score:
        best_match_score = similarity
        best_match_id = known_id

# If similarity > threshold, it's a match!
if best_match_score > FACE_RECOGNITION_THRESHOLD:  # 0.6
    face_id = best_match_id
```
**How It Works:**
1. **Cosine Similarity**: Measures how similar two face embeddings are
   - Range: 0.0 (completely different) to 1.0 (identical)
   - Formula: `dot_product(a, b) / (norm(a) * norm(b))`

2. **Comparison**: New face embedding is compared with all enrolled faces
   - Finds the best match (highest similarity score)
   - If similarity > 0.6 → Recognized! ✅

3. **Result**: Returns `faceId` (e.g., "face-piyal-001")

### Step 7: Database Verification 📋
```python
# Verify user with Next.js (for database check)
verification_result = verify_user_with_nextjs(face_id)

# Calls: POST http://localhost:3000/api/hardware/verify
# Body: { "method": "FACE", "faceId": "face-piyal-001" }
```
- Python calls Next.js API with recognized `faceId`
- Next.js checks database:
  - ✅ User exists?
  - ✅ Already ate today? (prevent double-serving)
  - ✅ Has active token/meal plan? (eligibility)
- Returns: `verified`, `eligible`, `user` info

### Step 8: Result Returned 📤
```python
return jsonify({
    'success': True,
    'faces_detected': 1,
    'faces_recognized': 1,
    'results': [{
        'faceId': 'face-piyal-001',
        'confidence': 0.95,
        'verified': True,
        'eligible': True,
        'user': {
            'name': 'Piyal Chakraborty',
            'studentId': 'CUET-2024-XXX'
        }
    }]
})
```

---

## Visual Flow Diagram

```
┌─────────────┐
│ IR Sensor   │ → Person detected → GPIO 13 LOW
└─────────────┘
       ↓
┌─────────────┐
│  ESP32-CAM  │ → Activates camera → Captures frame
└─────────────┘
       ↓
┌─────────────┐
│   Camera    │ → JPEG image (320x240) @ 10 FPS
└─────────────┘
       ↓
┌─────────────┐
│   ESP32     │ → HTTP POST → Video frame (JPEG bytes)
└─────────────┘
       ↓
┌─────────────┐
│   Python    │ → Receives frame → Decodes image
│  Service    │
│ (Port 5000) │
└─────────────┘
       ↓
┌─────────────┐
│ InsightFace │ → Detects face → Extracts embedding (512-dim vector)
│   Model     │
└─────────────┘
       ↓
┌─────────────┐
│  Compare    │ → Cosine similarity with enrolled faces
│  Embeddings │ → Finds best match (similarity > 0.6)
└─────────────┘
       ↓
┌─────────────┐
│ Recognition │ → Returns: faceId (e.g., "face-piyal-001")
└─────────────┘
       ↓
┌─────────────┐
│   Next.js   │ → Checks database → Verifies eligibility
│  (Port 3000)│ → Returns: verified, eligible, user info
└─────────────┘
       ↓
┌─────────────┐
│   Result    │ → "Piyal Chakraborty - ELIGIBLE - APPROVE/DENY"
└─────────────┘
```

---

## Key Concepts

### 1. Face Embedding (Feature Vector)
- **512-dimensional vector** that represents a face
- Each number in the vector represents a facial feature
- Same person always has similar embedding
- Different persons have different embeddings
- Example: `[0.123, -0.456, 0.789, ..., 0.234]` (512 numbers)

### 2. Cosine Similarity
- Measures angle between two vectors
- **0.0** = Completely different faces
- **0.6** = Similar faces (threshold)
- **0.9** = Very similar faces
- **1.0** = Same face (perfect match)

### 3. Enrollment (Adding a Face)
Before recognition works, you need to enroll faces:

```python
POST /enroll
{
  "userId": "student-123",
  "faceId": "face-piyal-001",
  "image": "base64-encoded-image"
}
```

**What happens:**
1. Python receives image
2. InsightFace detects face in image
3. Extracts 512-dim embedding
4. Stores embedding in `known_face_embeddings` dictionary
5. Key = `faceId`, Value = embedding array

**Storage:**
- Currently stored in memory (`known_face_embeddings` dictionary)
- Lost when service restarts
- **In production**: Store in database

### 4. Recognition Process
When video frame arrives:
1. Detect face → Extract embedding
2. Compare with all enrolled faces
3. Find best match (highest similarity)
4. If similarity > 0.6 → **Recognized!** ✅
5. Return `faceId` (e.g., "face-piyal-001")

---

## Example Recognition

### Scenario: Piyal Approaches Cafeteria

**Step 1**: IR sensor detects → ESP32 activates camera

**Step 2**: ESP32 captures frame:
```
Frame size: 15,432 bytes (JPEG)
Resolution: 320x240
```

**Step 3**: Python receives frame → InsightFace detects:
```
Found 1 face(s) in image
Face bounding box: (x: 45, y: 30, width: 180, height: 220)
```

**Step 4**: InsightFace extracts embedding:
```
Embedding: [0.123, -0.456, 0.789, ..., 0.234]  (512 dimensions)
```

**Step 5**: Compare with enrolled faces:
```
Comparing with face-piyal-001:
  Similarity: 0.95 ✅ (Match!)

Comparing with face-other-student-002:
  Similarity: 0.23 ❌ (Not a match)

Best match: face-piyal-001 (similarity: 0.95)
```

**Step 6**: Verify with Next.js:
```
POST /api/hardware/verify
Response: {
  "verified": true,
  "eligible": true,
  "user": {
    "name": "Piyal Chakraborty",
    "studentId": "CUET-2024-XXX"
  }
}
```

**Step 7**: Result:
```
✅ User Piyal Chakraborty VERIFIED and ELIGIBLE for meal!
```

---

## Current Status

### ✅ Working:
- IR sensor detection
- Camera activation
- Video frame capture
- Frame transmission to Python
- Face detection (InsightFace)
- Face recognition (if faces enrolled)

### ❌ Not Set Up Yet:
- **Face enrollment** - You need to enroll Piyal's face first!

### To Enroll a Face:

1. **Take photo** of Piyal (or any student)
2. **Enroll via API**:
```bash
curl -X POST http://localhost:5000/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "piyal-id",
    "faceId": "face-piyal-001",
    "image": "base64-encoded-image-here"
  }'
```

3. **Now recognition will work!**

---

## Summary

**The system recognizes persons by:**
1. ✅ Detecting face in video frame (InsightFace)
2. ✅ Extracting face embedding (512-dim vector)
3. ✅ Comparing with enrolled faces (cosine similarity)
4. ✅ Finding best match (similarity > 0.6)
5. ✅ Returning recognized `faceId`
6. ✅ Verifying with database (Next.js)

**But first, you need to enroll faces!** 👤

