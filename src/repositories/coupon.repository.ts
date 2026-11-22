import { pool } from '../config/db';

export interface RankedStoresParams {
  discount: number;
  startDate: Date;
  endDate: Date;
  order: 'asc' | 'desc';
}

export interface StoreCouponRanking {
  store_id: number;
  store_name: string;
  total_coupons: number;
}

export async function findRankedStoresByCoupons(
  params: RankedStoresParams,
): Promise<StoreCouponRanking[]> {
  const { discount, startDate, endDate, order } = params;
  const orderDirection = order === 'asc' ? 'ASC' : 'DESC';

  const query = `
    SELECT
      s.id AS store_id,
      s.name AS store_name,
      COUNT(c.id) AS total_coupons
    FROM stores s
    INNER JOIN coupons c ON c.store_id = s.id
    WHERE c.discount_percent = $1
      AND c.detected_at >= $2
      AND c.detected_at < $3
    GROUP BY s.id, s.name
    ORDER BY total_coupons ${orderDirection}, s.id ASC
  `;

  const values = [discount, startDate, endDate];
  const result = await pool.query<StoreCouponRanking>(query, values);

  return result.rows.map((row) => ({
    store_id: row.store_id,
    store_name: row.store_name,
    total_coupons: Number(row.total_coupons),
  }));
}
