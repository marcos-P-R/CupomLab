import { pool } from './config/db';

const stores = [
  { id: 1, name: 'Mercado A' },
  { id: 2, name: 'Farmácia B' },
  { id: 3, name: 'Livraria C' },
  { id: 4, name: 'Pet Shop D' },
  { id: 5, name: 'Eletro E' },
];

const coupons = [
  { id: 1, store_id: 1, name: 'Cupom Mercado A 45% jan', discount_percent: 45, category: 'Supermercado', description: 'Desconto geral', detected_at: '2026-01-10T10:00:00Z' },
  { id: 2, store_id: 1, name: 'Cupom Mercado A 45% jan 2', discount_percent: 45, category: 'Supermercado', description: 'Desconto geral', detected_at: '2026-01-15T10:00:00Z' },
  { id: 3, store_id: 1, name: 'Cupom Mercado A 20% jan', discount_percent: 20, category: 'Supermercado', description: 'Desconto limitado', detected_at: '2026-01-20T10:00:00Z' },
  { id: 4, store_id: 1, name: 'Cupom Mercado A 45% fev', discount_percent: 45, category: 'Supermercado', description: 'Desconto geral', detected_at: '2026-02-05T10:00:00Z' },
  { id: 5, store_id: 1, name: 'Cupom Mercado A 45% mar', discount_percent: 45, category: 'Supermercado', description: 'Desconto geral', detected_at: '2026-03-01T10:00:00Z' },
  { id: 6, store_id: 2, name: 'Cupom Farmácia B 45% fev', discount_percent: 45, category: 'Saúde', description: 'Desconto medicamentos', detected_at: '2026-02-01T10:00:00Z' },
  { id: 7, store_id: 2, name: 'Cupom Farmácia B 10% fev', discount_percent: 10, category: 'Saúde', description: 'Desconto cosméticos', detected_at: '2026-02-10T10:00:00Z' },
  { id: 8, store_id: 2, name: 'Cupom Farmácia B 45% mar', discount_percent: 45, category: 'Saúde', description: 'Desconto medicamentos', detected_at: '2026-03-15T10:00:00Z' },
  { id: 9, store_id: 2, name: 'Cupom Farmácia B 45% abr', discount_percent: 45, category: 'Saúde', description: 'Desconto medicamentos', detected_at: '2026-04-01T10:00:00Z' },
  { id: 10, store_id: 3, name: 'Cupom Livraria C 45% jan', discount_percent: 45, category: 'Livros', description: 'Desconto lançamentos', detected_at: '2026-01-20T10:00:00Z' },
  { id: 11, store_id: 3, name: 'Cupom Livraria C 30% fev', discount_percent: 30, category: 'Livros', description: 'Desconto estoque', detected_at: '2026-02-01T10:00:00Z' },
  { id: 12, store_id: 3, name: 'Cupom Livraria C 45% fev', discount_percent: 45, category: 'Livros', description: 'Desconto lançamentos', detected_at: '2026-02-20T10:00:00Z' },
  { id: 13, store_id: 4, name: 'Cupom Pet Shop D 15% jan', discount_percent: 15, category: 'Pet', description: 'Ração', detected_at: '2026-01-10T10:00:00Z' },
  { id: 14, store_id: 4, name: 'Cupom Pet Shop D 50% jan', discount_percent: 50, category: 'Pet', description: 'Acessórios', detected_at: '2026-01-20T10:00:00Z' },
  { id: 15, store_id: 4, name: 'Cupom Pet Shop D 20% mar', discount_percent: 20, category: 'Pet', description: 'Banho e tosa', detected_at: '2026-03-01T10:00:00Z' },
  { id: 16, store_id: 5, name: 'Cupom Eletro E 45% jan', discount_percent: 45, category: 'Eletrônicos', description: 'TVs', detected_at: '2026-01-05T10:00:00Z' },
  { id: 17, store_id: 5, name: 'Cupom Eletro E 10% fev', discount_percent: 10, category: 'Eletrônicos', description: 'Celulares', detected_at: '2026-02-15T10:00:00Z' },
  { id: 18, store_id: 5, name: 'Cupom Eletro E 45% mar', discount_percent: 45, category: 'Eletrônicos', description: 'TVs', detected_at: '2026-03-10T10:00:00Z' },
  { id: 19, store_id: 5, name: 'Cupom Eletro E 45% mar 2', discount_percent: 45, category: 'Eletrônicos', description: 'TVs', detected_at: '2026-03-20T10:00:00Z' },
  { id: 20, store_id: 5, name: 'Cupom Eletro E 30% abr', discount_percent: 30, category: 'Eletrônicos', description: 'Eletrodomésticos', detected_at: '2026-04-05T10:00:00Z' },
];

async function runSeed(): Promise<void> {
  await pool.query('BEGIN');

  try {
    for (const store of stores) {
      await pool.query(
        `INSERT INTO stores (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [store.id, store.name],
      );
    }

    for (const coupon of coupons) {
      await pool.query(
        `INSERT INTO coupons (id, store_id, name, discount_percent, category, description, detected_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          coupon.id,
          coupon.store_id,
          coupon.name,
          coupon.discount_percent,
          coupon.category,
          coupon.description,
          coupon.detected_at,
        ],
      );
    }

    await pool.query(`SELECT setval('stores_id_seq', (SELECT MAX(id) FROM stores))`);
    await pool.query(`SELECT setval('coupons_id_seq', (SELECT MAX(id) FROM coupons))`);

    await pool.query('COMMIT');
    console.log('Seed concluído: 5 lojas e 20 cupons inseridos.');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro ao executar seed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runSeed();
