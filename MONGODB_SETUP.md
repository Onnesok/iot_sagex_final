# MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas for the IoT Tokenless Dining Management System.

## Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" or "Sign Up"
3. Fill in your details and create an account
4. Verify your email address

## Step 2: Create a Cluster

1. After logging in, you'll see the Atlas dashboard
2. Click **"Build a Database"** button
3. Choose **"M0" (Free)** tier
4. Select your preferred cloud provider:
   - AWS (recommended)
   - Google Cloud
   - Azure
5. Choose a region closest to you (for better performance)
6. Give your cluster a name (e.g., `iot-dining-cluster`)
7. Click **"Create"**

**Note**: Cluster creation takes 3-5 minutes. Wait for it to finish.

## Step 3: Create Database User

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Enter a username (e.g., `dining_admin`)
5. Click **"Autogenerate Secure Password"** or create your own strong password
6. **IMPORTANT**: Copy and save this password! You'll need it for the connection string.
7. Under "Database User Privileges", select **"Read and write to any database"**
8. Click **"Add User"**

## Step 4: Configure Network Access

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. For **development/testing**:
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Click **"Confirm"**
4. For **production**:
   - Click **"Add Current IP Address"** or enter specific IP addresses
   - Only allow your production server IPs for security
   - Click **"Confirm"**

**Security Note**: Allowing access from anywhere (0.0.0.0/0) is fine for development but should be restricted in production.

## Step 5: Get Connection String

1. In the left sidebar, click **"Database"**
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver
5. Copy the connection string (it looks like this):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Configure Connection String

1. Replace `<username>` with your database username (from Step 3)
2. Replace `<password>` with your database password (from Step 3)
3. Add your database name after the `.net/` part:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/iot_dining?retryWrites=true&w=majority
   ```

**Example:**
```
mongodb+srv://dining_admin:MySecurePassword123@iot-dining-cluster.xxxxx.mongodb.net/iot_dining?retryWrites=true&w=majority
```

## Step 7: Add to .env File

Create a `.env` file in your project root (or update existing one):

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/iot_dining?retryWrites=true&w=majority"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
```

## Step 8: Test Connection

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

3. Push schema to MongoDB:
   ```bash
   npx prisma db push
   ```

4. If successful, you should see:
   ```
   ✅ Your Prisma schema was pushed to the database
   ```

5. (Optional) Open Prisma Studio to verify:
   ```bash
   npx prisma studio
   ```

## Troubleshooting

### Connection Timeout
- **Issue**: Cannot connect to MongoDB Atlas
- **Solution**: 
  - Check that your IP address is whitelisted in Network Access
  - Verify your connection string is correct
  - Ensure your cluster is running (check Atlas dashboard)

### Authentication Failed
- **Issue**: Authentication error when connecting
- **Solution**:
  - Verify username and password in connection string
  - Make sure password doesn't contain special characters that need URL encoding
  - If password has special characters, URL encode them (e.g., `@` becomes `%40`)

### Database Not Found
- **Issue**: Database doesn't exist
- **Solution**:
  - MongoDB Atlas creates databases automatically when you first write to them
  - Run `npx prisma db push` to create collections
  - The database name in your connection string will be created automatically

### Prisma Schema Push Fails
- **Issue**: `prisma db push` fails
- **Solution**:
  - Check your connection string format
  - Verify network access is configured
  - Ensure Prisma Client is generated: `npx prisma generate`
  - Check MongoDB Atlas cluster status

## MongoDB Atlas Free Tier Limits

The M0 (Free) tier includes:
- **512 MB storage** (enough for development and small production)
- **Shared RAM and vCPU**
- **No backup** (consider upgrading for production)
- **Basic monitoring**

For production, consider upgrading to M10 or higher for:
- More storage
- Better performance
- Automated backups
- Advanced monitoring

## Security Best Practices

1. **Use Strong Passwords**: Generate secure passwords for database users
2. **Restrict IP Access**: In production, only allow specific IP addresses
3. **Use Environment Variables**: Never commit connection strings to git
4. **Rotate Passwords**: Regularly update database user passwords
5. **Enable Monitoring**: Set up alerts in MongoDB Atlas dashboard
6. **Use Connection String with SSL**: MongoDB Atlas uses SSL by default (mongodb+srv://)

## Next Steps

After MongoDB Atlas is configured:

1. ✅ Connection string added to `.env`
2. ✅ Run `npx prisma generate`
3. ✅ Run `npx prisma db push`
4. ✅ Start your development server: `npm run dev`
5. ✅ Create your first admin user via the enrollment page

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Prisma MongoDB Guide](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [MongoDB Connection String Format](https://docs.mongodb.com/manual/reference/connection-string/)

---

**Need Help?** Check the main [SETUP.md](./SETUP.md) file or review the [README.md](./README.md) for more information.

