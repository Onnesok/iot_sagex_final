"""
Detect faces from image.jpg in project root
Uses the same InsightFace detection as face_recognition_insightface.py

Run from project root:
    python detect_face_from_image.py
"""

import cv2
import numpy as np
import insightface
import os
from pathlib import Path

# Get project root directory (where this script is located)
project_root = Path(__file__).parent
image_path = project_root / "image.jpg"

def detect_faces_using_insightface(image_path):
    """Detect faces in an image using InsightFace (same as service)"""
    
    # Check if image exists
    if not os.path.exists(image_path):
        print(f"❌ Error: Image not found at {image_path}")
        print(f"   Please make sure image.jpg exists in the project root directory")
        return None
    
    print(f"📸 Loading image: {image_path}")
    
    # Read image
    image = cv2.imread(str(image_path))
    if image is None:
        print(f"❌ Error: Could not read image file")
        return None
    
    print(f"✅ Image loaded successfully: {image.shape[1]}x{image.shape[0]} pixels")
    
    # Initialize InsightFace (same as service)
    print("\n🔧 Initializing InsightFace...")
    try:
        face_analyzer = insightface.app.FaceAnalysis(
            name='buffalo_l',
            providers=['CPUExecutionProvider']
        )
        face_analyzer.prepare(ctx_id=0, det_size=(640, 640))
        print("✅ InsightFace initialized successfully!")
    except Exception as e:
        print(f"❌ Error initializing InsightFace: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    # Convert BGR to RGB (same as service)
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Detect faces using InsightFace (same method as service)
    print("\n🔍 Detecting faces using InsightFace...")
    faces = face_analyzer.get(rgb_image)
    
    if len(faces) == 0:
        print("❌ No faces detected in image")
        print("   Make sure:")
        print("   - Image contains clear face(s)")
        print("   - Face is visible and not too dark")
        print("   - Face is facing camera")
        return None
    
    print(f"✅ Found {len(faces)} face(s) in image\n")
    
    # Process each detected face (same as service)
    results = []
    annotated_image = image.copy()
    
    for i, face in enumerate(faces, 1):
        # Get bounding box (same as service)
        bbox = face.bbox.astype(int)  # [x1, y1, x2, y2]
        x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
        
        # Get face embedding (512-dimensional vector, same as service)
        embedding = face.embedding
        
        # Draw bounding box (green for detected)
        cv2.rectangle(annotated_image, (x1, y1), (x2, y2), (0, 255, 0), 3)
        
        # Draw label with face number
        label = f"Face {i} - Detected"
        confidence_label = f"Embedding: {len(embedding)}D"
        
        # Get text size for positioning
        (label_width, label_height), baseline = cv2.getTextSize(
            label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2
        )
        
        # Draw label background
        cv2.rectangle(
            annotated_image,
            (x1, y1 - label_height - baseline - 25),
            (x1 + label_width + 10, y1),
            (0, 255, 0),
            -1
        )
        
        # Draw label text
        cv2.putText(
            annotated_image,
            label,
            (x1 + 5, y1 - baseline - 15),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )
        
        # Draw confidence/info text
        cv2.putText(
            annotated_image,
            confidence_label,
            (x1 + 5, y1 - baseline + 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            1
        )
        
        # Print face information
        print(f"Face {i}:")
        print(f"  📍 Position: ({x1}, {y1}) to ({x2}, {y2})")
        print(f"  📏 Size: {x2-x1} x {y2-y1} pixels")
        print(f"  🧮 Embedding: {len(embedding)} dimensions (512D vector)")
        print(f"  ✅ Detection Confidence: Face detected successfully")
        print()
        
        results.append({
            'face_number': i,
            'bbox': {
                'x': int(x1),
                'y': int(y1),
                'width': int(x2 - x1),
                'height': int(y2 - y1)
            },
            'embedding_size': len(embedding),
            'embedding_sample': embedding[:5].tolist()  # First 5 values as sample
        })
    
    # Display image with detection boxes
    print("📺 Displaying image with detection boxes...")
    print("   Press any key to close the window")
    
    # Resize if image is too large for display
    display_image = annotated_image.copy()
    height, width = display_image.shape[:2]
    
    # Resize to fit screen if too large
    max_width = 1280
    max_height = 720
    
    if width > max_width or height > max_height:
        scale = min(max_width / width, max_height / height)
        new_width = int(width * scale)
        new_height = int(height * scale)
        display_image = cv2.resize(display_image, (new_width, new_height))
        print(f"   Resized for display: {new_width}x{new_height}")
    
    # Create window and display
    window_name = "Face Detection - image.jpg"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, display_image.shape[1], display_image.shape[0])
    cv2.imshow(window_name, display_image)
    
    print("\n✅ Detection complete!")
    print(f"   Total faces detected: {len(faces)}")
    
    # Save annotated image
    print("\n💾 Saving annotated image...")
    output_path = project_root / "image_detected.jpg"
    cv2.imwrite(str(output_path), annotated_image)
    print(f"   Saved to: {output_path}")
    
    # Wait for key press
    print("\n⏳ Waiting for key press to close window...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    
    return results

def main():
    print("=" * 60)
    print("Face Detection from image.jpg")
    print("Using InsightFace (same as face_recognition_insightface.py)")
    print("=" * 60)
    print(f"Image path: {image_path}")
    print("=" * 60)
    print()
    
    results = detect_faces_using_insightface(image_path)
    
    if results:
        print("\n" + "=" * 60)
        print("Detection Results Summary")
        print("=" * 60)
        print(f"✅ Total faces detected: {len(results)}")
        print("\nFace details:")
        for result in results:
            bbox = result['bbox']
            print(f"\n  Face {result['face_number']}:")
            print(f"    Position: ({bbox['x']}, {bbox['y']})")
            print(f"    Size: {bbox['width']} x {bbox['height']} pixels")
            print(f"    Embedding: {result['embedding_size']}D vector")
            print(f"    Sample embedding values: {result['embedding_sample']}")
        
        print("\n" + "=" * 60)
        print("✅ Face detection completed successfully!")
        print("=" * 60)
    else:
        print("\n❌ No faces detected or error occurred")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())

