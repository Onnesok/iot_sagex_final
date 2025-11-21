# API Documentation - IoT Tokenless Dining Management System

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

Most endpoints require authentication via JWT token stored in HTTP-only cookies. The token is automatically set after login.

## Authentication Endpoints

### POST /api/auth/login

Login user and receive JWT token.

**Request Body:**
```json
{
  "email": "student@cuet.ac.bd",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "student@cuet.ac.bd",
    "name": "Piyal Chakraborty",
    "role": "STUDENT",
    "studentId": "CUET-2024-XXX"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Invalid credentials
- 400: Invalid input

---

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "student@cuet.ac.bd",
  "password": "password123",
  "name": "Piyal Chakraborty",
  "studentId": "CUET-2024-XXX",
  "role": "STUDENT"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "student@cuet.ac.bd",
    "name": "Piyal Chakraborty",
    "role": "STUDENT"
  }
}
```

---

### POST /api/auth/logout

Logout current user.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me

Get current authenticated user.

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "student@cuet.ac.bd",
    "name": "Piyal Chakraborty",
    "role": "STUDENT",
    "studentId": "CUET-2024-XXX",
    "faceId": "face-id-123",
    "idCardNumber": "ID-1234-5678"
  }
}
```

---

## Hardware Integration Endpoints

### POST /api/hardware/verify

**Primary endpoint for hardware verification.** This endpoint verifies user identity and checks eligibility.

**Request Body:**
```json
{
  "method": "FACE" | "ID_CARD" | "PIN",
  "faceId": "face-recognition-id",      // Required if method is FACE
  "idCardNumber": "ID-1234-5678",       // Required if method is ID_CARD
  "pin": "1234"                         // Required if method is PIN
}
```

**Response (Success):**
```json
{
  "verified": true,
  "user": {
    "id": "user-id",
    "name": "Piyal Chakraborty",
    "studentId": "CUET-2024-XXX",
    "email": "piyal@cuet.ac.bd"
  },
  "eligible": true,
  "mealRecordId": "meal-record-id",
  "tokenNumber": "TOKEN-123",
  "mealPlan": "Monthly Plan"
}
```

**Response (Already Ate Today):**
```json
{
  "verified": true,
  "user": {
    "id": "user-id",
    "name": "Piyal Chakraborty",
    "studentId": "CUET-2024-XXX",
    "email": "piyal@cuet.ac.bd"
  },
  "eligible": false,
  "reason": "Already received meal today"
}
```

**Response (Not Found):**
```json
{
  "error": "User not found",
  "verified": false
}
```

**Status Codes:**
- 200: Success (check `verified` and `eligible` fields)
- 404: User not found
- 400: Invalid input

**Usage Example:**
```python
import requests

# Face recognition verification
response = requests.post('http://localhost:3000/api/hardware/verify', json={
    'method': 'FACE',
    'faceId': 'detected-face-id-123'
})

data = response.json()
if data['verified'] and data['eligible']:
    print(f"User {data['user']['name']} is eligible for meal")
    print(f"Meal record created: {data['mealRecordId']}")
else:
    print(f"Not eligible: {data.get('reason', 'No active tokens/meal plans')}")
