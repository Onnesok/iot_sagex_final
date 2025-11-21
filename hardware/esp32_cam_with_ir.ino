/*
 * ESP32-CAM with Infrared Sensor
 * 
 * This code implements:
 * 1. Infrared sensor (IR) detection for person presence
 * 2. Conditional ESP32-CAM activation based on detection
 * 3. Video streaming only when person is detected
 * 4. HTTP streaming to server endpoint
 * 
 * Hardware Connections:
 * - IR Sensor: GPIO 13 (you can change this)
 *   - IR sensor typically: LOW = object detected, HIGH = no object
 *   - Uses INPUT_PULLUP mode
 * - ESP32-CAM: Standard connections (no additional pins needed)
 * 
 * WiFi Configuration:
 * - Update SSID and PASSWORD below
 * - Update SERVER_URL to your server address
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

// WiFi Configuration
const char* ssid = "BDSET";
const char* password = "Bdset@1234";
const char* serverURL = "http://192.168.1.110:5000";  // Python face recognition service

// IR Sensor Pin
// IR sensor typically: LOW when object detected, HIGH when no object
#define IR_SENSOR_PIN 13

// Camera Configuration (for ESP32-CAM AI-Thinker)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// State variables
bool personDetected = false;
bool lastDetectionState = false;
bool cameraActive = false;
unsigned long lastDetectionTime = 0;
unsigned long lastFrameTime = 0;
const unsigned long DETECTION_TIMEOUT = 5000; // Stop streaming after 5 seconds of no detection
const unsigned long FRAME_INTERVAL = 100; // Send frame every 100ms (10 FPS)

HTTPClient http;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Initialize IR sensor
  pinMode(IR_SENSOR_PIN, INPUT_PULLUP);  // Enable internal pull-up resistor
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected. IP address: ");
  Serial.println(WiFi.localIP());
  
  // Initialize camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Adjust frame size for better performance
  config.frame_size = FRAMESIZE_QVGA; // 320x240 - smaller for faster processing
  config.jpeg_quality = 12; // Lower quality = smaller file size = faster transfer
  config.fb_count = 1;
  
  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }
  
  Serial.println("Camera initialized successfully");
  Serial.println("System ready - waiting for person detection...");
}

void loop() {
  // Read IR sensor
  // IR sensor typically: LOW = object detected, HIGH = no object
  // Using INPUT_PULLUP, so LOW means object detected
  personDetected = digitalRead(IR_SENSOR_PIN) == LOW;
  
  // Handle detection state changes
  if (personDetected && !lastDetectionState) {
    // Person just detected
    Serial.println("Person detected! Activating camera...");
    lastDetectionTime = millis();
    cameraActive = true;
    
    // Notify server
    notifyPersonDetected();
  } else if (!personDetected && lastDetectionState) {
    // Person left
    Serial.println("Person left. Deactivating camera...");
    cameraActive = false;
  } else if (personDetected && cameraActive) {
    // Update last detection time
    lastDetectionTime = millis();
    
    // Check timeout (stop streaming if no detection for timeout period)
    if (millis() - lastDetectionTime > DETECTION_TIMEOUT) {
      Serial.println("Detection timeout. Stopping stream...");
      cameraActive = false;
    } else {
      // Send video frame if interval has passed
      if (millis() - lastFrameTime >= FRAME_INTERVAL) {
        sendVideoFrame();
        lastFrameTime = millis();
      }
    }
  }
  
  lastDetectionState = personDetected;
  delay(10); // Small delay to prevent excessive CPU usage
}

void notifyPersonDetected() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot notify server.");
    return;
  }
  
  String url = String(serverURL) + "/api/hardware/person-detected";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  String jsonPayload = "{\"count\":1,\"timestamp\":\"" + String(millis()) + "\"}";
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    Serial.print("Person detection notification sent. Response code: ");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.println(response);
  } else {
    Serial.print("Error sending notification: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void sendVideoFrame() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  // Capture frame
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }
  
  // Send frame to server
  String url = String(serverURL) + "/api/hardware/video-stream";
  
  http.begin(url);
  http.addHeader("Content-Type", "image/jpeg");
  
  int httpResponseCode = http.POST((uint8_t *)fb->buf, fb->len);
  
  if (httpResponseCode == 200 || httpResponseCode == 201) {
    // Success - frame sent
    Serial.print("Frame sent. Size: ");
    Serial.print(fb->len);
    Serial.println(" bytes");
  } else {
    Serial.print("Error sending frame: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
  
  // Return the frame buffer back to the driver for reuse
  esp_camera_fb_return(fb);
}

