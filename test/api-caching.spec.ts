import { JsonApiRegistry } from '../src/index';
import { JsonApi } from '../src/JsonApi';

describe('No API registered', () => {
  describe('Register API without URL', () => {
    test('Throw error', () => {
      expect(() => JsonApiRegistry.api('reqres')).toThrowError('baseURL must be defined in the first API declaration');
    });
  });
});

describe('API registered', () => {
  let registeredApi: JsonApi;
  beforeAll(() => {
    registeredApi = JsonApiRegistry.api('reqres', 'https://reqres.in/api');
  });

  describe('Register API with the same key', () => {
    let retreivedApi: JsonApi;
    beforeAll(() => {
      retreivedApi = JsonApiRegistry.api('reqres');
    });

    test('Retrieves the registered API', () => {
      expect(retreivedApi).toBe(registeredApi);
    });
  });

  describe('Register API with the same key and URL', () => {
    let retreivedApi: JsonApi;
    beforeAll(() => {
      retreivedApi = JsonApiRegistry.api('reqres', 'https://reqRes.in/api/');
    });

    test('Retrieves the registered API', () => {
      expect(retreivedApi).toBe(registeredApi);
    });
  });

  describe('Register API with the same key and a different URL', () => {
    test('Throw error', () => {
      expect(() => JsonApiRegistry.api('reqres', 'https://reqres.in/')).toThrowError(
        'API reqres is already registered with another URL https://reqres.in/api'
      );
    });
  });

  describe('Register API with a different key', () => {
    let anotherApi: JsonApi;
    beforeAll(() => {
      anotherApi = JsonApiRegistry.api('reqres2', 'https://reqres.in/api');
    });

    test('Register another API', () => {
      expect(anotherApi).not.toBe(registeredApi);
    });
  });
});
