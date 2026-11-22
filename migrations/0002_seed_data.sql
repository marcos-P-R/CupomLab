INSERT INTO stores (id, name) VALUES
  (1, 'Mercado A'),
  (2, 'Farmácia B'),
  (3, 'Livraria C'),
  (4, 'Pet Shop D'),
  (5, 'Eletro E')
ON CONFLICT (id) DO NOTHING;

INSERT INTO coupons (id, store_id, name, discount_percent, category, description, detected_at) VALUES
  (1, 1, 'Cupom Mercado A 45% jan', 45, 'Supermercado', 'Desconto geral', '2026-01-10T10:00:00Z'),
  (2, 1, 'Cupom Mercado A 45% jan 2', 45, 'Supermercado', 'Desconto geral', '2026-01-15T10:00:00Z'),
  (3, 1, 'Cupom Mercado A 20% jan', 20, 'Supermercado', 'Desconto limitado', '2026-01-20T10:00:00Z'),
  (4, 1, 'Cupom Mercado A 45% fev', 45, 'Supermercado', 'Desconto geral', '2026-02-05T10:00:00Z'),
  (5, 1, 'Cupom Mercado A 45% mar', 45, 'Supermercado', 'Desconto geral', '2026-03-01T10:00:00Z'),
  (6, 2, 'Cupom Farmácia B 45% fev', 45, 'Saúde', 'Desconto medicamentos', '2026-02-01T10:00:00Z'),
  (7, 2, 'Cupom Farmácia B 10% fev', 10, 'Saúde', 'Desconto cosméticos', '2026-02-10T10:00:00Z'),
  (8, 2, 'Cupom Farmácia B 45% mar', 45, 'Saúde', 'Desconto medicamentos', '2026-03-15T10:00:00Z'),
  (9, 2, 'Cupom Farmácia B 45% abr', 45, 'Saúde', 'Desconto medicamentos', '2026-04-01T10:00:00Z'),
  (10, 3, 'Cupom Livraria C 45% jan', 45, 'Livros', 'Desconto lançamentos', '2026-01-20T10:00:00Z'),
  (11, 3, 'Cupom Livraria C 30% fev', 30, 'Livros', 'Desconto estoque', '2026-02-01T10:00:00Z'),
  (12, 3, 'Cupom Livraria C 45% fev', 45, 'Livros', 'Desconto lançamentos', '2026-02-20T10:00:00Z'),
  (13, 4, 'Cupom Pet Shop D 15% jan', 15, 'Pet', 'Ração', '2026-01-10T10:00:00Z'),
  (14, 4, 'Cupom Pet Shop D 50% jan', 50, 'Pet', 'Acessórios', '2026-01-20T10:00:00Z'),
  (15, 4, 'Cupom Pet Shop D 20% mar', 20, 'Pet', 'Banho e tosa', '2026-03-01T10:00:00Z'),
  (16, 5, 'Cupom Eletro E 45% jan', 45, 'Eletrônicos', 'TVs', '2026-01-05T10:00:00Z'),
  (17, 5, 'Cupom Eletro E 10% fev', 10, 'Eletrônicos', 'Celulares', '2026-02-15T10:00:00Z'),
  (18, 5, 'Cupom Eletro E 45% mar', 45, 'Eletrônicos', 'TVs', '2026-03-10T10:00:00Z'),
  (19, 5, 'Cupom Eletro E 45% mar 2', 45, 'Eletrônicos', 'TVs', '2026-03-20T10:00:00Z'),
  (20, 5, 'Cupom Eletro E 30% abr', 30, 'Eletrônicos', 'Eletrodomésticos', '2026-04-05T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Ajusta sequências para não colidir com IDs inseridos manualmente
SELECT setval('stores_id_seq', (SELECT MAX(id) FROM stores));
SELECT setval('coupons_id_seq', (SELECT MAX(id) FROM coupons));
