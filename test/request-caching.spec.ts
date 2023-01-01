import { JsonApiRegistry } from '../src/index';
import { jest } from '@jest/globals';

const fetch = jest.fn(async () => await Promise.resolve(new Response()));
global.fetch = fetch;

describe('Endpoint without cache', () => {
  let getUsersWithoutCache: () => Promise<Response>;

  beforeAll(() => {
    const api = JsonApiRegistry.api('rest-api', 'http://foo.bar/api');
    getUsersWithoutCache = api.endpoint('users').build();
  });

  describe('Endpoint is called twice', () => {
    beforeEach(async () => {
      const call1 = getUsersWithoutCache();
      const call2 = getUsersWithoutCache();
      await Promise.all([call1, call2]);
    });

    test('Fetch is called twice', () => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Endpoint with cache', () => {
  let getUserWith100MsCache: (data: { id: number }) => Promise<Response>;
  let getUsersWith100MsCacheAndData: (data: { page: number }) => Promise<Response>;

  beforeAll(() => {
    const api = JsonApiRegistry.api('rest-api', 'http://foo.bar/api');

    getUserWith100MsCache = api.endpoint('users/{id}').receives<{ id: number }>().withTTL(100).build();

    getUsersWith100MsCacheAndData = api.endpoint('users', 'post').withTTL(100).receives<{ page: number }>().build();
  });

  describe('Endpoint is called twice simultaneously with the same data', () => {
    beforeEach(async () => {
      const call1 = getUserWith100MsCache({ id: 1 });
      const call2 = getUserWith100MsCache({ id: 1 });
      await Promise.all([call1, call2]);
    });

    test('Fetch is called once', () => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Endpoint is called twice sequentially with the same data and no delay', () => {
    beforeEach(async () => {
      await getUserWith100MsCache({ id: 2 });
      await getUserWith100MsCache({ id: 2 });
    });

    test('Fetch is called once', () => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Endpoint is called twice sequentially with the same data and delay smaller than caching time', () => {
    beforeEach(async () => {
      await getUserWith100MsCache({ id: 3 });
      await new Promise((resolve) => setTimeout(resolve, 80));
      await getUserWith100MsCache({ id: 3 });
    });

    test('Fetch is called once', () => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Endpoint is called twice sequentially with the same data and delay bigger than caching time', () => {
    beforeEach(async () => {
      await getUserWith100MsCache({ id: 4 });
      await new Promise((resolve) => setTimeout(resolve, 100));
      await getUserWith100MsCache({ id: 4 });
    });

    test('Fetch is called twice', () => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Endpoint is called twice simultaneously with different data', () => {
    beforeEach(async () => {
      const call1 = getUserWith100MsCache({ id: 5 });
      const call2 = getUserWith100MsCache({ id: 6 });
      await Promise.all([call1, call2]);
    });

    test('Fetch is called twice', () => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Endpoint is called via POST twice simultaneously with same data', () => {
    beforeEach(async () => {
      const call1 = getUsersWith100MsCacheAndData({ page: 1 });
      const call2 = getUsersWith100MsCacheAndData({ page: 1 });
      await Promise.all([call1, call2]);
    });

    test('Fetch is called once', () => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Endpoint is called via POST twice simultaneously with different data', () => {
    beforeEach(async () => {
      const call1 = getUsersWith100MsCacheAndData({ page: 2 });
      const call2 = getUsersWith100MsCacheAndData({ page: 3 });
      await Promise.all([call1, call2]);
    });

    test('Fetch is called twice', () => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Endpoint is called twice sequentially with different data', () => {
    beforeEach(async () => {
      await getUserWith100MsCache({ id: 7 });
      await getUserWith100MsCache({ id: 8 });
    });

    test('Fetch is called twice', () => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
