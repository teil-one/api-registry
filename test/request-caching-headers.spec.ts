import { JsonApiRegistry, RequestOptions } from '../src';
import { jest } from '@jest/globals';

describe('Endpoint with cache', () => {
  let getUserWith100MsCache: (data: { id: number }, options?: RequestOptions) => Promise<Response>;

  beforeAll(() => {
    const api = JsonApiRegistry.api('rest-api', 'http://foo.bar/api');

    getUserWith100MsCache = api.endpoint('users/{id}').receives<{ id: number }>().withCache(100).build();
  });

  beforeEach(() => {
    const fetch = jest.fn(async () => await Promise.resolve(new Response()));
    global.fetch = fetch;
  });

  describe('Endpoint is called twice simultaneously with the same data and headers', () => {
    beforeEach(async () => {
      const call1 = getUserWith100MsCache({ id: 1 }, { headers: { 'Content-Type': 'application/json' } });
      const call2 = getUserWith100MsCache({ id: 1 }, { headers: { 'Content-Type': 'application/json' } });
      await Promise.all([call1, call2]);
    });

    test('Fetch is called once', () => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Endpoint is called twice simultaneously with the same data and different Authorization headers', () => {
    beforeEach(async () => {
      const call1 = getUserWith100MsCache({ id: 2 }, { headers: { Authorization: 'Basic Sm9objpEb2U=' } });
      const call2 = getUserWith100MsCache({ id: 2 }, { headers: { Authorization: 'Basic Zm9vOmJhcg==' } });
      await Promise.all([call1, call2]);
    });

    test('Fetch is called twice', () => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Endpoint is called twice simultaneously with the same data and the same Authorization headers', () => {
    beforeEach(async () => {
      const call1 = getUserWith100MsCache({ id: 3 }, { headers: { Authorization: 'Basic Sm9objpEb2U=' } });
      const call2 = getUserWith100MsCache({ id: 3 }, { headers: { Authorization: 'Basic Sm9objpEb2U=' } });
      await Promise.all([call1, call2]);
    });

    test('Fetch is called once', () => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('And response has Vary: Accept-Encoding', () => {
    beforeEach(() => {
      global.fetch = jest.fn(
        async () => await Promise.resolve(new Response(null, { headers: { Vary: 'Accept-Encoding' } }))
      );
    });

    describe('Endpoint is called twice simultaneously with the same data and the same `Accept-Encoding` headers', () => {
      beforeEach(async () => {
        const call1 = getUserWith100MsCache({ id: 4 }, { headers: { 'Accept-Encoding': 'gzip' } });
        const call2 = getUserWith100MsCache({ id: 4 }, { headers: { 'Accept-Encoding': 'gzip' } });
        await Promise.all([call1, call2]);
      });

      test('Fetch is called once', () => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    describe('Endpoint is called twice simultaneously with the same data and different `Accept-Encoding` headers', () => {
      beforeEach(async () => {
        const call1 = getUserWith100MsCache({ id: 5 }, { headers: { 'Accept-Encoding': 'gzip' } });
        const call2 = getUserWith100MsCache({ id: 5 }, { headers: { 'Accept-Encoding': 'deflate' } });
        await Promise.all([call1, call2]);
      });

      test('Fetch is called twice', () => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});
