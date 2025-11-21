"""
Face Recognition Service using InsightFace
Receives video frames from ESP32-CAM and recognizes persons

Run:
    python face_recognition_insightface.py
"""

from flask import Flask, request, jsonify
import cv2
import insightface
import numpy as np
import requests
import os
from datetime import datetime
import onnxruntime as ort
import threading
import base64
import logging

app = Flask(__name__)
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# Initialize InsightFace
face_analyzer = None
known_face_embeddings = {}  # Dictionary: face_id -> embedding array

# Store latest frame and detection results for video viewer
latest_frame_buffer = None
latest_detection_results = []
frame_lock = threading.Lock()
latest_annotated_image = None

# OpenCV window for real-time display
SHOW_WINDOW = True
window_name = "ESP32-CAM Face Recognition - Live Feed"
window_initialized = False
window_thread_running = False

# Configuration
NEXTJS_API_URL = os.getenv('NEXTJS_API_URL', 'http://localhost:3000')
USE_NEXTJS_VERIFICATION = os.getenv('USE_NEXTJS_VERIFICATION', 'true').lower() == 'true'
FACE_RECOGNITION_THRESHOLD = 0.35  # Lower = more strict (0.35 is more lenient for video)
IMAGE_JPG_PATH = os.path.join(os.path.dirname(__file__), 'image.jpg')  # hardware/image.jpg

def initialize_insightface():
    """Initialize InsightFace model"""
    global face_analyzer
    try:
        face_analyzer = insightface.app.FaceAnalysis(
            name='buffalo_l',
            providers=['CPUExecutionProvider']
        )
        face_analyzer.prepare(ctx_id=0, det_size=(640, 640))
        return True
    except Exception as e:
        import traceback
        traceback.print_exc()
        return False

