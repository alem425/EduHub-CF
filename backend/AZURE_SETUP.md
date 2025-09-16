# Azure Cosmos DB Setup Guide

## 1. Create Azure Cosmos DB Account

### Using Azure Portal:

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Azure Cosmos DB" and select it
4. Click "Create"
5. Fill in the details:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Account Name**: Choose a unique name (e.g., `edu-cosmosdb-[your-initials]`)
   - **API**: Select "Core (SQL)"
   - **Location**: Choose closest to your users
   - **Capacity mode**: Start with "Provisioned throughput"
   - **Apply Free Tier Discount**: Yes (if available)
   - **Limit total account throughput**: Yes (for cost control)

### Using Azure CLI:

```bash
# Create resource group
az group create --name edu-rg --location eastus

# Create Cosmos DB account
az cosmosdb create \
  --name edu-cosmosdb \
  --resource-group edu-rg \
  --locations regionName=eastus \
  --default-consistency-level Session \
  --enable-free-tier true
```

## 2. Get Connection Details

1. Navigate to your Cosmos DB account in Azure Portal
2. Go to "Keys" section
3. Copy the following values:
   - **URI** (Primary endpoint)
   - **PRIMARY KEY**

## 3. Configure Environment Variables

1. Create `.env` file in your backend folder:

```env
COSMOS_DB_ENDPOINT=https://your-account-name.documents.azure.com:443/
COSMOS_DB_KEY=your-primary-key-here
COSMOS_DB_DATABASE_ID=EduDB
```

## 4. Database Structure

The application will automatically create:

- **Database**: `EduDB`
- **Containers**:
  - `courses` (partition key: `/id`)
  - `enrollments` (partition key: `/courseId`)
  - `users` (partition key: `/id`)

## 5. Cost Optimization

### Free Tier Benefits:

- First 1000 RU/s provisioned throughput
- First 25 GB storage
- Perfect for development and small production workloads

### Scaling Options:

- **Development**: 400 RU/s per container
- **Production**: Start with 1000 RU/s, scale based on usage
- **Serverless**: Pay per request (good for unpredictable workloads)

## 6. Security Best Practices

1. **Use Environment Variables**: Never commit keys to source control
2. **Rotate Keys Regularly**: Use Azure Key Vault for production
3. **Network Security**: Configure firewall rules if needed
4. **RBAC**: Use Azure AD authentication for production