```

---

### POST /api/hardware/person-detected

Notify system when person(s) are detected at entrance. Used for power management and logging.

**Request Body:**
```json
{
  "count": 1,  // Number of people detected (1-3)
  "timestamp": "2024-01-15T10:30:00Z"  // Optional ISO timestamp
}
```

**Response:**
```json
{
  "success": true,
  "message": "System active - 2 person(s) detected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Usage:**
- Hardware can call this when motion sensor detects person
- System can wake up from sleep mode
- Useful for power efficiency

---

## Manager Endpoints

### GET /api/manager/pending-meals

Get all pending meal requests requiring approval.

**Response:**
```json
[
  {
    "id": "meal-record-id",
    "userId": "user-id",
    "status": "PENDING",
    "requestedAt": "2024-01-15T10:30:00Z",
    "verificationMethod": "FACE",
    "user": {
      "id": "user-id",
      "name": "Piyal Chakraborty",
      "email": "piyal@cuet.ac.bd",
      "studentId": "CUET-2024-XXX"
    },
    "token": {
      "tokenNumber": "TOKEN-123"
    },
    "enrollment": null
  }
]
```

**Authentication:** Requires MANAGER role

---

### GET /api/manager/stats

Get manager dashboard statistics.

**Response:**
```json
{
  "pending": 5,
  "todayApproved": 120,
  "todayDenied": 3
}
```

**Authentication:** Requires MANAGER role

---

### POST /api/manager/approve-meal

Approve or deny a meal request.

**Request Body:**
```json
{
  "mealId": "meal-record-id",
  "approved": true,  // or false
  "reason": "Invalid credentials"  // Required if approved is false
}
```

**Response:**
```json
{
  "success": true
}
```

**Authentication:** Requires MANAGER role

**Status Codes:**
- 200: Success
- 400: Meal already processed or invalid input
- 404: Meal record not found

---

### GET /api/manager/meals

Get all meal records with optional filter.

**Query Parameters:**
- `filter`: `ALL` | `PENDING` | `APPROVED` | `DENIED` (default: `ALL`)

**Example:**
```
GET /api/manager/meals?filter=PENDING
```

**Response:**
```json
[
  {
    "id": "meal-record-id",
    "status": "PENDING",
    "requestedAt": "2024-01-15T10:30:00Z",
    "user": { ... },
    "token": { ... },
    "enrollment": { ... }
  }
]
```

**Authentication:** Requires MANAGER role

---

## Student Endpoints

### GET /api/student/stats

Get student dashboard statistics.

**Response:**
```json
{
  "activeTokens": 3,
  "activeEnrollments": 1,
  "todayMeals": 1
}
```

**Authentication:** Requires STUDENT role

---

### GET /api/student/recent-meals

Get recent meal records for current student.

**Response:**
```json
[
  {
    "id": "meal-record-id",
    "status": "APPROVED",
    "requestedAt": "2024-01-15T10:30:00Z",
    "approvedAt": "2024-01-15T10:31:00Z",
    "completedAt": "2024-01-15T10:31:00Z",
    "verificationMethod": "FACE"
  }
]
```

**Authentication:** Requires STUDENT role

---

### POST /api/student/request-meal

Manually request a meal (alternative to hardware verification).

**Request Body:**
```json
{
  "verificationMethod": "MANUAL"
}
```

**Response:**
```json
{
  "success": true,
  "mealRecord": {
    "id": "meal-record-id",
    "status": "PENDING"
  }
}
```

**Status Codes:**
- 200: Success
- 400: Already ate today or no active tokens/meal plans

**Authentication:** Requires STUDENT role

---

### GET /api/student/tokens

Get all tokens for current student.

**Response:**
```json
[
  {
    "id": "token-id",
    "tokenNumber": "TOKEN-123",
    "status": "ACTIVE",
    "purchasedAt": "2024-01-10T00:00:00Z",
    "expiresAt": "2024-02-10T00:00:00Z"
  }
]
```

**Authentication:** Requires STUDENT role

---

### GET /api/student/enrollments

Get all meal plan enrollments for current student.

**Response:**
```json
[
  {
    "id": "enrollment-id",
    "mealsRemaining": 25,
    "isActive": true,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "mealPlan": {
      "id": "plan-id",
      "name": "Monthly Plan",
      "description": "30 meals per month",
      "price": 1500.00,
      "mealCount": 30
    }
  }
]
```

**Authentication:** Requires STUDENT role

---

## Admin Endpoints

### GET /api/admin/stats

Get admin dashboard statistics.

**Response:**
```json
{
  "totalUsers": 500,
  "totalTokens": 1200,
  "todayMeals": 450,
  "pendingApprovals": 5
}
```

**Authentication:** Requires ADMIN role

---

### GET /api/admin/users

Get all users in the system.

**Response:**
```json
[
  {
    "id": "user-id",
    "name": "Piyal Chakraborty",
    "email": "piyal@cuet.ac.bd",
    "studentId": "CUET-2024-XXX",
    "role": "STUDENT",
    "faceId": "face-id-123",
    "idCardNumber": "ID-1234-5678",
    "pin": "1234",
    "enrolledAt": "2024-01-01T00:00:00Z"
  }
]
```

**Authentication:** Requires ADMIN role

---

## User Management Endpoints

### PUT /api/users/update

Update current user's verification methods.

**Request Body:**
```json
{
  "idCardNumber": "ID-1234-5678",  // Optional
  "pin": "1234",                    // Optional
  "faceId": "face-id-123"           // Optional (usually set by system)
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "student@cuet.ac.bd",
    "name": "Piyal Chakraborty",
    "idCardNumber": "ID-1234-5678",
    "faceId": "face-id-123"
  }
}
```

**Authentication:** Required

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "details": [  // Optional, for validation errors
    {
      "path": ["field"],
      "message": "Validation error message"
    }
  ]
}
```

**Common Status Codes:**
- 200: Success
- 400: Bad Request (invalid input)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

---

## Hardware Integration Workflow

### Typical Flow:

1. **Person Detection**
   ```
   POST /api/hardware/person-detected
   → System wakes up
   ```

2. **Identity Verification**
   ```
   POST /api/hardware/verify
   → Returns user info and eligibility
   → Creates pending meal record
   ```

3. **Manager Approval** (via web interface)
   ```
   GET /api/manager/pending-meals
   → Manager sees pending request
   
   POST /api/manager/approve-meal
   → Approve or deny
   → System updates meal record
   → Token/enrollment updated
   ```

4. **Student Check Status**
   ```
   GET /api/student/recent-meals
   → Student sees meal status
   ```

---

## Rate Limiting

Currently no rate limiting implemented. For production, consider:
- Rate limiting on verification endpoints
- IP-based throttling
- Request quotas per user

---

## Security Notes

1. **JWT Tokens**: Stored in HTTP-only cookies, not accessible via JavaScript
2. **Password Hashing**: Uses bcrypt with salt rounds
3. **Input Validation**: All inputs validated with Zod schemas
4. **SQL Injection**: Protected by Prisma ORM
5. **CORS**: Configure CORS for production deployment

---

## Testing with cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@cuet.ac.bd","password":"password123"}' \
  -c cookies.txt

# Verify user (hardware)
curl -X POST http://localhost:3000/api/hardware/verify \
  -H "Content-Type: application/json" \
  -d '{"method":"PIN","pin":"1234"}'

# Get pending meals (manager)
curl -X GET http://localhost:3000/api/manager/pending-meals \
  -b cookies.txt

# Approve meal
curl -X POST http://localhost:3000/api/manager/approve-meal \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"mealId":"meal-id","approved":true}'
```

---

For more information, see README.md and SETUP.md

