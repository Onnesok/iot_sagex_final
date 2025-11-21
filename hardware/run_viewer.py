"""
Simple script to run the video viewer
"""

from video_viewer import VideoViewer
import sys

if __name__ == "__main__":
    # Get service URL from command line or use default
    service_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    
    print("=" * 60)
    print("ESP32-CAM Face Recognition Video Viewer")
    print("=" * 60)
    print(f"Service URL: {service_url}")
    print("\nInstructions:")
    print("  - Make sure Python face recognition service is running")
    print("  - Make sure ESP32 is sending video frames")
    print("  - Press 'q' to quit")
    print("=" * 60)
    print()
    
    viewer = VideoViewer(service_url)
    viewer.run()

