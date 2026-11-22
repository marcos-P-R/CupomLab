import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../src/app';

describe('GET /reports/coupons/by-store', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('CA-06: retorna ranking esperado (discount=45, jan-mar 2026, order=desc)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/reports/coupons/by-store?discount=45&startDate=2026-01-01T00:00:00Z&endDate=2026-04-01T00:00:00Z&order=desc',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      { store_id: 1, store_name: 'Mercado A', total_coupons: 4 },
      { store_id: 5, store_name: 'Eletro E', total_coupons: 3 },
      { store_id: 2, store_name: 'Farmácia B', total_coupons: 2 },
      { store_id: 3, store_name: 'Livraria C', total_coupons: 2 },
    ]);
  });

  it('CA-03: ordenação decrescente por total', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/reports/coupons/by-store?discount=45&startDate=2026-01-01T00:00:00Z&endDate=2026-04-01T00:00:00Z&order=desc',
    });

    const body = response.json() as Array<{ total_coupons: number }>;
    const totals = body.map((r) => r.total_coupons);
    for (let i = 1; i < totals.length; i++) {
      expect(totals[i]).toBeLessThanOrEqual(totals[i - 1]);
    }
  });

  it('CA-04: empate desempata por ID crescente (order=asc)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/reports/coupons/by-store?discount=45&startDate=2026-01-01T00:00:00Z&endDate=2026-04-01T00:00:00Z&order=asc',
    });

    const body = response.json() as Array<{ store_id: number; total_coupons: number }>;
    const farmaciaIdx = body.findIndex((r) => r.store_id === 2);
    const livrariaIdx = body.findIndex((r) => r.store_id === 3);
    expect(farmaciaIdx).toBeGreaterThanOrEqual(0);
    expect(livrariaIdx).toBeGreaterThanOrEqual(0);
    expect(farmaciaIdx).toBeLessThan(livrariaIdx);
  });

  it('CA-01: filtra por desconto exato (discount=20)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/reports/coupons/by-store?discount=20&startDate=2026-01-01T00:00:00Z&endDate=2026-04-01T00:00:00Z',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<{ store_id: number }>;
    const storeIds = body.map((r) => r.store_id).sort();
    expect(storeIds).toEqual([1, 4]);
  });

  it('CA-02: fim exclusivo exclui cupom em 2026-03-01T00:00:00Z', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/reports/coupons/by-store?discount=45&startDate=2026-02-01T00:00:00Z&endDate=2026-03-01T00:00:00Z',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<{ store_id: number; total_coupons: number }>;
    const storeIds = body.map((r) => r.store_id).sort();
    expect(storeIds).toEqual([1, 2, 3]);
    const mercadoA = body.find((r) => r.store_id === 1);
    const farmaciaB = body.find((r) => r.store_id === 2);
    const livrariaC = body.find((r) => r.store_id === 3);
    expect(mercadoA?.total_coupons).toBe(1);
    expect(farmaciaB?.total_coupons).toBe(1);
    expect(livrariaC?.total_coupons).toBe(1);
  });

  it('CA-05: resultado vazio para discount=99', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/reports/coupons/by-store?discount=99&startDate=2026-01-01T00:00:00Z&endDate=2026-04-01T00:00:00Z',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it('retorna 400 quando parâmetros obrigatórios estão ausentes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/reports/coupons/by-store',
    });

    expect(response.statusCode).toBe(400);
  });

  it('retorna 400 quando período está invertido', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/reports/coupons/by-store?discount=45&startDate=2026-02-01T00:00:00Z&endDate=2026-01-01T00:00:00Z',
    });

    expect(response.statusCode).toBe(400);
  });
});
