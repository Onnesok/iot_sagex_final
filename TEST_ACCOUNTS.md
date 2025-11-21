# Test Accounts Credentials

## 📋 Test Accounts

### Admin Account
- **Email**: `admin@cuet.ac.bd`
- **Password**: `admin123`
- **Role**: `ADMIN`

### Manager Account
- **Email**: `manager@cuet.ac.bd`
- **Password**: `manager123`
- **Role**: `MANAGER`

### Student Account
- **Email**: `student@cuet.ac.bd`
- **Password**: `student123`
- **Role**: `STUDENT`
- **Student ID**: `CUET-2024-001`

---

## 🔧 How to Create Test Accounts

### Option 1: Via Web Interface (Recommended)

1. **Create Admin Account:**
   - Go to: `http://localhost:3000/enroll`
   - Fill in:
     - Name: `Admin User`
     - Email: `admin@cuet.ac.bd`
     - Password: `admin123`
     - Confirm Password: `admin123`
   - After registration, you'll need to manually update the role to ADMIN via MongoDB Atlas or Prisma Studio

2. **Create Manager Account:**
   - Go to: `http://localhost:3000/enroll`
   - Fill in:
     - Name: `Manager User`
     - Email: `manager@cuet.ac.bd`
     - Password: `manager123`
     - Confirm Password: `manager123`
   - Update role to MANAGER via MongoDB Atlas or Prisma Studio

3. **Create Student Account:**
   - Go to: `http://localhost:3000/enroll`
   - Fill in:
     - Name: `Student User`
     - Email: `student@cuet.ac.bd`
     - Password: `student123`
     - Confirm Password: `student123`
     - Student ID: `CUET-2024-001`
   - Role will be STUDENT by default

### Option 2: Via API (Using cURL or Postman)

**Create Admin:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cuet.ac.bd",
    "password": "admin123",
    "name": "Admin User",
    "role": "ADMIN"
  }'
```

**Create Manager:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@cuet.ac.bd",
    "password": "manager123",
    "name": "Manager User",
    "role": "MANAGER"
  }'
```

**Create Student:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@cuet.ac.bd",
    "password": "student123",
    "name": "Student User",
    "studentId": "CUET-2024-001",
    "role": "STUDENT"
  }'
```

### Option 3: Via Prisma Studio

1. Run: `npx prisma studio`
2. Navigate to `User` collection
3. Click "Add record"
4. Fill in the fields for each account
5. For password, use this command to generate hash:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 12).then(hash => console.log(hash))"
   ```

### Option 4: Via MongoDB Atlas Dashboard

1. Go to MongoDB Atlas dashboard
2. Navigate to your cluster → Browse Collections
3. Select `User` collection
4. Click "Insert Document"
5. Create documents with the following structure (use hashed passwords from Option 3)

---

## ✅ Verification

After creating accounts, verify by logging in:

1. Go to: `http://localhost:3000/login`
2. Use the credentials above
3. You should be redirected to the appropriate dashboard:
   - Admin → `/admin/dashboard`
   - Manager → `/manager/dashboard`
   - Student → `/student/dashboard`

---

## 🔐 Password Hashing

If creating accounts manually, passwords must be hashed using bcrypt. Use this command:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('yourpassword', 12).then(hash => console.log(hash))"
```

**Pre-hashed passwords:**
- `admin123` → `$2a$12$ifjv8QFupuex.Yca953CZ.bNJNKAmaWKrr0BfnXTkqQnh4ubYR2G2`
- `manager123` → `$2a$12$oLo9RC4bDZN9p.foMzdf8uix3UMqKdL3rSyn96Lbv6NimiXOy9BCy`
- `student123` → `$2a$12$YX0YDg.XgOnEUfLxsg7PFedTpLFUQskmjzkjthakv3hdpksMYH2Bu`

---

## 📝 Notes

- If you encounter "account already exists" errors, the accounts may already be created
- Check MongoDB Atlas to see existing users
- You can delete existing test accounts and recreate them if needed
- The script `npm run create-accounts` attempts to create these accounts automatically

---

**Last Updated**: November 2024

