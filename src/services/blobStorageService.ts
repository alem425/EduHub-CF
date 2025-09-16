import { BlobServiceClient, ContainerClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

export interface UploadResult {
  id: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  uploadUrl: string;
  uploadedAt: Date;
}

export interface FileValidationOptions {
  maxFileSize?: number; // in bytes, default 10MB
  allowedMimeTypes?: string[]; // default: common document and image types
  maxFiles?: number; // default: 5
}

export class BlobStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;
  private accountName: string;
  private accountKey: string;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'edu-attachments';
    
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is required');
    }

    // Extract account name and key from connection string for SAS generation
    const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
    const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);
    
    if (!accountNameMatch || !accountKeyMatch) {
      throw new Error('Invalid Azure Storage connection string format');
    }
    
    this.accountName = accountNameMatch[1];
    this.accountKey = accountKeyMatch[1];
    
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
  }

  /**
   * Initialize the blob storage container
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔧 Initializing blob storage container...');
      
      // Create container if it doesn't exist
      await this.containerClient.createIfNotExists();
      
      console.log(`✅ Blob storage container '${this.containerName}' ready`);
    } catch (error) {
      console.error('❌ Error initializing blob storage:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(
    file: Express.Multer.File, 
    options: FileValidationOptions = {}
  ): { isValid: boolean; error?: string } {
    const {
      maxFileSize = 10 * 1024 * 1024, // 10MB default
      allowedMimeTypes = [
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        // Code files
        'text/javascript',
        'text/typescript',
        'text/html',
        'text/css',
        'application/json'
      ]
    } = options;

    // Check file size
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxFileSize / 1024 / 1024).toFixed(2)}MB)`
      };
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `File type '${file.mimetype}' is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Upload a single file to blob storage
   */
  async uploadFile(
    file: Express.Multer.File,
    folderPath: string = 'general',
    options: FileValidationOptions = {}
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, options);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Generate unique filename
      const fileExtension = file.originalname.split('.').pop() || '';
      const uniqueId = uuidv4();
      const filename = `${uniqueId}.${fileExtension}`;
      const blobName = `${folderPath}/${filename}`;

      console.log(`📤 Uploading file: ${file.originalname} as ${blobName}`);

      // Get blob client
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Upload file with metadata
      const uploadResponse = await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
          blobContentDisposition: `attachment; filename="${file.originalname}"`
        },
        metadata: {
          originalFilename: file.originalname,
          uploadedAt: new Date().toISOString(),
          fileId: uniqueId
        }
      });

      console.log(`✅ File uploaded successfully: ${blobName}`);

      // Generate download URL (we'll create SAS URLs on demand for security)
      const uploadUrl = blockBlobClient.url;

      return {
        id: uniqueId,
        filename: filename,
        originalFilename: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadUrl: uploadUrl,
        uploadedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folderPath: string = 'general',
    options: FileValidationOptions = {}
  ): Promise<UploadResult[]> {
    const { maxFiles = 5 } = options;

    // Validate number of files
    if (files.length > maxFiles) {
      throw new Error(`Too many files. Maximum allowed: ${maxFiles}, received: ${files.length}`);
    }

    const uploadPromises = files.map(file => this.uploadFile(file, folderPath, options));
    
    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('❌ Error uploading multiple files:', error);
      throw error;
    }
  }

  /**
   * Generate a temporary download URL with SAS token (secure access)
   */
  async generateDownloadUrl(
    blobName: string,
    expiresInMinutes: number = 60
  ): Promise<string> {
    try {
      const sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey);
      
      // Set SAS permissions and expiry
      const sasOptions = {
        containerName: this.containerName,
        blobName: blobName,
        permissions: BlobSASPermissions.parse('r'), // Read only
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      };

      // Generate SAS token
      const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
      
      // Return full URL with SAS token
      const blobUrl = `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${blobName}?${sasToken}`;
      
      return blobUrl;
    } catch (error) {
      console.error('❌ Error generating download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Delete a file from blob storage
   */
  async deleteFile(blobName: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting file: ${blobName}`);
      
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      
      console.log(`✅ File deleted successfully: ${blobName}`);
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(blobNames: string[]): Promise<void> {
    const deletePromises = blobNames.map(blobName => this.deleteFile(blobName));
    
    try {
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('❌ Error deleting multiple files:', error);
      throw error;
    }
  }

  /**
   * Check if a file exists in blob storage
   */
  async fileExists(blobName: string): Promise<boolean> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      return await blockBlobClient.exists();
    } catch (error) {
      console.error('❌ Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(blobName: string): Promise<any> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const properties = await blockBlobClient.getProperties();
      
      return {
        filename: blobName,
        contentLength: properties.contentLength,
        contentType: properties.contentType,
        lastModified: properties.lastModified,
        metadata: properties.metadata
      };
    } catch (error) {
      console.error('❌ Error getting file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }

  /**
   * Generate folder paths for different types of attachments
   */
  static generateFolderPath(type: 'assignment' | 'submission', courseId: string, id: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    switch (type) {
      case 'assignment':
        return `assignments/${year}/${month}/${courseId}/${id}`;
      case 'submission':
        return `submissions/${year}/${month}/${courseId}/${id}`;
      default:
        return `general/${year}/${month}`;
    }
  }
}

// Export singleton instance
export const blobStorageService = new BlobStorageService();
