import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db';
import { notFound, errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import approvalRoutes from './routes/approval.routes';
import tenderRoutes from './routes/tender.routes';
import contractorRoutes from './routes/contractor.routes';
import bidRoutes from './routes/bid.routes';
import workOrderRoutes from './routes/workOrder.routes';
import milestoneRoutes from './routes/milestone.routes';
import mbRoutes from './routes/mb.routes';
import billRoutes from './routes/bill.routes';
import paymentRoutes from './routes/payment.routes';
import auditRoutes from './routes/audit.routes';
import dashboardRoutes from './routes/dashboard.routes';
import uploadRoutes from './routes/upload.routes';
import departmentRoutes from './routes/department.routes';
import subscriptionRoutes from './routes/subscription.routes';
import dailyProgressRoutes from './routes/dailyProgress.routes';
import notificationRoutes from './routes/notification.routes';
import registrationRoutes from './routes/registration.routes';
import invoiceRoutes from './routes/invoice.routes';
import supportRoutes from './routes/support.routes';
import systemRoutes from './routes/system.routes';
import divisionRoutes from './routes/division.routes';
import workflowRoutes from './routes/workflow.routes';
import deptRoutes from './routes/dept.routes';
import ceRoutes from './routes/ce.routes';
import eeRoutes from './routes/ee.routes';
import sdoRoutes from './routes/sdo.routes';
import jeRoutes from './routes/je.routes';
import accRoutes from './routes/acc.routes';
import contRoutes from './routes/cont.routes';
import inspectionRoutes from './routes/inspection.routes';
import materialRequestRoutes from './routes/materialRequest.routes';

const app = express();

// Connect MongoDB
connectDB();

// Security & basic middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests, please try again later.',
});
app.use('/api', limiter);

// Health
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Constructor ERP API is running',
    version: '1.0.0',
    docs: '/api/health',
  });
});
app.get('/api/health', (_req: Request, res: Response) =>
  res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() })
);

// API Routes — 12 stages of the workflow
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes); // Stage 1, 2, 8, 12
app.use('/api/approvals', approvalRoutes); // Stage 2 - approval workflow
app.use('/api/tenders', tenderRoutes); // Stage 3, 4
app.use('/api/contractors', contractorRoutes);
app.use('/api/bids', bidRoutes); // Stage 5, 6
app.use('/api/work-orders', workOrderRoutes); // Stage 7
app.use('/api/milestones', milestoneRoutes); // Stage 8
app.use('/api/mb', mbRoutes); // Stage 9
app.use('/api/bills', billRoutes); // Stage 10
app.use('/api/payments', paymentRoutes); // Stage 11
app.use('/api/audit', auditRoutes); // Stage 12
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/registrations', registrationRoutes); // public + super admin
app.use('/api/invoices', invoiceRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/system', systemRoutes);              // platform-wide stats
app.use('/api/divisions', divisionRoutes);         // dept admin
app.use('/api/workflows', workflowRoutes);         // dept admin
app.use('/api/dept', deptRoutes);                  // dept admin stats + activity
app.use('/api/ce', ceRoutes);                      // chief engineer governance
app.use('/api/ee', eeRoutes);                      // executive engineer operations
app.use('/api/sdo', sdoRoutes);                    // SDO verification & supervision
app.use('/api/je', jeRoutes);                      // JE field execution
app.use('/api/acc', accRoutes);                    // Accountant finance
app.use('/api/cont', contRoutes);                  // Contractor workspace
app.use('/api/inspections', inspectionRoutes);     // site inspections
app.use('/api/material-requests', materialRequestRoutes);
app.use('/api/daily-progress', dailyProgressRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`[Server] Running in ${process.env.NODE_ENV} on port ${PORT}`)
);
