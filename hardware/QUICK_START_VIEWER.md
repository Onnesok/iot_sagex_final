# Quick Start - Video Viewer

## Run the Video Viewer

### Step 1: Start Python Face Recognition Service

Open terminal 1:
```bash
cd hardware
python face_recognition_insightface.py
```

Wait for: `✅ InsightFace initialized successfully!`

### Step 2: Start Video Viewer (Open New Terminal)

Open terminal 2:
```bash
cd hardware
python video_viewer.py
```

Or use the helper script:
```bash
python run_viewer.py
```

### Step 3: Make sure ESP32 is Running

- ESP32 should be connected and sending video frames
- IR sensor should detect person when someone stands in front
- Camera should be streaming

## What You'll See

### Window Display

```
┌─────────────────────────────────────────┐
│ ESP32-CAM Face Recognition | 2024-01-15 │
│ Faces Detected: 1 | Recognized: 1      │
│ Press 'q' to quit                       │
├─────────────────────────────────────────┤
│                                         │
│         ┌─────────┐                    │
│         │         │                    │
│         │  FACE   │  ← Detection Box   │
│         │         │                    │
│         └─────────┘                    │
│    Piyal (face-piyal-001) | 0.95      │ ← Label
│    ELIGIBLE                            │ ← Status
│                                         │
└─────────────────────────────────────────┘
```

### Box Colors

- 🟢 **Green Box** = Recognized and eligible
- 🟠 **Orange Box** = Recognized but not eligible
- 🔵 **Cyan Box** = Recognized but not verified
- 🔴 **Red Box** = Detected but not recognized

## Controls

- **'q' key** - Quit the viewer
- **Window resize** - Drag corners to resize

## Troubleshooting

### "Waiting for video stream..."

- Make sure Python service is running (terminal 1)
- Check ESP32 is sending frames (check service console)
- Verify ESP32 server URL is correct

### No detection boxes

- Make sure faces are enrolled (use `/enroll` endpoint)
- Check if faces are detected (look at service console)
- Ensure good lighting

### Window not opening

- Make sure OpenCV is installed: `pip install opencv-python`
- Check if another window with same name is already open

## Testing Without ESP32

You can test with a test image:

```bash
# Enroll a face first
curl -X POST http://localhost:5000/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "faceId": "face-test-001",
    "image": "base64-encoded-image"
  }'
```

Then send a test frame to see if it works!

