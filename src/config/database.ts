import { CosmosClient, Database, Container } from '@azure/cosmos';
import { blobStorageService } from '../services/blobStorageService';
import dotenv from 'dotenv';

dotenv.config();

export class CosmosDBClient {
  private client: CosmosClient;
  private database: Database;
  private coursesContainer: Container;
  private enrollmentsContainer: Container;
  private usersContainer: Container;
  private studentsContainer: Container;
  private assignmentsContainer: Container;
  private submissionsContainer: Container;

  constructor() {
    const endpoint = process.env.COSMOS_DB_ENDPOINT!;
    const key = process.env.COSMOS_DB_KEY!;
    const databaseId = process.env.COSMOS_DB_DATABASE_ID || 'EduDB';

    this.client = new CosmosClient({ endpoint, key });
    this.database = this.client.database(databaseId);
    this.coursesContainer = this.database.container('courses');
    this.enrollmentsContainer = this.database.container('enrollments');
    this.usersContainer = this.database.container('users');
    this.studentsContainer = this.database.container('students');
    this.assignmentsContainer = this.database.container('assignments');
    this.submissionsContainer = this.database.container('submissions');
  }

  async initialize() {
    try {
      console.log('Initializing Cosmos DB...');
      
      // Try to get existing database first
      let database;
      try {
        database = this.client.database(process.env.COSMOS_DB_DATABASE_ID || 'EduDB');
        await database.read();
        console.log('✅ Using existing database');
      } catch (error: any) {
        if (error.code === 404) {
          // Create new database with shared throughput
          console.log('Creating new database with shared throughput...');
          const result = await this.client.databases.create({
            id: process.env.COSMOS_DB_DATABASE_ID || 'EduDB',
            throughput: 400 // Shared across all containers
          });
          database = result.database;
          console.log('✅ Database created with 400 RU/s shared throughput');
        } else {
          throw error;
        }
      }

      console.log('Creating containers (if they don\'t exist)...');

      // Create containers without specifying throughput (they'll use shared database throughput)
      try {
        await database.containers.createIfNotExists({
          id: 'courses',
          partitionKey: '/id'
        });
        console.log('✅ courses container ready');
      } catch (error: any) {
        if (error.code === 400 && error.substatus === 1028) {
          console.log('⚠️  courses container: throughput limit exceeded');
          throw new Error('Throughput limit exceeded. Please run: node reset-database.js');
        }
        throw error;
      }

      try {
        await database.containers.createIfNotExists({
          id: 'enrollments',
          partitionKey: '/courseId'
        });
        console.log('✅ enrollments container ready');
      } catch (error: any) {
        if (error.code === 400 && error.substatus === 1028) {
          console.log('⚠️  enrollments container: throughput limit exceeded');
          throw new Error('Throughput limit exceeded. Please run: node reset-database.js');
        }
        throw error;
      }

      try {
        await database.containers.createIfNotExists({
          id: 'users',
          partitionKey: '/id'
        });
        console.log('✅ users container ready');
      } catch (error: any) {
        if (error.code === 400 && error.substatus === 1028) {
          console.log('⚠️  users container: throughput limit exceeded');
          throw new Error('Throughput limit exceeded. Please run: node reset-database.js');
        }
        throw error;
      }

      try {
        await database.containers.createIfNotExists({
          id: 'students',
          partitionKey: '/id'
        });
        console.log('✅ students container ready');
      } catch (error: any) {
        if (error.code === 400 && error.substatus === 1028) {
          console.log('⚠️  students container: throughput limit exceeded');
          throw new Error('Throughput limit exceeded. Please run: node reset-database.js');
        }
        throw error;
      }

      try {
        await database.containers.createIfNotExists({
          id: 'assignments',
          partitionKey: '/courseId'
        });
        console.log('✅ assignments container ready');
      } catch (error: any) {
        if (error.code === 400 && error.substatus === 1028) {
          console.log('⚠️  assignments container: throughput limit exceeded');
          throw new Error('Throughput limit exceeded. Please run: node reset-database.js');
        }
        throw error;
      }

      try {
        await database.containers.createIfNotExists({
          id: 'submissions',
          partitionKey: '/assignmentId'
        });
        console.log('✅ submissions container ready');
      } catch (error: any) {
        if (error.code === 400 && error.substatus === 1028) {
          console.log('⚠️  submissions container: throughput limit exceeded');
          throw new Error('Throughput limit exceeded. Please run: node reset-database.js');
        }
        throw error;
      }

      console.log('✅ Database and containers initialized successfully');
      
      // Initialize blob storage
      try {
        await blobStorageService.initialize();
        console.log('✅ Blob storage initialized successfully');
      } catch (blobError) {
        console.error('⚠️  Blob storage initialization failed:', blobError);
        console.log('📝 You can continue without blob storage, but file uploads will not work');
      }
      
    } catch (error: any) {
      console.error('❌ Error initializing database:', error.message);
      
      // Provide helpful error messages
      if (error.code === 400 && error.substatus === 1028) {
        console.log('\n💡 SOLUTION OPTIONS:');
        console.log('1. Run: node reset-database.js (recommended)');
        console.log('2. Or manually delete containers in Azure Portal');
        console.log('3. Your current containers use dedicated throughput instead of shared');
        console.log('   Free tier accounts are limited to 1000 RU/s total.\n');
      }
      
      throw error;
    }
  }

  getCoursesContainer() {
    return this.coursesContainer;
  }

  getEnrollmentsContainer() {
    return this.enrollmentsContainer;
  }

  getUsersContainer() {
    return this.usersContainer;
  }

  getStudentsContainer() {
    return this.studentsContainer;
  }

  getAssignmentsContainer() {
    return this.assignmentsContainer;
  }

  getSubmissionsContainer() {
    return this.submissionsContainer;
  }
}

export const cosmosClient = new CosmosDBClient();
