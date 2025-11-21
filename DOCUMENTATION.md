# IoT Tokenless Dining Management System – Full Technical Documentation

> **Audience**: engineers, hardware integrators, DevOps, QA, and evaluators who need a deep understanding of how the CUET dining platform is built, deployed, and operated.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Goals & Success Metrics](#2-system-goals--success-metrics)
3. [Architecture Overview](#3-architecture-overview)
4. [Core Components](#4-core-components)
5. [End-to-End Data Flow](#5-end-to-end-data-flow)
6. [Environment & Configuration](#6-environment--configuration)
7. [Software Setup Workflow](#7-software-setup-workflow)
8. [Hardware & Edge Devices](#8-hardware--edge-devices)
9. [Face Recognition Service](#9-face-recognition-service)
10. [API Integration Guide](#10-api-integration-guide)
11. [Database & Data Model](#11-database--data-model)
12. [Security Architecture](#12-security-architecture)
13. [Operations, Monitoring & Logging](#13-operations-monitoring--logging)
14. [Testing & Verification](#14-testing--verification)
15. [Deployment Playbooks](#15-deployment-playbooks)
16. [Troubleshooting Matrix](#16-troubleshooting-matrix)
17. [Roadmap & Future Enhancements](#17-roadmap--future-enhancements)

---

## 1. Executive Summary

The IoT Tokenless Dining Management System removes the physical token dependency in CUET dining halls while meeting strict anti-fraud and throughput goals. A Next.js (App Router) application orchestrates enrollment, approvals, and auditing, while ESP32-CAM hardware, RFID readers, and a Python-based InsightFace pipeline deliver field verification. MongoDB Atlas serves as the single source of truth.

---

## 2. System Goals & Success Metrics

| Goal | Measurement | Current Status |
| --- | --- | --- |
| Zero double-serving | No duplicated `MealRecord` per meal window | Enforced via unique pending meal records |
| Sub-5s verification | Time from hardware capture to manager decision | Achieved with queued approvals + real-time notifications |
| Universal accessibility | Alternate verification (face, RFID, PIN, manual) | Supported |
| Audit-ready trail | Immutable log per request | All writes persisted in `MealRecord` + manager notes |
| Easy deployment | Turn-key docs for infra, hardware, QA | README, SETUP, MONGODB, API, SOFTWARE\_* suites |

---

## 3. Architecture Overview

```
[ESP32-CAM + PIR + RFID] --HTTP--> [Next.js Hardware APIs] --Prisma--> [MongoDB Atlas]
          |                                                     ^
          v                                                     |
[Python InsightFace Service] <--REST--> [Next.js Hardware APIs]--+
          |
          v
 [Local CUDA/CPU host]
```

- **Frontend**: Next.js 13 App Router, Tailwind UI, role-based dashboards.
- **Backend**: Serverless-style API routes under `app/api/*` with Prisma for data access.
- **Database**: MongoDB Atlas cluster `sagexdb` with Prisma schema mapping collections.
- **Hardware Edge**: ESP32-CAM + PIR (person detection) + RFID + OLED for user feedback.
- **AI Service**: Python (InsightFace, ONNXRuntime) for face embedding/validation.

---

## 4. Core Components

| Layer | Location | Responsibilities |
| --- | --- | --- |
| Web App | `app/` | Enrollment, dashboards, approvals, analytics |
| API Routes | `app/api/*` | Auth, student/manager/admin services, hardware webhooks |
| Shared Libraries | `lib/` | Prisma client, JWT/session helpers, utility functions |
| Hardware Firmware | `hardware/*.ino` | Camera capture, PIR, RFID, OLED UX, REST calls |
| ML Scripts | `hardware/*.py` | Face detection, embedding, dataset curation |
| Documentation | `README.md`, `SETUP.md`, `MONGODB_SETUP.md`, `API_DOCUMENTATION.md`, `SOFTWARE_*.md`, `DOCUMENTATION.md` | Implementation guides and audit trails |

---

## 5. End-to-End Data Flow

1. **Detection**: PIR sensor trips → ESP32 boots camera and optional OLED guidance.
2. **Capture & Recognition**:
   - ESP32 sends JPEG frames to the Python InsightFace service or streams to `/api/hardware/video-stream`.
   - Service matches embeddings with registered user vectors.
3. **Verification Request**:
   - Hardware calls `/api/hardware/verify` with `method=FACE|ID_CARD|PIN`.
   - Backend validates eligibility (one meal per slot, active enrollment, no fraud flags).
   - A `MealRecord` with status `PENDING` is created.
4. **Manager Approval**:
   - Manager dashboard polls `/api/manager/pending-meals`.
   - Manager approves/denies via `/api/manager/approve-meal` (reason required if rejected).
5. **Audit & Analytics**:
   - `MealRecord` stores timestamps, verifier, approver, method, and notes.
   - Dashboards aggregate daily throughput, denial reasons, and user statistics.

---

## 6. Environment & Configuration

- Copy `.env.example` → `.env` (see `README` for base keys).
- Required variables:
  - `DATABASE_URL` – MongoDB Atlas SRV connection string.
  - `JWT_SECRET` – 32+ char random string.
  - `FACE_RECOGNITION_SERVICE_URL` – e.g. `http://localhost:5000`.
  - Optional: `PORT`, `NEXTAUTH_URL`, logging sinks.
- Secrets are consumed by both Next.js runtime and Python service; never check them into git.

---

## 7. Software Setup Workflow

High-level summary (full step-by-step in `SETUP.md`):

1. `npm install`
2. `npx prisma generate`
3. `npx prisma db push`
4. Populate seed/test data (manual, API, or Prisma Studio).
5. `npm run dev` for local development or `npm run build && npm start` for production.
6. Optional QA flows covered in `SOFTWARE_VERIFICATION.md`.

---

## 8. Hardware & Edge Devices

### Bill of Materials

- ESP32-CAM (OV2640) with IR module.
- PIR motion sensor (connected to GPIO 13).
- MFRC522 RFID reader (SPI) for student ID cards.
- SSD1306/SH1106 OLED display (I2C) for prompts.
- External microphone / speaker (optional) for audible cues.

### Firmware Entry Points

| File | Purpose |
| --- | --- |
| `hardware/esp32_cam_rfid_oled_api.ino` | Full pipeline: RFID scan + OLED + API verification |
| `hardware/esp32_cam_with_ir.ino` | Simplified camera + IR floodlight control |
| `hardware/detect_from_image.py` | Offline image verification harness |

### Networking

- Configure Wi-Fi SSID/password in firmware constants.
- Set `serverURL` to the reachable Next.js host (LAN IP or tunnel).
- Use HTTPS + client certificates for production deployments where possible.

---

## 9. Face Recognition Service

- Located under `hardware/face_recognition_insightface.py`.
- Dependencies: `insightface`, `onnxruntime`, `numpy`, `opencv-python`.
- Runbook:
  ```bash
  cd hardware
  python -m venv .venv && source .venv/bin/activate  # PowerShell: .venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  python face_recognition_insightface.py
  ```
- Outputs recognized `faceId` payloads consumed by the Next.js `/api/hardware/verify` endpoint.
- Supports enrollment ingestion from curated datasets stored in `hardware/image*.jpg` etc.

---

## 10. API Integration Guide

- **Full reference**: `API_DOCUMENTATION.md`.
- **Hardware-critical endpoints**:
  - `POST /api/hardware/person-detected`
  - `POST /api/hardware/verify`
  - `POST /api/manager/approve-meal`
- **Auth & session**:
  - JWT stored in HTTP-only cookies; APIs enforce `role` guard clauses.
  - Hardware endpoints use internal signing (e.g., shared secret header) if deployed publicly.
- Sample request/response objects are in README and API doc; reuse them when stubbing firmware.

---

## 11. Database & Data Model

- Prisma schema in `prisma/schema.prisma` defines collections: `User`, `Token`, `MealPlan`, `Enrollment`, `MealRecord`, `SystemConfig`.
- MongoDB Atlas cluster `sagexdb`, database `iot_dining`.
- Recommended indexes:
  - `MealRecord`: `{ userId: 1, requestedAt: -1 }`
  - `Enrollment`: `{ userId: 1, isActive: 1 }`
  - `User`: `{ email: 1 }` unique, `{ studentId: 1 }` sparse unique.
- Reference data (meal plans, system configs) should be seeded via scripts in `scripts/` (placeholder for future automation).

---

## 12. Security Architecture

- **AuthN/Z**: JWT tokens, role checks per route, bcrypt password hashing (12 rounds).
- **Transport**: HTTPS/TLS for public endpoints; LAN tunnels for test rigs.
- **Secrets**: stored in `.env` (local) or platform secret stores (Vercel, Railway).
- **Hardening**:
  - Rate limiting recommended on `/api/hardware/verify` to prevent brute-force PIN attempts.
  - IP allowlist for hardware endpoints when possible.
  - Regular rotation of Atlas database credentials.
- **Compliance checklist** mirrors README `Security Notes` section.

---

## 13. Operations, Monitoring & Logging

- **Application logs**: Next.js outputs to stdout; pipe to platform logging (Vercel, Docker, PM2).
- **Database monitoring**: Enable Atlas alerts for slow queries and connection saturation.
- **Hardware telemetry**: Extend firmware to send heartbeats to `/api/hardware/ping` (future enhancement).
- **Incident response**:
  1. Check `SOFTWARE_STATUS.md` for current release status.
  2. Review `MealRecord` anomalies (sudden denials, spikes).
  3. Validate network connectivity between ESP32 and API host.

---

## 14. Testing & Verification

- **Manual test plans**: `SOFTWARE_VERIFICATION.md` documents acceptance suites.
- **Status tracking**: `SOFTWARE_STATUS.md` lists known issues and release readiness.
- **Recommended automation**:
  - Jest/Playwright UI smoke tests (to be added).
  - Python unit tests for InsightFace embeddings.
  - Hardware-in-the-loop regression harness (ESP32 + mock API).

---

## 15. Deployment Playbooks

### Local Development

```
npm install
npm run dev  # http://localhost:3000
python hardware/face_recognition_insightface.py  # optional
```

### Production (Vercel example)

1. Push to GitHub.
2. Import project into Vercel.
3. Configure env vars (`DATABASE_URL`, `JWT_SECRET`, `FACE_RECOGNITION_SERVICE_URL`).
4. Add IP allowlist entries in MongoDB Atlas for Vercel egress IPs.
5. Trigger deploy; monitor logs.

### On-Prem / Edge

- Containerize Next.js (`Dockerfile` recommended).
- Use PM2 or systemd for process supervision.
- Co-locate Python service on same LAN for low latency.

---

## 16. Troubleshooting Matrix

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Hardware `HTTP 500` | Missing `FACE_RECOGNITION_SERVICE_URL` or Prisma error | Check API logs, verify env vars, re-run `npx prisma generate` |
| `Unauthorized` on dashboards | JWT cookie absent/expired | Clear cookies, ensure `JWT_SECRET` consistent across instances |
| Atlas `P1013` errors | Database not set in connection string | Append `/iot_dining` in `DATABASE_URL` |
| ESP32 stuck at boot | Incorrect Wi-Fi credentials | Update firmware constants and reflash |
| Face not recognized | Dataset missing or embeddings stale | Re-run enrollment script, restart Python service |

---

## 17. Roadmap & Future Enhancements

- **Automated provisioning**: Terraform module for Atlas + Vercel envs.
- **Edge caching**: Local whitelist stored on ESP32 for degraded mode.
- **Queue & notifications**: WebSocket channel for instant manager prompts.
- **Observability**: Structured logs + metrics (OpenTelemetry).
- **Mobile companion app**: Student self-service dashboards on Android/iOS.

---

**Last Reviewed**: November 2025  
**Maintainers**: IoT SageX CUET team  
**Contact**: See `README.md` Support section.

