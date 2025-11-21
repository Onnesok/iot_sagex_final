"""
Video Viewer with Face Detection Boxes
Displays live video feed from ESP32-CAM with face detection and recognition results

Run:
    python video_viewer.py
"""

import cv2
import numpy as np
import requests
import json
from datetime import datetime
import threading
import time

class VideoViewer:
    def __init__(self, service_url="http://localhost:5000"):
        self.service_url = service_url
        self.window_name = "ESP32-CAM Face Recognition"
        self.running = False
        self.current_frame = None
        self.latest_results = None
        self.frame_lock = threading.Lock()
        
        # Create window
        cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(self.window_name, 640, 480)
        
        print("Video Viewer initialized")
        print("Press 'q' to quit")
        
    def fetch_frame(self):
        """Fetch latest frame from service"""
        try:
            # Get frames from Python service
            # Note: You may need to modify the service to store and serve frames
            response = requests.get(f"{self.service_url}/api/frames/latest", timeout=1)
            if response.status_code == 200:
                data = response.json()
                if data.get('frame'):
                    # Decode base64 frame
                    import base64
                    frame_data = base64.b64decode(data['frame'])
                    nparr = np.frombuffer(frame_data, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    return frame, data.get('detections', [])
        except:
            pass
        return None, []
    
    def draw_detection_boxes(self, frame, detections):
        """Draw face detection boxes and labels on frame"""
        if not detections:
            return frame
        
        for detection in detections:
            bbox = detection.get('boundingBox', {})
            face_id = detection.get('faceId', 'Unknown')
            confidence = detection.get('confidence', 0.0)
            verified = detection.get('verified', False)
            eligible = detection.get('eligible', False)
            user_name = detection.get('user', {}).get('name', '')
            
            # Get bounding box coordinates
            x = bbox.get('x', 0)
            y = bbox.get('y', 0)
            width = bbox.get('width', 0)
            height = bbox.get('height', 0)
            
            if width == 0 or height == 0:
                continue
            
            # Determine color based on recognition status
            if verified and eligible:
                color = (0, 255, 0)  # Green - recognized and eligible
                status_text = "ELIGIBLE"
            elif verified and not eligible:
                color = (0, 165, 255)  # Orange - recognized but not eligible
                status_text = "NOT ELIGIBLE"
            elif face_id:
                color = (255, 255, 0)  # Cyan - recognized but not verified
                status_text = "RECOGNIZED"
            else:
                color = (255, 0, 0)  # Red - detected but not recognized
                status_text = "DETECTED"
            
            # Draw bounding box
            cv2.rectangle(frame, (x, y), (x + width, y + height), color, 2)
            
            # Prepare label text
            if user_name:
                label = f"{user_name} ({face_id})" if face_id else user_name
            elif face_id:
                label = face_id
            else:
                label = "Unknown"
            
            # Add confidence score
            label += f" | {confidence:.2f}"
            
            # Draw label background
            (label_width, label_height), baseline = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            cv2.rectangle(
                frame,
                (x, y - label_height - baseline - 10),
                (x + label_width, y),
                color,
                -1
            )
            
            # Draw label text
            cv2.putText(
                frame,
                label,
                (x, y - baseline - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1
            )
            
            # Draw status
            (status_width, status_height), _ = cv2.getTextSize(
                status_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
            )
            cv2.rectangle(
                frame,
                (x, y + height),
                (x + status_width + 10, y + height + status_height + 10),
                color,
                -1
            )
            cv2.putText(
                frame,
                status_text,
                (x + 5, y + height + status_height + 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2
            )
        
        return frame
    
    def display_info(self, frame, detections):
        """Display information overlay on frame"""
        # Draw info panel
        info_height = 80
        overlay = frame.copy()
        cv2.rectangle(
            overlay,
            (0, 0),
            (frame.shape[1], info_height),
            (0, 0, 0),
            -1
        )
        frame = cv2.addWeighted(overlay, 0.6, frame, 0.4, 0)
        
        # Info text
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        faces_detected = len(detections)
        faces_recognized = len([d for d in detections if d.get('faceId')])
        
        info_lines = [
            f"ESP32-CAM Face Recognition | {timestamp}",
            f"Faces Detected: {faces_detected} | Recognized: {faces_recognized}",
            "Press 'q' to quit"
        ]
        
        for i, line in enumerate(info_lines):
            cv2.putText(
                frame,
                line,
                (10, 20 + i * 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                1
            )
        
        return frame
    
    def update_frame(self):
        """Update frame in separate thread"""
        while self.running:
            frame, detections = self.fetch_frame()
            if frame is not None:
                with self.frame_lock:
                    self.current_frame = frame.copy()
                    self.latest_results = detections
            time.sleep(0.1)  # Update every 100ms
    
    def run(self):
        """Main loop to display video"""
        self.running = True
        
        # Start frame update thread
        update_thread = threading.Thread(target=self.update_frame, daemon=True)
        update_thread.start()
        
        print("Starting video viewer...")
        print("Waiting for video frames from ESP32...")
        
        while self.running:
            # Get latest frame and results
            frame = None
            detections = []
            
            with self.frame_lock:
                if self.current_frame is not None:
                    frame = self.current_frame.copy()
                    detections = self.latest_results.copy() if self.latest_results else []
            
            if frame is not None:
                # Draw detection boxes
                frame = self.draw_detection_boxes(frame, detections)
                
                # Draw info overlay
                frame = self.display_info(frame, detections)
                
                # Display frame
                cv2.imshow(self.window_name, frame)
            else:
                # Show waiting message
                waiting_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(
                    waiting_frame,
                    "Waiting for video stream...",
                    (150, 230),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (255, 255, 255),
                    2
                )
                cv2.putText(
                    waiting_frame,
                    "Make sure ESP32 is sending frames",
                    (120, 270),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (200, 200, 200),
                    1
                )
                cv2.imshow(self.window_name, waiting_frame)
            
            # Check for quit
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                print("Quitting...")
                self.running = False
                break
        
        cv2.destroyAllWindows()
        print("Video viewer closed")

def main():
    import sys
    
    # Get service URL from command line or use default
    service_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    
    viewer = VideoViewer(service_url)
    viewer.run()

if __name__ == "__main__":
    main()

