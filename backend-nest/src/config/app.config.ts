import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '8080', 10),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
  database: process.env.DATABASE ?? 'rentoroll',
  jwtSecret:
    process.env.JWT_SECRET ?? 'rentoroll-dev-secret-change-in-prod',
  jwtExpiresIn: '7d',
  runSetup: process.env.RUN_SETUP === 'true',
}));
