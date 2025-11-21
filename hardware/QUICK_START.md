# Quick Start Guide - InsightFace Face Recognition

## ✅ Installation Complete!

All necessary packages have been installed:
- ✅ InsightFace (face recognition)
- ✅ OpenCV (image processing)
- ✅ Flask (web service)
- ✅ NumPy, requests, and other dependencies

**No dlib needed!**  
**No CMake needed!**  
**No compilation needed!**

## 🚀 Run the Service

```bash
cd hardware
python face_recognition_insightface.py
```

On first run, InsightFace will download the model (~100MB) automatically.

You should see:
```
============================================================
Face Recognition Service - InsightFace
============================================================
Initializing InsightFace...
✅ InsightFace initialized successfully!

Service URL: http://0.0.0.0:5000
Next.js verification: ENABLED
...
Starting server...
```

## 📡 ESP32 Configuration

Your ESP32 code already points to Python service:

```cpp
const char* serverURL = "http://192.168.1.110:5000";  // ✅ Correct!
```

**No changes needed!**

## 🔄 System Flow

```
1. ESP32 PIR Sensor → Detects person
                      ↓
2. ESP32 Camera → Captures video frame
                  ↓
3. ESP32 → POST /api/hardware/video-stream
          (JPEG image to port 5000)
                  ↓
4. Python Service → Receives frame
                    ↓
5. InsightFace → Detects & recognizes face
                  ↓
6. Python → Compares with known faces
            ↓
7. Python → Calls Next.js API (optional)
            (http://localhost:3000/api/hardware/verify)
            ↓
8. Next.js → Checks database
              Returns: verified, eligible, user info
```

## 👤 Enroll a Face

To recognize Piyal (or any student), enroll their face:

### Method 1: Via API

```bash
curl -X POST http://localhost:5000/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "student-id-123",
    "faceId": "face-piyal-001",
    "image": "base64-encoded-image-here"
  }'
```

### Method 2: Using Python

```python
import base64
import requests

# Read image and convert to base64
with open("piyal_photo.jpg", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode()

# Enroll face
response = requests.post("http://localhost:5000/enroll", json={
    "userId": "student-id-123",
    "faceId": "face-piyal-001",
    "image": image_base64
})

print(response.json())
```

## 🧪 Test the System

### 1. Test Service Health

```bash
curl http://localhost:5000/health
```

### 2. Test with ESP32

1. **Start Python service:**
   ```bash
   python hardware/face_recognition_insightface.py
   ```

2. **Upload ESP32 code** (already configured)

3. **Trigger PIR sensor** (walk in front)

4. **Check Python console** for:
   - "🔔 Person detected: 1 person(s)"
   - "📸 Received video frame: X bytes"
   - "Found X face(s) in image"
   - "👤 Recognized: face-piyal-001 (similarity: 0.xxx)"
   - "✅ User Piyal Chakraborty VERIFIED and ELIGIBLE for meal!"

## ⚙️ Configuration

### Environment Variables (Optional)

Create `.env` file in `hardware` folder:

```env
NEXTJS_API_URL=http://192.168.1.110:3000
USE_NEXTJS_VERIFICATION=true
PORT=5000
```

### Recognition Threshold

Edit `face_recognition_insightface.py` line 28:

```python
FACE_RECOGNITION_THRESHOLD = 0.6  # Adjust sensitivity
```

- `0.5` = More permissive
- `0.6` = Balanced (recommended)
- `0.7` = More strict

## 📝 Summary

✅ **ESP32 sends video frames** → Port 5000 (Python)  
✅ **Python detects & recognizes faces** → InsightFace  
✅ **Python verifies with Next.js** → Port 3000 (optional)  
✅ **System identifies Piyal** → Creates meal record  

## 🎯 Your Use Case

**Piyal's Scenario:**
1. Piyal stands at cafeteria entrance
2. PIR sensor detects person
3. ESP32-CAM captures video
4. Python recognizes Piyal's face
5. System verifies eligibility (token/meal plan)
6. Manager sees: "Piyal Chakraborty - ELIGIBLE - APPROVE/DENY"

**System handles:**
- ✅ Identity verification (face recognition)
- ✅ Double-serving prevention (database check)
- ✅ Eligibility confirmation (token/meal plan)
- ✅ Manager approval interface
- ✅ Multiple people (2-3 simultaneously)

**Everything works!** 🎉

