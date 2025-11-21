# Video Viewer - See Live Detection

## Overview

The video viewer displays live video feed from ESP32-CAM with face detection boxes and recognition results overlaid on the video.

## Features

✅ **Live Video Display** - Shows real-time frames from ESP32-CAM  
✅ **Face Detection Boxes** - Draws bounding boxes around detected faces  
✅ **Recognition Results** - Shows face ID, confidence, and user name  
✅ **Status Colors**:
- 🟢 **Green** - Recognized and eligible
- 🟠 **Orange** - Recognized but not eligible
- 🔵 **Cyan** - Recognized but not verified
- 🔴 **Red** - Detected but not recognized

## Requirements

Already installed:
- ✅ OpenCV (`pip install opencv-python`)
- ✅ NumPy (`pip install numpy`)
- ✅ Requests (`pip install requests`)

## Running the Viewer

### Step 1: Start Python Face Recognition Service

```bash
cd hardware
python face_recognition_insightface.py
```

Service will run on port 5000.

### Step 2: Start Video Viewer (in another terminal)

```bash
cd hardware
python video_viewer.py
```

Or use the helper script:

```bash
python run_viewer.py
```

### Step 3: Make sure ESP32 is running

- ESP32 should be connected and sending video frames
- IR sensor should detect person
- Camera should be streaming

## How It Works

1. **ESP32** → Sends video frames to Python service
2. **Python Service** → Processes frames, stores latest frame
3. **Video Viewer** → Requests latest frame from service
4. **Viewer** → Draws detection boxes and displays video

## Window Controls

- **'q' key** - Quit the viewer
- **Resize** - Window is resizable

## What You'll See

### Info Panel (Top)
- Timestamp
- Number of faces detected
- Number of faces recognized
- Instructions

### Detection Boxes
Each detected face shows:
- **Bounding Box** - Colored rectangle around face
- **Label** - Face ID or user name + confidence score
- **Status** - ELIGIBLE, NOT ELIGIBLE, RECOGNIZED, or DETECTED

### Example Display

```
┌─────────────────────────────────────────┐
│ ESP32-CAM Face Recognition | 2024-01-15 │
│ Faces Detected: 1 | Recognized: 1      │
│ Press 'q' to quit                       │
├─────────────────────────────────────────┤
│                                         │
│    ┌─────────┐                         │
│    │         │                         │
│    │  FACE   │                         │
│    │         │                         │
│    └─────────┘                         │
│    Piyal (face-piyal-001) | 0.95      │
│    ELIGIBLE                            │
│                                         │
└─────────────────────────────────────────┘
```

## Troubleshooting

### No video showing

1. **Check Python service is running:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Check ESP32 is sending frames:**
   - Look at Python service console for "Received video frame" messages

3. **Check service URL:**
   - Default: `http://localhost:5000`
   - If service is on different IP, run:
     ```bash
     python video_viewer.py http://192.168.1.110:5000
     ```

### No detection boxes

- Make sure faces are in the camera view
- Check if face recognition service is detecting faces (check console)
- Make sure faces are enrolled for recognition

### Window not responding

- Press 'q' to quit
- Close window manually
- Restart viewer

## Notes

- Viewer requests frames every 100ms (10 FPS)
- Frames are stored in Python service memory
- Only latest frame is shown (not buffered video stream)
- Detection results are synchronized with frames

## Advanced Usage

### Custom Service URL

```bash
python video_viewer.py http://your-server-ip:5000
```

### Modify Update Rate

Edit `video_viewer.py` line 81:
```python
time.sleep(0.1)  # Change to 0.05 for 20 FPS, 0.2 for 5 FPS
```

### Change Window Size

Edit `video_viewer.py` line 18:
```python
cv2.resizeWindow(self.window_name, 1280, 720)  # Full HD
```

## Integration

The viewer is separate from the main system:
- Doesn't affect face recognition
- Doesn't affect database verification
- Only for visualization

Perfect for:
- Testing and debugging
- Demonstrations
- Monitoring detection quality

