import { findRankedStoresByCoupons } from '../repositories/coupon.repository';

export interface RankStoresInput {
  discount: number;
  startDate: Date;
  endDate: Date;
  order: 'asc' | 'desc';
}

export interface StoreRankingItem {
  store_id: number;
  store_name: string;
  total_coupons: number;
}

export async function rankStoresByCoupons(
  input: RankStoresInput,
): Promise<StoreRankingItem[]> {
  const { endDate, startDate } = input;

  if (endDate <= startDate) {
    throw new Error('endDate deve ser posterior a startDate.');
  }

  return findRankedStoresByCoupons(input);
}
