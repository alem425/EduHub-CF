import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { cosmosClient } from './config/database';
import courseRoutes from './routes/courseRoutes';
import studentRoutes from './routes/studentRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import submissionRoutes from './routes/submissionRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api', submissionRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔧 Starting server initialization...');
    console.log('📍 PORT:', PORT);
    console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔗 COSMOS_DB_ENDPOINT:', process.env.COSMOS_DB_ENDPOINT ? 'SET' : 'NOT SET');
    console.log('🔑 COSMOS_DB_KEY:', process.env.COSMOS_DB_KEY ? 'SET' : 'NOT SET');
    console.log('🗃️  COSMOS_DB_DATABASE_ID:', process.env.COSMOS_DB_DATABASE_ID);
    
    console.log('📡 Initializing Cosmos DB connection...');
    await cosmosClient.initialize();
    console.log('✅ Cosmos DB initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 Courses API: http://localhost:${PORT}/api/courses`);
      console.log(`👨‍🎓 Students API: http://localhost:${PORT}/api/students`);
      console.log(`📝 Assignments API: http://localhost:${PORT}/api/assignments`);
      console.log(`📤 Submissions API: http://localhost:${PORT}/api/submissions`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

startServer();