def load_enrolled_faces_from_database():
    """Load enrolled faces from Next.js database via API"""
    global known_face_embeddings
    
    if face_analyzer is None:
        return False
    
    if not USE_NEXTJS_VERIFICATION:
        return False
    
    try:
        # Call Next.js API to get all enrolled students with photos
        response = requests.get(
            f'{NEXTJS_API_URL}/api/hardware/enrolled-faces',
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"Failed to load enrolled faces: HTTP {response.status_code}")
            return False
        
        students = response.json()
        loaded_count = 0
        
        for student in students:
            student_id = student.get('id')
            face_id = student.get('faceId')
            photo_url = student.get('photo')  # Base64 string
            
            if not photo_url:
                continue
            
            # Generate faceId if it doesn't exist (use student.id as base)
            if not face_id:
                face_id = f"face-{student_id}"
            
            try:
                # Decode base64 image (photos are stored as data:image/jpeg;base64,{base64})
                if photo_url.startswith('data:image'):
                    # Base64 encoded image with header
                    header, encoded = photo_url.split(',', 1)
                    image_data = base64.b64decode(encoded)
                else:
                    # Assume base64 without header
                    image_data = base64.b64decode(photo_url)
                
                # Convert to numpy array and decode
                nparr = np.frombuffer(image_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if image is None:
                    continue
                
                # Convert BGR to RGB
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
                # Detect faces
                faces = face_analyzer.get(rgb_image)
                
                if len(faces) == 0:
                    continue
                
                # Get embedding from first face
                face = faces[0]
                embedding = face.embedding
                
                # Store with face_id (use existing faceId or generated one)
                known_face_embeddings[face_id] = embedding
                loaded_count += 1
                
                # Update faceId in database if it was generated
                if not student.get('faceId'):
                    try:
                        requests.put(
                            f'{NEXTJS_API_URL}/api/hardware/update-face-id',
                            json={
                                'studentId': student_id,
                                'faceId': face_id
                            },
                            timeout=5
                        )
                    except:
                        pass  # Non-critical
                
            except Exception as e:
                # Skip this student if there's an error
                continue
        
        print(f"Loaded {loaded_count} enrolled face(s) from database")
        return loaded_count > 0
        
    except Exception as e:
        print(f"Error loading enrolled faces: {e}")
        import traceback
        traceback.print_exc()
        return False

def load_face_from_image_jpg():
    """Load face embedding from image.jpg in project root (fallback)"""
    global known_face_embeddings
    
    if face_analyzer is None:
        return False
    
    try:
        # Check if image.jpg exists
        if not os.path.exists(IMAGE_JPG_PATH):
            return False
        
        # Read and process image
        image = cv2.imread(IMAGE_JPG_PATH)
        if image is None:
            return False
        
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detect faces
        faces = face_analyzer.get(rgb_image)
        
        if len(faces) == 0:
            return False
        
        # Get embedding from first face
        face = faces[0]
        embedding = face.embedding
        
        # Store with face_id "enrolled_user"
        face_id = "enrolled_user"
        known_face_embeddings[face_id] = embedding
        
        print(f"Face loaded from image.jpg (embedding size: {len(embedding)})")
        return True
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return False

def detect_and_recognize_faces(image_buffer):
    """
    Detect and recognize faces in an image buffer using InsightFace
    
    Args:
        image_buffer: JPEG image bytes
        
    Returns:
        List of detected faces with recognition results
    """
    try:
        # Convert buffer to numpy array
        nparr = np.frombuffer(image_buffer, np.uint8)
        
        # Decode image
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            return []
        
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detect faces and extract embeddings
        faces = face_analyzer.get(rgb_image)
        
        if len(faces) == 0:
            print("person not detected")
            return []
        
        # Print detection count
        if len(faces) == 1:
            print("person detected")
        else:
            print(f"{len(faces)} persons detected")
        
        results = []
        
        for i, face in enumerate(faces):
            # Get face embedding (512-dimensional vector)
            embedding = face.embedding
            
            # Get bounding box
            bbox = face.bbox.astype(int)  # [x1, y1, x2, y2]
            
            # Recognize face by comparing with known embeddings
            face_id = None
            confidence = 0.0
            
            if len(known_face_embeddings) > 0:
                # Calculate cosine similarity with known faces
                best_match_id = None
                best_match_score = 0.0
                
                for known_id, known_embedding in known_face_embeddings.items():
                    # Cosine similarity
                    similarity = np.dot(embedding, known_embedding) / (
                        np.linalg.norm(embedding) * np.linalg.norm(known_embedding)
                    )
                    
                    if similarity > best_match_score:
                        best_match_score = similarity
                        best_match_id = known_id
                
                # If similarity is above threshold, it's a match
                if best_match_score > FACE_RECOGNITION_THRESHOLD:
                    face_id = best_match_id
                    confidence = float(best_match_score)
                    if len(faces) == 1:
                        print(f"recognized (similarity: {best_match_score:.3f})")
                    else:
                        print(f"person {i+1}: recognized (similarity: {best_match_score:.3f})")
                else:
                    if len(faces) == 1:
                        print(f"not recognized (similarity: {best_match_score:.3f}, threshold: {FACE_RECOGNITION_THRESHOLD})")
                    else:
                        print(f"person {i+1}: not recognized (similarity: {best_match_score:.3f}, threshold: {FACE_RECOGNITION_THRESHOLD})")
            else:
                if len(faces) == 1:
                    print("not recognized")
                else:
                    print(f"person {i+1}: not recognized")
            
            results.append({
                'faceId': face_id,
                'confidence': confidence,
                'boundingBox': {
                    'x': int(bbox[0]),
                    'y': int(bbox[1]),
                    'width': int(bbox[2] - bbox[0]),
                    'height': int(bbox[3] - bbox[1])
                },
                'embedding': embedding.tolist()  # Include for enrollment
            })
        
        return results
        
    except Exception as e:
        print(f"Error detecting faces: {e}")
        import traceback
        traceback.print_exc()
        return []

def draw_detection_boxes_on_image(image, face_detections, recognition_results):
    """Draw detection boxes and labels on image"""
    annotated_image = image.copy()
    
    # Create a map of face_id to recognition result for easy lookup
    results_map = {}
    for result in recognition_results:
        face_id = result.get('faceId')
        if face_id:
            results_map[face_id] = result
    
    # Draw boxes for each detected face
    for i, face_det in enumerate(face_detections):
        bbox = face_det.get('boundingBox', {})
        x = bbox.get('x', 0)
        y = bbox.get('y', 0)
        width = bbox.get('width', 0)
        height = bbox.get('height', 0)
        
        if width == 0 or height == 0:
            continue
        
        face_id = face_det.get('faceId')
        confidence = face_det.get('confidence', 0.0)
        
        # Get recognition result if available
        result = results_map.get(face_id) if face_id else None
        
        # Determine color and status based on recognition and eligibility
        if face_id and confidence > FACE_RECOGNITION_THRESHOLD:
            # Check eligibility from verification result
            if result and result.get('eligible'):
                color = (0, 255, 0)  # Green - eligible
                status_text = "ELIGIBLE"
            elif result and result.get('verified'):
                color = (0, 165, 255)  # Orange - recognized but not eligible
                status_text = "NOT ELIGIBLE"
            else:
                color = (255, 255, 0)  # Cyan - recognized but not verified
                status_text = "RECOGNIZED"
        else:
            color = (0, 0, 255)  # Red - not recognized
            status_text = "NOT RECOGNIZED"
        
        # Draw bounding box (thicker line)
        cv2.rectangle(annotated_image, (x, y), (x + width, y + height), color, 3)
        
        # Draw status text at top of box
        (text_width, text_height), baseline = cv2.getTextSize(
            status_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2
        )
        
        # Background for text
        cv2.rectangle(
            annotated_image,
            (x, y - text_height - baseline - 10),
            (x + text_width + 10, y),
            color,
            -1
        )
        
        # Status text
        cv2.putText(
            annotated_image,
            status_text,
            (x + 5, y - baseline - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2
        )
        
        # Show confidence if recognized
        if face_id and confidence > FACE_RECOGNITION_THRESHOLD:
            conf_text = f"{confidence:.2f}"
            (conf_width, conf_height), _ = cv2.getTextSize(
                conf_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            cv2.rectangle(
                annotated_image,
                (x, y + height),
                (x + conf_width + 10, y + height + conf_height + 10),
                color,
                -1
            )
            cv2.putText(
                annotated_image,
                conf_text,
                (x + 5, y + height + conf_height + 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1
            )
    
    return annotated_image

def window_display_thread():
    """Background thread to keep OpenCV window alive and update display"""
    global window_initialized, window_thread_running, latest_annotated_image
    
    if not SHOW_WINDOW:
        return
    
    window_thread_running = True
    
    try:
        # Initialize window
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_name, 640, 480)
        window_initialized = True
        
        while window_thread_running:
            try:
                with frame_lock:
                    display_image = latest_annotated_image
                
                if display_image is not None:
                    # Resize if image is too large for display
                    height, width = display_image.shape[:2]
                    max_width = 1280
                    max_height = 720
                    
                    if width > max_width or height > max_height:
                        scale = min(max_width / width, max_height / height)
                        new_width = int(width * scale)
                        new_height = int(height * scale)
                        resized_image = cv2.resize(display_image, (new_width, new_height))
                    else:
                        resized_image = display_image.copy()
                    
                    # Display image
                    cv2.imshow(window_name, resized_image)
                else:
                    # Show blank window if no frame yet
                    blank = np.zeros((480, 640, 3), dtype=np.uint8)
                    cv2.putText(blank, "Waiting for video feed...", (50, 240),
                               cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                    cv2.imshow(window_name, blank)
                
                # Process window events (must be called regularly)
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                    
                # Small delay to prevent excessive CPU usage
                threading.Event().wait(0.033)  # ~30 FPS
                
            except cv2.error:
                break
            except Exception:
                pass
                
    except Exception:
        pass
    finally:
        try:
            cv2.destroyWindow(window_name)
        except:
            pass
        window_initialized = False
        window_thread_running = False

def show_image_in_window(image):
    """Store annotated image for window display thread"""
    global latest_annotated_image
    
    if not SHOW_WINDOW:
        return
    
    # Store the annotated image for the display thread
    with frame_lock:
        latest_annotated_image = image.copy()

def verify_user_with_nextjs(face_id):
    """Call Next.js API only for database verification"""
    if not USE_NEXTJS_VERIFICATION:
        return None
        
    try:
        verify_response = requests.post(
            f'{NEXTJS_API_URL}/api/hardware/verify',
            json={
                'method': 'FACE',
                'faceId': face_id
            },
            timeout=5
        )
        
        if verify_response.status_code == 200:
            return verify_response.json()
        else:
            return None
            
    except requests.exceptions.RequestException as e:
        return None

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'Face Recognition Service (InsightFace)',
        'known_faces': len(known_face_embeddings),
        'nextjs_verification': USE_NEXTJS_VERIFICATION,
        'insightface_loaded': face_analyzer is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/hardware/person-detected', methods=['POST'])
def person_detected():
    """ESP32 notifies when person is detected by PIR sensor"""
    try:
        data = request.json or {}
        count = data.get('count', 1)
        timestamp = data.get('timestamp', datetime.now().isoformat())
        
        
        return jsonify({
            'success': True,
            'message': f'Person detection received: {count} person(s)',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        print(f"[Error] /api/hardware/person-detected: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/hardware/video-stream', methods=['POST'])
def video_stream():
    """
    Main endpoint for ESP32 to send video frames
    Python does everything:
    1. Receives video frame (JPEG image)
    2. Detects faces using InsightFace
    3. Recognizes persons
    4. Verifies with Next.js (optional - only for database check)
    """
    try:
        if face_analyzer is None:
            return jsonify({
                'error': 'Face recognition model not initialized'
            }), 500
        
        # Get image from request
        image_buffer = request.data
        
        if not image_buffer:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode image to verify it's valid
        nparr = np.frombuffer(image_buffer, np.uint8)
        display_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if display_image is None:
            return jsonify({'error': 'Failed to decode image'}), 400
        
        # Store latest frame for video viewer
        with frame_lock:
            global latest_frame_buffer, latest_detection_results
            latest_frame_buffer = image_buffer
        
        # Detect and recognize faces
        faces = detect_and_recognize_faces(image_buffer)
        
        if len(faces) == 0:
            # Still show image even if no faces
            if SHOW_WINDOW and display_image is not None:
                cv2.putText(
                    display_image,
                    "No faces detected",
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 0, 255),
                    2
                )
                show_image_in_window(display_image)
            
            return jsonify({
                'success': True,
                'message': 'Frame received - no faces detected',
                'faces_detected': 0,
                'faces_recognized': 0,
                'timestamp': datetime.now().isoformat()
            })
        
        # Process each detected face
        results = []
        for face in faces:
            face_id = face.get('faceId')
            confidence = face.get('confidence', 0.0)
            
            # Remove embedding from response (too large)
            face.pop('embedding', None)
            
            # Verify user with Next.js if recognized
            verification_result = None
            is_verified = False
            is_eligible = False
            user_info = {}
            reason = ''
            
            if face_id and confidence > FACE_RECOGNITION_THRESHOLD:
                # Verify user with Next.js to check eligibility
                if USE_NEXTJS_VERIFICATION:
                    verification_result = verify_user_with_nextjs(face_id)
                
                if verification_result:
                    user_info = verification_result.get('user', {})
                    is_verified = verification_result.get('verified', False)
                    is_eligible = verification_result.get('eligible', False)
                    reason = verification_result.get('reason', '')
                else:
                    # Face recognized but verification failed
                    is_verified = False
                    is_eligible = False
                    reason = 'Verification unavailable'
            
            results.append({
                'faceId': face_id,
                'confidence': confidence,
                'verified': is_verified,
                'eligible': is_eligible,
                'user': user_info,
                'message': reason
            })
        
        # Store latest detection results
        with frame_lock:
            latest_detection_results = results.copy()
        
        # Draw detection boxes and display in window
        if SHOW_WINDOW and display_image is not None:
            display_image = draw_detection_boxes_on_image(display_image, faces, results)
            show_image_in_window(display_image)
        
        # Return response to ESP32
        return jsonify({
            'success': True,
            'message': 'Frame processed successfully',
            'faces_detected': len(faces),
            'faces_recognized': len([r for r in results if r.get('faceId')]),
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/enroll', methods=['POST'])
def enroll_face():
    """
    Enroll a new face for recognition
    
    Request:
        - Content-Type: application/json
        - Body: {
            "userId": "user-id",
            "faceId": "face-id-to-store-in-db",
            "image": "base64-encoded-jpeg-image"
          }
    """
    try:
        if face_analyzer is None:
            return jsonify({'error': 'Face recognition model not initialized'}), 500
        
        data = request.json
        user_id = data.get('userId')
        face_id = data.get('faceId')  # Face ID to store in database
        image_base64 = data.get('image')
        
        if not user_id or not image_base64:
            return jsonify({'error': 'userId and image required'}), 400
        
        # Decode base64 image
        import base64
        image_buffer = base64.b64decode(image_base64)
        
        # Get face encoding using InsightFace
        nparr = np.frombuffer(image_buffer, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        faces = face_analyzer.get(rgb_image)
        
        if len(faces) == 0:
            return jsonify({'error': 'No face detected in image'}), 400
        
        if len(faces) > 1:
            return jsonify({'error': 'Multiple faces detected. Please provide image with single face.'}), 400
        
        # Use the first face found
        face = faces[0]
        embedding = face.embedding
        
        # Generate face ID if not provided
        if not face_id:
            face_id = f"face-{user_id}-{int(datetime.now().timestamp())}"
        
        # Store embedding
        known_face_embeddings[face_id] = embedding
        
        print(f"[Enroll] ✓ Face enrolled: {face_id} (Total: {len(known_face_embeddings)})")
        
        # Optional: Update Next.js database
        if USE_NEXTJS_VERIFICATION:
            try:
                requests.post(f'{NEXTJS_API_URL}/api/admin/update-face-id', json={
                    'userId': user_id,
                    'faceId': face_id
                }, timeout=5)
            except Exception as e:
                print(f"[Warning] Next.js update failed: {e}")
        
        return jsonify({
            'success': True,
            'faceId': face_id,
            'message': 'Face enrolled successfully'
        })
        
    except Exception as e:
        print(f"[Error] /enroll: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/frames/latest', methods=['GET'])
def get_latest_frame():
    """Get latest frame with detection results for video viewer"""
    try:
        with frame_lock:
            frame_buf = latest_frame_buffer
            detections = latest_detection_results.copy() if latest_detection_results else []
        
        if frame_buf is None:
            return jsonify({
                'frame': None,
                'detections': [],
                'message': 'No frames received yet'
            })
        
        # Encode frame as base64
        frame_base64 = base64.b64encode(frame_buf).decode('utf-8')
        
        return jsonify({
            'frame': frame_base64,
            'detections': detections,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        print(f"[Error] /api/frames/latest: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/load-face', methods=['POST'])
def load_face():
    """
    Load a face embedding for recognition (alternative to /enroll)
    Useful when face is already enrolled in database
    
    Request:
        {
            "faceId": "face-id-from-database",
            "embedding": [list of 512 floats]
        }
    """
    try:
        data = request.json
        face_id = data.get('faceId')
        embedding = data.get('embedding')
        
        if not face_id or not embedding:
            return jsonify({'error': 'faceId and embedding required'}), 400
        
        # Store embedding
        known_face_embeddings[face_id] = np.array(embedding)
        
        print(f"[Load] ✓ Face loaded: {face_id} (Total: {len(known_face_embeddings)})")
        
        return jsonify({
            'success': True,
            'message': 'Face loaded successfully'
        })
    except Exception as e:
        print(f"[Error] /load-face: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize InsightFace
    if not initialize_insightface():
        exit(1)
    
    # Load enrolled faces from database first, fallback to image.jpg
    if not load_enrolled_faces_from_database():
        # Fallback to image.jpg if database loading fails
        load_face_from_image_jpg()
    
    # Start window display thread if enabled
    if SHOW_WINDOW:
        window_thread = threading.Thread(target=window_display_thread, daemon=True)
        window_thread.start()
    
    # Run Flask app
    port = int(os.getenv('PORT', 5000))
    
    try:
        app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False, threaded=True)
    except KeyboardInterrupt:
        print("\nShutting down...")
        if SHOW_WINDOW:
            window_thread_running = False
            try:
                cv2.destroyAllWindows()
            except:
                pass

