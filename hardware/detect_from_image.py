"""
Detect faces from image.jpg in project root
Uses the InsightFace face recognition service

Run:
    python detect_from_image.py
"""

import cv2
import numpy as np
import insightface
import os
import sys
from pathlib import Path

# Get project root directory (parent of hardware folder)
project_root = Path(__file__).parent.parent
image_path = project_root / "image.jpg"

def detect_faces_in_image(image_path):
    """Detect and recognize faces in an image file"""
    
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
    
    # Initialize InsightFace
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
        return None
    
    # Convert BGR to RGB
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Detect faces
    print("\n🔍 Detecting faces...")
    faces = face_analyzer.get(rgb_image)
    
    if len(faces) == 0:
        print("❌ No faces detected in image")
        return None
    
    print(f"✅ Found {len(faces)} face(s) in image\n")
    
    # Process each detected face
    results = []
    annotated_image = image.copy()
    
    for i, face in enumerate(faces, 1):
        # Get bounding box
        bbox = face.bbox.astype(int)  # [x1, y1, x2, y2]
        x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
        
        # Get embedding
        embedding = face.embedding
        
        # Draw bounding box
        cv2.rectangle(annotated_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Draw label
        label = f"Face {i}"
        (label_width, label_height), baseline = cv2.getTextSize(
            label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2
        )
        
        # Label background
        cv2.rectangle(
            annotated_image,
            (x1, y1 - label_height - baseline - 10),
            (x1 + label_width + 10, y1),
            (0, 255, 0),
            -1
        )
        
        # Label text
        cv2.putText(
            annotated_image,
            label,
            (x1 + 5, y1 - baseline - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2
        )
        
        # Print face information
        print(f"Face {i}:")
        print(f"  Bounding Box: ({x1}, {y1}) to ({x2}, {y2})")
        print(f"  Size: {x2-x1}x{y2-y1} pixels")
        print(f"  Embedding dimension: {len(embedding)}")
        print()
        
        results.append({
            'face_number': i,
            'bbox': {'x': x1, 'y': y1, 'width': x2-x1, 'height': y2-y1},
            'embedding': embedding.tolist()
        })
    
    # Display image with detection boxes
    print("📺 Displaying image with detection boxes...")
    print("   Press any key to close the window")
    
    # Resize if image is too large
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
    print("\n💾 Saving annotated image to 'image_detected.jpg'...")
    
    # Save annotated image
    output_path = project_root / "image_detected.jpg"
    cv2.imwrite(str(output_path), annotated_image)
    print(f"   Saved to: {output_path}")
    
    # Wait for key press
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    
    return results

def main():
    print("=" * 60)
    print("Face Detection from image.jpg")
    print("=" * 60)
    print(f"Looking for image at: {image_path}")
    print("=" * 60)
    print()
    
    results = detect_faces_in_image(image_path)
    
    if results:
        print("\n" + "=" * 60)
        print("Detection Results Summary")
        print("=" * 60)
        print(f"Total faces detected: {len(results)}")
        print("\nFace details:")
        for result in results:
            print(f"  Face {result['face_number']}:")
            bbox = result['bbox']
            print(f"    Position: ({bbox['x']}, {bbox['y']})")
            print(f"    Size: {bbox['width']}x{bbox['height']} pixels")
            print(f"    Embedding: {len(result['embedding'])} dimensions")
        print("=" * 60)
    else:
        print("\n❌ No faces detected or error occurred")
        sys.exit(1)

if __name__ == "__main__":
    main()

