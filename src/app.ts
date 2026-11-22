import fastify from 'fastify';
import reportsRoutes from './routes/reports';

export const app = fastify({ logger: false });

app.register(reportsRoutes);
