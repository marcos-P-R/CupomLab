CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  name TEXT NOT NULL,
  discount_percent INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coupons_discount_detected
  ON coupons (discount_percent, detected_at);

CREATE INDEX IF NOT EXISTS idx_coupons_store_id
  ON coupons (store_id);
