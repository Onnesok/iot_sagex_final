# InsightFace Setup - Easy Installation

## Why InsightFace?

✅ **No dlib needed** - Easy to install  
✅ **No CMake needed** - No compilation  
✅ **Better accuracy** - State-of-the-art face recognition  
✅ **Works with Python 3.13** - No compatibility issues  
✅ **Smaller dependencies** - Just pip install

## Installation

### Step 1: Install InsightFace and dependencies

```bash
cd hardware
pip install insightface onnxruntime opencv-python flask requests numpy
```

That's it! InsightFace will automatically download models on first run.

### Step 2: Run the service

```bash
python face_recognition_insightface.py
```

On first run, InsightFace will download the model (~100MB) automatically.

## How It Works

### ESP32 → Python Service Flow

1. **ESP32 detects person** (PIR sensor)
   - Calls: `POST /api/hardware/person-detected`

2. **ESP32 sends video frames**
   - Calls: `POST /api/hardware/video-stream` (JPEG image)

3. **Python processes frame**
   - InsightFace detects faces
   - Extracts 512-dimensional embeddings
   - Compares with known faces (cosine similarity)

4. **Recognizes person**
   - Returns: `faceId`, `confidence`, `boundingBox`

5. **Verifies with Next.js** (optional)
   - Calls Next.js API for database check
   - Returns: verified, eligible, user info

## Enrolling Faces

### Method 1: Enroll via API

```bash
curl -X POST http://localhost:5000/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "faceId": "face-user123-001",
    "image": "base64-encoded-image-here"
  }'
```

### Method 2: Load from Database

If face embeddings are already in database:

```bash
curl -X POST http://localhost:5000/load-face \
  -H "Content-Type: application/json" \
  -d '{
    "faceId": "face-user123-001",
    "embedding": [0.123, 0.456, ...]  # 512 floats
  }'
```

## Configuration

### Environment Variables

```bash
# Next.js API URL (for database verification)
NEXTJS_API_URL=http://192.168.1.110:3000

# Enable/disable Next.js verification
USE_NEXTJS_VERIFICATION=true  # or false

# Service port
PORT=5000
```

### Recognition Threshold

Edit `face_recognition_insightface.py`:

```python
FACE_RECOGNITION_THRESHOLD = 0.6  # Lower = more strict (0.0 - 1.0)
```

- `0.5` = More permissive (more false positives)
- `0.6` = Balanced (recommended)
- `0.7` = More strict (more false negatives)

## ESP32 Configuration

Your ESP32 already points to Python service:

```cpp
const char* serverURL = "http://192.168.1.110:5000";
```

No changes needed! ✅

## Testing

### 1. Test Service Health

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Face Recognition Service (InsightFace)",
  "known_faces": 0,
  "insightface_loaded": true
}
```

### 2. Test with ESP32

1. Start Python service: `python face_recognition_insightface.py`
2. Upload ESP32 code
3. Trigger PIR sensor
4. Check Python console for:
   - "Person detected: X person(s)"
   - "Received video frame: X bytes"
   - "Found X face(s) in image"
   - "Recognized face: face-id (similarity: 0.xxx)"

## Troubleshooting

### Model Download Fails

If model download fails, download manually:

1. Download model from: https://github.com/deepinsight/insightface/releases
2. Extract to `~/.insightface/models/buffalo_l/`
3. Restart service

### Recognition Not Working

1. **Enroll faces first** using `/enroll` endpoint
2. **Check threshold** - might be too high
3. **Ensure good lighting** in images
4. **Multiple angles** - enroll face from different angles

### Service Won't Start

1. Check all dependencies installed:
   ```bash
   python -c "import insightface; import cv2; print('OK')"
   ```
2. Check port 5000 is available
3. Check firewall allows connections

## Advantages Over face_recognition Library

| Feature | face_recognition | InsightFace |
|---------|-----------------|-------------|
| Installation | Needs dlib + CMake | Just pip install |
| Accuracy | Good | Excellent |
| Speed | Fast | Very Fast |
| Model Size | ~60MB | ~100MB |
| Python 3.13 | Issues | Works |
| Embedding Size | 128-dim | 512-dim |

## Next Steps

1. **Install dependencies:** `pip install insightface onnxruntime`
2. **Run service:** `python face_recognition_insightface.py`
3. **Enroll faces** using `/enroll` endpoint
4. **Test with ESP32** - upload code and test!

Your system is ready! 🎉

