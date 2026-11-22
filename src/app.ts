import fastify from 'fastify';
import reportsRoutes from './routes/reports';

export const app = fastify({ logger: false });

app.register(reportsRoutes);

const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';

app.listen({ port, host }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
