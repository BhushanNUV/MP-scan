# Android App API Documentation

## Base URL
```
http://your-server:3000/api/mobile
```

---

## 1. LOGIN API
**Endpoint:** `POST /login`

**Purpose:** User login to get API token

**Request:**
```json
{
  "email": "device@example.com",
  "password": "device123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "user_id_here",
    "email": "device@example.com",
    "name": "Test Device User",
    "apiToken": "your_token_here",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "age": 35,
      "height": 175,
      "weight": 70,
      "gender": "male"
    },
    "patientId": "patient_id_here"
  }
}
```

---

## 2. SEND SCAN DATA API
**Endpoint:** `POST /scan`

**Headers:**
```
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

**Request:**
```json
{
  "age": 35,
  "height": 175,
  "weight": 70,
  "gender": "male",
  "heartRate": 72,
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "oxygenSaturation": 98,
  "temperature": 36.6,
  "bloodGlucose": 95,
  "respiratoryRate": 16,
  "scanConfidence": 0.95,
  "scanImage": "base64_image_or_url",
  "notes": "Scan taken after exercise"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scan data saved successfully",
  "data": {
    "scanId": "scan_id_here",
    "patientId": "patient_id_here",
    "timestamp": "2024-01-01T10:00:00Z",
    "vitals": {
      "heartRate": 72,
      "bloodPressure": "120/80",
      "oxygenSaturation": 98,
      "temperature": 36.6,
      "bloodGlucose": 95,
      "respiratoryRate": 16,
      "bmi": 22.9
    },
    "faceScanId": "face_scan_id_here"
  }
}
```

---

## 3. GET SCAN RESULTS API
**Endpoint:** `GET /results`

**Headers:**
```
Authorization: Bearer YOUR_API_TOKEN
```

**Query Parameters:**
- `scanId` (optional): Get specific scan result
- `limit` (optional): Number of results (default: 10)

**Request URL Examples:**
```
GET /results                    // Get last 10 scans
GET /results?limit=20           // Get last 20 scans
GET /results?scanId=xyz123      // Get specific scan
```

**Response (List of Scans):**
```json
{
  "success": true,
  "message": "Found 3 scan results",
  "data": [
    {
      "scanId": "scan_id_1",
      "timestamp": "2024-01-01T10:00:00Z",
      "patientName": "John Doe",
      "vitals": {
        "heartRate": 72,
        "bloodPressure": "120/80",
        "oxygenSaturation": 98,
        "temperature": 36.6,
        "bloodGlucose": 95,
        "bmi": 22.9
      },
      "scanConfidence": 0.95,
      "source": "device"
    }
  ]
}
```

**Response (Single Scan):**
```json
{
  "success": true,
  "data": {
    "scanId": "scan_id_here",
    "timestamp": "2024-01-01T10:00:00Z",
    "patient": {
      "name": "John Doe",
      "height": 175,
      "weight": 70,
      "gender": "male"
    },
    "vitals": {
      "heartRate": 72,
      "bloodPressure": "120/80",
      "oxygenSaturation": 98,
      "temperature": 36.6,
      "bloodGlucose": 95,
      "respiratoryRate": 16,
      "bmi": 22.9
    },
    "faceScan": {
      "confidence": 0.95,
      "imageUrl": "url_here",
      "createdAt": "2024-01-01T10:00:00Z"
    },
    "notes": "Scan notes",
    "source": "device"
  }
}
```

---

## TEST CREDENTIALS

**Test User Account:**
- Email: `device@example.com`
- Password: `device123`

**Admin Panel Access:**
- URL: `/admin`
- Email: `admin@example.com`
- Password: `admin123`

---

## ANDROID IMPLEMENTATION EXAMPLE

```kotlin
// 1. LOGIN
val loginUrl = "http://your-server:3000/api/mobile/login"
val loginBody = JSONObject().apply {
    put("email", "device@example.com")
    put("password", "device123")
}

// Make POST request and save the apiToken

// 2. SEND SCAN DATA
val scanUrl = "http://your-server:3000/api/mobile/scan"
val headers = mapOf("Authorization" to "Bearer $apiToken")
val scanBody = JSONObject().apply {
    put("age", userAge)
    put("height", userHeight)
    put("weight", userWeight)
    put("gender", userGender)
    put("heartRate", heartRateValue)
    put("bloodPressureSystolic", systolicValue)
    put("bloodPressureDiastolic", diastolicValue)
    put("oxygenSaturation", oxygenValue)
    put("temperature", tempValue)
    put("scanConfidence", confidenceScore)
}

// Make POST request with headers

// 3. GET RESULTS
val resultsUrl = "http://your-server:3000/api/mobile/results"
val headers = mapOf("Authorization" to "Bearer $apiToken")

// Make GET request with headers
```

---

## ERROR CODES

- **400**: Bad Request - Missing required fields
- **401**: Unauthorized - Invalid or missing token
- **404**: Not Found - Resource not found
- **500**: Server Error - Internal server error

---

## NOTES

1. Save the `apiToken` after login - use it for all other requests
2. All vitals fields are optional - send only what you have
3. The `scanImage` can be base64 encoded or a URL
4. Age, height, weight, gender update the user profile automatically
5. BMI is calculated automatically from height and weight