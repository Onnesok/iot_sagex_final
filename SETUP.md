# Setup Guide - IoT Tokenless Dining Management System

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account (M0 cluster is free)

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose the free M0 tier
   - Select your preferred cloud provider and region
   - Give your cluster a name (e.g., "iot-dining-cluster")

3. **Create Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password
   - Set user privileges to "Read and write to any database"
   - Click "Add User"

4. **Whitelist IP Address**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, add specific IP addresses
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name (e.g., "iot_dining")

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# MongoDB Atlas Connection String
# Format: mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/iot_dining?retryWrites=true&w=majority"

# JWT Secret Key (minimum 32 characters)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
```

**Important**: 
- Replace `username`, `password`, `cluster`, and `database_name` with your actual MongoDB Atlas credentials
- Change the JWT_SECRET to a strong random string in production!

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to MongoDB (MongoDB doesn't use migrations, uses db push)
npx prisma db push

# (Optional) Open Prisma Studio to view/edit data
npx prisma studio
```

**Note**: MongoDB doesn't use traditional migrations. Use `prisma db push` to sync your schema.

### 5. Create Admin User

You can create an admin user through the enrollment page or directly via Prisma Studio:

```bash
npx prisma studio
```

Then navigate to the User table and create a user with:
- email: admin@cuet.ac.bd
- password: (will be hashed automatically)
- role: ADMIN
- name: Admin User

Or use the API:

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

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Accounts

After setup, you can create accounts for testing:

### Admin Account
- Email: admin@cuet.ac.bd
- Password: (set during registration)
- Role: ADMIN

### Manager Account
- Email: manager@cuet.ac.bd
- Password: (set during registration)
- Role: MANAGER

### Student Account
- Email: student@cuet.ac.bd
- Password: (set during registration)
- Role: STUDENT

## Testing the System

### 1. Student Enrollment
1. Go to `/enroll`
2. Fill in student details
3. Complete enrollment

### 2. Request a Meal
1. Login as student
2. Go to Student Dashboard
3. Click "Request Meal"
4. Wait for manager approval

### 3. Manager Approval
1. Login as manager
2. View pending requests on dashboard
3. Click APPROVE or DENY
4. System updates automatically

### 4. Hardware Integration Testing

Test the hardware API endpoints:

```bash
# Verify user by face ID
curl -X POST http://localhost:3000/api/hardware/verify \
  -H "Content-Type: application/json" \
  -d '{
    "method": "FACE",
    "faceId": "face-id-123"
  }'

# Verify user by ID card
curl -X POST http://localhost:3000/api/hardware/verify \
  -H "Content-Type: application/json" \
  -d '{
    "method": "ID_CARD",
    "idCardNumber": "ID-1234-5678"
  }'

# Verify user by PIN
curl -X POST http://localhost:3000/api/hardware/verify \
  -H "Content-Type: application/json" \
  -d '{
    "method": "PIN",
    "pin": "1234"
  }'

# Person detection
curl -X POST http://localhost:3000/api/hardware/person-detected \
  -H "Content-Type: application/json" \
  -d '{
    "count": 2,
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

## Production Deployment

### 1. Update Environment Variables

```env
# Use your production MongoDB Atlas connection string
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/iot_dining?retryWrites=true&w=majority"
JWT_SECRET="strong-random-secret-minimum-32-characters"
NODE_ENV="production"
```

**Important for Production:**
- Use a dedicated database user with limited permissions
- Whitelist only your production server IP addresses
- Use a strong, unique JWT_SECRET
- Enable MongoDB Atlas monitoring and alerts

### 2. Build the Application

```bash
npm run build
```

### 3. Start Production Server

```bash
npm start
```

### 4. Database Schema Sync (Production)

```bash
# MongoDB uses db push, not migrations
npx prisma db push
```

**Note**: For MongoDB, schema changes are applied immediately with `db push`. There are no migration files to deploy.

## Troubleshooting

### Database Issues

If you encounter database errors:
1. Verify your MongoDB Atlas connection string is correct
2. Check that your IP address is whitelisted in MongoDB Atlas
3. Ensure your database user has read/write permissions
4. Try regenerating Prisma Client: `npx prisma generate`
5. Verify network connectivity to MongoDB Atlas
6. Check MongoDB Atlas cluster status in the dashboard

### Authentication Issues

If login doesn't work:
1. Check JWT_SECRET is set in `.env`
2. Clear browser cookies
3. Try registering a new account

### Port Already in Use

If port 3000 is busy:
```bash
# Use a different port
PORT=3001 npm run dev
```

## Next Steps

1. **Integrate Hardware**: Connect face recognition, ID card reader, and sensors
2. **Configure Meal Plans**: Set up meal plans in admin panel
3. **Create Tokens**: Issue dining tokens to students
4. **Train Staff**: Ensure managers understand the approval system
5. **Monitor**: Use admin dashboard to monitor system usage

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review API endpoints in `/app/api`
3. Check database schema in `prisma/schema.prisma`

