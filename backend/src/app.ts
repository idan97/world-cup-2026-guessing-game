import express from 'express';
import logger from './logger';
import authRoutes from './routes/auth';
import meRoutes from './routes/me';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(
    {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
    },
    'Incoming request'
  );
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/me', meRoutes);

// Health check route
app.get('/healthz', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Error handler

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error(
      { err, req: { method: req.method, url: req.url } },
      'Unhandled error'
    );
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong',
    });
  }
);

export default app;
