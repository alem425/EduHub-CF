# 🚀 Azure Deployment Guide

Complete guide to deploy your EDU Platform API to Azure using GitHub Actions.

## 📋 Prerequisites

- ✅ Azure account with active subscription
- ✅ GitHub account
- ✅ Your code in a GitHub repository
- ✅ Azure Cosmos DB already set up

## 🎯 Deployment Steps

### Step 1: Create Azure App Service

#### Option A: Using Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Web App"** and select it
4. Fill in the details:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing (e.g., `edu-platform-rg`)
   - **Name**: `edu-platform-api` (must be globally unique)
   - **Publish**: Code
   - **Runtime stack**: Node 18 LTS
   - **Operating System**: Linux
   - **Region**: Same as your Cosmos DB
   - **Pricing plan**: Free F1 (for testing) or Basic B1 (for production)

#### Option B: Using Azure CLI

```bash
# Create resource group
az group create --name edu-platform-rg --location eastus

# Create App Service plan
az appservice plan create \
  --name edu-platform-plan \
  --resource-group edu-platform-rg \
  --sku FREE \
  --is-linux

# Create Web App
az webapp create \
  --resource-group edu-platform-rg \
  --plan edu-platform-plan \
  --name edu-platform-api \
  --runtime "NODE|18-lts"
```

### Step 2: Configure App Service Settings

1. Navigate to your Web App in Azure Portal
2. Go to **Settings → Configuration**
3. Add these Application Settings:

| Name                    | Value                                          | Notes                      |
| ----------------------- | ---------------------------------------------- | -------------------------- |
| `COSMOS_DB_ENDPOINT`    | `https://your-cosmos.documents.azure.com:443/` | Your Cosmos DB endpoint    |
| `COSMOS_DB_KEY`         | `your-primary-key`                             | Your Cosmos DB primary key |
| `COSMOS_DB_DATABASE_ID` | `EduDB`                                        | Database name              |
| `NODE_ENV`              | `production`                                   | Environment                |
| `PORT`                  | `8080`                                         | Azure uses port 8080       |
| `JWT_SECRET`            | `your-production-jwt-secret-change-this`       | Strong secret for JWT      |
| `FRONTEND_URL`          | `https://your-frontend-domain.com`             | Your frontend URL          |

4. Click **Save**

### Step 3: Get Publish Profile

1. In your Web App, go to **Overview**
2. Click **"Download publish profile"**
3. Save the `.publishsettings` file

### Step 4: Set up GitHub Repository

1. **Push your code to GitHub:**

```bash
cd Edu
git init
git add .
git commit -m "Initial commit: EDU Platform API"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/edu-platform.git
git push -u origin main
```

2. **Add GitHub Secret:**
   - Go to your GitHub repository
   - Navigate to **Settings → Secrets and variables → Actions**
   - Click **"New repository secret"**
   - Name: `AZUREAPPSERVICE_PUBLISHPROFILE`
   - Value: Paste the entire contents of the `.publishsettings` file
   - Click **"Add secret"**

### Step 5: Update Deployment Configuration

Edit `.github/workflows/deploy-backend.yml` and update:

```yaml
env:
  AZURE_WEBAPP_NAME: your-actual-app-name # Change this to your app name
```

### Step 6: Deploy

1. **Commit and push the changes:**

```bash
git add .
git commit -m "Add Azure deployment configuration"
git push origin main
```

2. **Monitor deployment:**

   - Go to **GitHub → Your Repository → Actions**
   - Watch the deployment workflow run
   - Should see ✅ Build and Deploy steps

3. **Verify deployment:**
   - Your API will be available at: `https://your-app-name.azurewebsites.net`
   - Test health endpoint: `https://your-app-name.azurewebsites.net/health`

## 🧪 Testing Your Deployed API

### Health Check

```bash
curl https://your-app-name.azurewebsites.net/health
```

### Get Courses

```bash
curl https://your-app-name.azurewebsites.net/api/courses
```

### Create a Course

```bash
curl -X POST https://your-app-name.azurewebsites.net/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deployed Course",
    "description": "This course was created on Azure!",
    "instructorId": "instructor-azure",
    "instructorName": "Azure Teacher",
    "category": "Cloud",
    "level": "beginner",
    "duration": 20,
    "maxStudents": 50
  }'
```

## 🔍 Troubleshooting

### Common Issues

#### 1. **Build Fails**

- Check Node.js version in `package.json` matches Azure
- Ensure all dependencies are in `dependencies` (not `devDependencies`)
- Check TypeScript compilation errors

#### 2. **Deployment Succeeds but App Doesn't Start**

- Check Application Settings in Azure Portal
- Verify Cosmos DB credentials are correct
- Check logs in Azure Portal → Monitoring → Log stream

#### 3. **CORS Issues**

- Update `FRONTEND_URL` environment variable
- Check CORS configuration in `src/server.ts`

#### 4. **Database Connection Fails**

- Verify Cosmos DB endpoint and key
- Check if Cosmos DB allows connections from Azure services
- Ensure database and containers exist

### Viewing Logs

**Azure Portal:**

1. Go to your Web App
2. Navigate to **Monitoring → Log stream**
3. Watch real-time logs

**Azure CLI:**

```bash
az webapp log tail --name your-app-name --resource-group your-resource-group
```

## 🔄 Continuous Deployment

Every time you push to the `main` branch:

1. ✅ Code is automatically built
2. ✅ TypeScript is compiled
3. ✅ App is deployed to Azure
4. ✅ Your API is updated with zero downtime

## 🔒 Security Best Practices

### Environment Variables

- ✅ Never commit `.env` files
- ✅ Use Azure Key Vault for production secrets
- ✅ Rotate Cosmos DB keys regularly

### Networking

- Consider Azure Virtual Network for production
- Use Azure Application Gateway for SSL termination
- Enable Azure DDoS protection

### Monitoring

- Set up Azure Application Insights
- Configure alerts for errors and performance
- Monitor Cosmos DB metrics

## 📈 Scaling

### Horizontal Scaling

```bash
az appservice plan update --name your-plan --resource-group your-rg --number-of-workers 2
```

### Vertical Scaling

```bash
az appservice plan update --name your-plan --resource-group your-rg --sku B2
```

## 💰 Cost Optimization

### Free Tier Limitations

- 60 minutes/day runtime
- 1 GB memory
- No custom domains
- No SSL certificates

### Recommended for Production

- **Basic B1**: $13/month, always on, custom domains
- **Standard S1**: $56/month, autoscaling, SSL certificates
- **Premium P1v2**: $73/month, better performance

Your API is now deployed and accessible worldwide! 🌍
