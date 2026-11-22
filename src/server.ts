import { app } from './app';

const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';

app.listen({ port, host }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
