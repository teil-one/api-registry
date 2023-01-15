import { JsonApiRegistry, RequestOptions } from '../src';
import { jest } from '@jest/globals';

const fetch = jest.fn(
  async () => await Promise.resolve(new Response('{"id": 1}', { headers: { Vary: 'Accept-Encoding' } }))
);
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
  let getUserWith100MsCache: (data: { id: number }, options?: RequestOptions) => Promise<Response>;
  let getUsersWith100MsCacheAndData: (data: { page: number }) => Promise<Response>;

  beforeAll(() => {
    const api = JsonApiRegistry.api('rest-api', 'http://foo.bar/api');

    getUserWith100MsCache = api.endpoint('users/{id}').receives<{ id: number }>().withCache(100).build();

    getUsersWith100MsCacheAndData = api.endpoint('users', 'post').withCache(100).receives<{ page: number }>().build();
  });

  describe('Endpoint is called via GET twice simultaneously with the same data', () => {
    let response1: Response, response2: Response;
    beforeEach(async () => {
      const call1 = getUserWith100MsCache({ id: 1 });
      const call2 = getUserWith100MsCache({ id: 1 });
      [response1, response2] = await Promise.all([call1, call2]);
    });

    test('Fetch is called once', () => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    describe('Response body is read', () => {
      let json1: any, json2: any;
      beforeEach(async () => {
        json1 = await response1.json();
        json2 = await response2.json();
      });

      test('Body is correctly read and remains the same', () => {
        expect(json1).toEqual(json2);
      });
    });
  });

  describe('Endpoint is called twice sequentially with the same data and no delay', () => {
    let response1: Response, response2: Response;
    beforeEach(async () => {
      response1 = await getUserWith100MsCache({ id: 2 });
      response2 = await getUserWith100MsCache({ id: 2 });
    });

    test('Fetch is called once', () => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    describe('Response body is read', () => {
      let json1: any, json2: any;
      beforeEach(async () => {
        json1 = await response1.json();
        json2 = await response2.json();
      });

      test('Body is correctly read and remains the same', () => {
        expect(json1).toEqual(json2);
      });
    });
  });

  describe('Endpoint is called twice sequentially with the same data and delay smaller than caching time', () => {
    let response1: Response, response2: Response;
    beforeEach(async () => {
      response1 = await getUserWith100MsCache({ id: 3 });
      await new Promise((resolve) => setTimeout(resolve, 80));
      response2 = await getUserWith100MsCache({ id: 3 });
    });

    test('Fetch is called once', () => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    describe('Response body is read', () => {
      let json1: any, json2: any;
      beforeEach(async () => {
        json1 = await response1.json();
        json2 = await response2.json();
      });

      test('Body is correctly read and remains the same', () => {
        expect(json1).toEqual(json2);
      });
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

  describe('Endpoint is called via POST twice simultaneously with the same data', () => {
    beforeEach(async () => {
      const call1 = getUsersWith100MsCacheAndData({ page: 1 });
      const call2 = getUsersWith100MsCacheAndData({ page: 1 });
      await Promise.all([call1, call2]);
    });

    test('Fetch is called once', () => {
      expect(fetch).toHaveBeenCalledTimes(2);
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
