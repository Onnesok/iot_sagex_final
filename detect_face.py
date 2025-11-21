"""
Detect face from image.jpg in project root
Shows window with detection boxes

Run from project root:
    python detect_face.py
"""

import cv2
import numpy as np
import insightface
import os
from pathlib import Path

# Get project root directory
project_root = Path(__file__).parent
image_path = project_root / "image.jpg"

def detect_face():
    """Detect face in image.jpg and show in window"""
    
    # Check if image exists
    if not os.path.exists(image_path):
        print(f"❌ Error: image.jpg not found at {image_path}")
        print(f"   Please make sure image.jpg exists in the project root directory")
        return
    
    print(f"📸 Loading image: {image_path}")
    
    # Read image
    image = cv2.imread(str(image_path))
    if image is None:
        print(f"❌ Error: Could not read image file")
        return
    
    print(f"✅ Image loaded: {image.shape[1]}x{image.shape[0]} pixels")
    
    # Initialize InsightFace (same as service)
    print("\n🔧 Initializing InsightFace...")
    try:
        face_analyzer = insightface.app.FaceAnalysis(
            name='buffalo_l',
            providers=['CPUExecutionProvider']
        )
        face_analyzer.prepare(ctx_id=0, det_size=(640, 640))
        print("✅ InsightFace initialized!")
    except Exception as e:
        print(f"❌ Error initializing InsightFace: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Convert BGR to RGB (same as service)
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Detect faces (same method as service)
    print("\n🔍 Detecting faces...")
    faces = face_analyzer.get(rgb_image)
    
    if len(faces) == 0:
        print("❌ No faces detected in image")
        print("\nDisplaying image anyway...")
        # Still show image
        cv2.namedWindow("Face Detection - No Faces Found", cv2.WINDOW_NORMAL)
        cv2.putText(image, "No faces detected", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        cv2.imshow("Face Detection - No Faces Found", image)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        return
    
    print(f"✅ Found {len(faces)} face(s)!\n")
    
    # Draw detection boxes (same as service)
    annotated_image = image.copy()
    
    for i, face in enumerate(faces, 1):
        # Get bounding box (same as service)
        bbox = face.bbox.astype(int)  # [x1, y1, x2, y2]
        x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
        
        # Get embedding (same as service)
        embedding = face.embedding
        
        # Draw green bounding box
        cv2.rectangle(annotated_image, (x1, y1), (x2, y2), (0, 255, 0), 3)
        
        # Draw label
        label = f"Face {i} - Detected"
        (label_width, label_height), baseline = cv2.getTextSize(
            label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2
        )
        
        # Label background
        cv2.rectangle(
            annotated_image,
            (x1, y1 - label_height - baseline - 25),
            (x1 + label_width + 10, y1),
            (0, 255, 0),
            -1
        )
        
        # Label text
        cv2.putText(
            annotated_image,
            label,
            (x1 + 5, y1 - baseline - 15),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )
        
        # Draw info text
        info_text = f"Embedding: {len(embedding)}D"
        cv2.putText(
            annotated_image,
            info_text,
            (x1 + 5, y1 - baseline + 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            1
        )
        
        # Print information
        print(f"Face {i}:")
        print(f"  📍 Position: ({x1}, {y1}) to ({x2}, {y2})")
        print(f"  📏 Size: {x2-x1} x {y2-y1} pixels")
        print(f"  🧮 Embedding: {len(embedding)} dimensions (512D vector)")
        print(f"  ✅ Status: Detected successfully")
        print()
    
    # Display image in window
    print("📺 Opening window to display detection results...")
    print("   Press any key to close the window")
    
    # Resize if too large
    display_image = annotated_image.copy()
    height, width = display_image.shape[:2]
    max_width = 1280
    max_height = 720
    
    if width > max_width or height > max_height:
        scale = min(max_width / width, max_height / height)
        new_width = int(width * scale)
        new_height = int(height * scale)
        display_image = cv2.resize(display_image, (new_width, new_height))
        print(f"   Resized for display: {new_width}x{new_height}")
    
    # Create and show window
    window_name = "Face Detection - image.jpg"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, display_image.shape[1], display_image.shape[0])
    cv2.imshow(window_name, display_image)
    
    print("\n✅ Detection complete!")
    print(f"   Total faces detected: {len(faces)}")
    
    # Save annotated image
    output_path = project_root / "image_detected.jpg"
    cv2.imwrite(str(output_path), annotated_image)
    print(f"\n💾 Saved annotated image to: {output_path}")
    
    # Wait for key press
    print("\n⏳ Press any key in the window to close...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    
    print("\n✅ Window closed. Detection complete!")

if __name__ == "__main__":
    print("=" * 60)
    print("Face Detection from image.jpg")
    print("=" * 60)
    print()
    
    detect_face()

