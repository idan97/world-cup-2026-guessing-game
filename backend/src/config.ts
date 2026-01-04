export const config = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  databaseUrl: process.env['DATABASE_URL'] || '',
  clerkSecretKey: process.env['CLERK_SECRET_KEY'] || '',
  clerkPublishableKey: process.env['CLERK_PUBLISHABLE_KEY'] || '',
  frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  isDevelopment: process.env['NODE_ENV'] !== 'production',
  isProduction: process.env['NODE_ENV'] === 'production',
};
