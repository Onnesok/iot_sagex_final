/*
 * ESP32-CAM RFID + 0.96" OLED + Next.js API integration
 *
 * - Reads MFRC522 RFID tags through HSPI pins
 * - Shows UID + student profile on SSD1306 (128x64) OLED
 * - Calls the existing Next.js endpoint /api/hardware/verify with method ID_CARD
 * - Uses the same WiFi + API settings already used by other ESP32 sketches in this repo
 *
 * Wiring (ESP32-CAM AI-Thinker):
 *   MFRC522          ESP32-CAM
 *   -------          ----------
 *   VCC (3.3V)   ->  3V3
 *   GND          ->  GND
 *   SDA / SS     ->  GPIO 15 (HSPI_CS0)
 *   SCK          ->  GPIO 14 (HSPI_CLK)
 *   MOSI         ->  GPIO 13 (HSPI_ID)
 *   MISO         ->  GPIO 12 (HSPI_Q)
 *   RST          ->  GPIO 2  (free GPIO)
 *
 *   SSD1306 0.96" (I2C, 0x3C)
 *   -------          
 *   VCC          ->  3V3
 *   GND          ->  GND
 *   SDA          ->  GPIO 4
 *   SCL          ->  GPIO 0
 *
 * Requirements:
 *   - MFRC522 library (Library Manager)
 *   - Adafruit SSD1306 + Adafruit GFX
 *   - ArduinoJson
 */

#include <SPI.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <MFRC522.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// WiFi + API settings (same as other ESP32 sketches in repo)
const char *WIFI_SSID = "BDSET";
const char *WIFI_PASS = "Bdset@1234";
const char *NEXT_API_BASE = "http://192.168.1.110:3000";
const char *VERIFY_ENDPOINT = "/api/hardware/verify";

// RFID pins (HSPI bus)
constexpr uint8_t RFID_SS_PIN = 15;
constexpr uint8_t RFID_RST_PIN = 2;

// OLED config
constexpr uint8_t OLED_SDA_PIN = 4;
constexpr uint8_t OLED_SCL_PIN = 0;
constexpr uint8_t OLED_ADDR = 0x3C;
constexpr uint8_t SCREEN_WIDTH = 128;
constexpr uint8_t SCREEN_HEIGHT = 64;

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

struct ApiResult {
  bool success = false;
  bool eligible = false;
  String name = "Unknown";
  String studentId = "-";
  String email = "-";
  String message = "Idle";
};

// Forward declarations
void connectWiFi();
void initDisplay();
void showStatus(const String &line1, const String &line2 = "", const String &line3 = "");
String formatUid(byte *buffer, byte size, bool spaced = true);
String sanitizeUid(const String &uid);
ApiResult fetchStudentProfile(const String &uidForApi);
void showResultOnOled(const String &prettyUid, const ApiResult &result);

void setup() {
  Serial.begin(115200);
  delay(200);

  initDisplay();
  showStatus("ESP32-CAM RFID", "Booting...", "");

  SPI.begin(14, 12, 13, RFID_SS_PIN); // SCK, MISO, MOSI, SS
  rfid.PCD_Init();
  showStatus("RFID reader", "initialized", "");

  connectWiFi();
  showStatus("Scan card", "Waiting...", "");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  String uidPretty = formatUid(rfid.uid.uidByte, rfid.uid.size, true);
  String uidForApi = sanitizeUid(uidPretty);

  Serial.println("==========================");
  Serial.print("Card UID: ");
  Serial.println(uidPretty);
  showStatus("Card detected", uidPretty, "Querying API...");

  ApiResult result = fetchStudentProfile(uidForApi);
  showResultOnOled(uidPretty, result);

  Serial.print("API success: ");
  Serial.println(result.success ? "YES" : "NO");
  Serial.print("Name: ");
  Serial.println(result.name);
  Serial.print("Student ID: ");
  Serial.println(result.studentId);
  Serial.print("Eligible: ");
  Serial.println(result.eligible ? "YES" : "NO");
  Serial.print("Message: ");
  Serial.println(result.message);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(700); // Debounce between scans
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  showStatus("Connecting WiFi", WIFI_SSID, "");

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - start > 20000) {
      showStatus("WiFi timeout", "Retrying...", "");
      start = millis();
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASS);
    }
  }
  Serial.println();
  Serial.print("WiFi OK, IP: ");
  Serial.println(WiFi.localIP());
  showStatus("WiFi connected", WiFi.localIP().toString(), "");
  delay(800);
}

void initDisplay() {
  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("SSD1306 init failed");
    while (true) {
      delay(1000);
    }
  }
  display.clearDisplay();
  display.display();
}

void showStatus(const String &line1, const String &line2, const String &line3) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(line1);
  if (line2.length()) display.println(line2);
  if (line3.length()) display.println(line3);
  display.display();
}

String formatUid(byte *buffer, byte size, bool spaced) {
  String s;
  for (byte i = 0; i < size; i++) {
    if (spaced && i > 0) {
      s += ' ';
    }
    char chunk[3];
    sprintf(chunk, "%02X", buffer[i]);
    s += chunk;
  }
  return s;
}

String sanitizeUid(const String &uid) {
  String sanitized = uid;
  sanitized.replace(" ", "");
  sanitized.toUpperCase();
  return sanitized;
}

ApiResult fetchStudentProfile(const String &uidForApi) {
  ApiResult result;
  result.message = "No response";

  if (WiFi.status() != WL_CONNECTED) {
    result.message = "WiFi not connected";
    return result;
  }

  HTTPClient client;
  String url = String(NEXT_API_BASE) + VERIFY_ENDPOINT;
  if (!client.begin(url)) {
    result.message = "Invalid API URL";
    return result;
  }

  StaticJsonDocument<192> payload;
  payload["method"] = "ID_CARD";
  payload["idCardNumber"] = uidForApi;

  String body;
  serializeJson(payload, body);

  client.addHeader("Content-Type", "application/json");
  int httpCode = client.POST(body);

  if (httpCode <= 0) {
    result.message = String("HTTP error ") + httpCode;
    client.end();
    return result;
  }

  String response = client.getString();
  client.end();

  StaticJsonDocument<1024> doc;
  DeserializationError err = deserializeJson(doc, response);
  if (err) {
    result.message = "JSON parse error";
    return result;
  }

  if (doc["verified"].as<bool>()) {
    result.success = true;
    result.eligible = doc["eligible"] | false;
    JsonObject user = doc["user"];
    result.name = user["name"] | "Unknown";
    result.studentId = user["studentId"] | (const char *)user["id"];
    result.email = user["email"] | "-";
    result.message = result.eligible ? "ELIGIBLE" : (const char *)(doc["reason"] | "NOT ELIGIBLE");
  } else {
    result.message = doc["error"] | "Not verified";
  }

  return result;
}

void showResultOnOled(const String &prettyUid, const ApiResult &result) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("RFID UID:");
  display.println(prettyUid);
  display.println();
  display.println(result.name);
  display.print("ID: ");
  display.println(result.studentId);
  display.println(result.eligible ? "Meal: Eligible" : "Meal: Hold");
  display.println(result.message);
  display.display();
}

