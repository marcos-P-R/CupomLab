import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  // conexão estabelecida; sem efeitos colaterais
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexão', err);
});
