import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rankStoresByCoupons } from '../src/services/rankStoresByCoupons';

describe('rankStoresByCoupons', () => {
  beforeAll(async () => {
    // garante que o banco esteja disponível via docker compose
  });

  it('CA-06: retorna ranking desc com o seed (discount=45, jan-mar 2026)', async () => {
    const result = await rankStoresByCoupons({
      discount: 45,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-04-01T00:00:00Z'),
      order: 'desc',
    });

    expect(result).toEqual([
      { store_id: 1, store_name: 'Mercado A', total_coupons: 4 },
      { store_id: 5, store_name: 'Eletro E', total_coupons: 3 },
      { store_id: 2, store_name: 'Farmácia B', total_coupons: 2 },
      { store_id: 3, store_name: 'Livraria C', total_coupons: 2 },
    ]);
  });

  it('CA-03: ordenação decrescente por total de cupons', async () => {
    const result = await rankStoresByCoupons({
      discount: 45,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-04-01T00:00:00Z'),
      order: 'desc',
    });

    const totals = result.map((r) => r.total_coupons);
    for (let i = 1; i < totals.length; i++) {
      expect(totals[i]).toBeLessThanOrEqual(totals[i - 1]);
    }
  });

  it('CA-04: empate desempata por ID da loja crescente', async () => {
    const result = await rankStoresByCoupons({
      discount: 45,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-04-01T00:00:00Z'),
      order: 'desc',
    });

    const farmaciaIdx = result.findIndex((r) => r.store_id === 2);
    const livrariaIdx = result.findIndex((r) => r.store_id === 3);
    expect(farmaciaIdx).toBeGreaterThanOrEqual(0);
    expect(livrariaIdx).toBeGreaterThanOrEqual(0);
    expect(farmaciaIdx).toBeLessThan(livrariaIdx);
  });

  it('CA-01: filtra por desconto exato (discount=20)', async () => {
    const result = await rankStoresByCoupons({
      discount: 20,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-04-01T00:00:00Z'),
      order: 'desc',
    });

    const storeIds = result.map((r) => r.store_id).sort();
    expect(storeIds).toEqual([1, 4]);
    const mercadoA = result.find((r) => r.store_id === 1);
    const petShop = result.find((r) => r.store_id === 4);
    expect(mercadoA?.total_coupons).toBe(1);
    expect(petShop?.total_coupons).toBe(1);
  });

  it('CA-02: filtro de período com fim exclusivo e início inclusivo', async () => {
    const result = await rankStoresByCoupons({
      discount: 45,
      startDate: new Date('2026-02-01T00:00:00Z'),
      endDate: new Date('2026-03-01T00:00:00Z'),
      order: 'desc',
    });

    // Cupom 6 (2026-02-01) está dentro (início inclusivo)
    // Cupom 5 (2026-03-01) está fora (fim exclusivo)
    const storeIds = result.map((r) => r.store_id).sort();
    expect(storeIds).toEqual([1, 2, 3]);
    const mercadoA = result.find((r) => r.store_id === 1);
    const farmaciaB = result.find((r) => r.store_id === 2);
    const livrariaC = result.find((r) => r.store_id === 3);
    expect(mercadoA?.total_coupons).toBe(1);  // cupom 4 (2026-02-05)
    expect(farmaciaB?.total_coupons).toBe(1);  // cupom 6 (2026-02-01)
    expect(livrariaC?.total_coupons).toBe(1);  // cupom 12 (2026-02-20)
  });

  it('CA-05: resultado vazio quando não há cupons (discount=99)', async () => {
    const result = await rankStoresByCoupons({
      discount: 99,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-04-01T00:00:00Z'),
      order: 'desc',
    });

    expect(result).toEqual([]);
  });

  it('lança erro quando endDate <= startDate', async () => {
    await expect(
      rankStoresByCoupons({
        discount: 45,
        startDate: new Date('2026-02-01T00:00:00Z'),
        endDate: new Date('2026-01-01T00:00:00Z'),
        order: 'desc',
      }),
    ).rejects.toThrow();
  });
});
