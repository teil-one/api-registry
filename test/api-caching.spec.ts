import { JsonApiRegistry, JsonApi } from '../src';

describe('Given no API registered', () => {
  describe('When register API without URL, and register endpoints', () => {
    let api: JsonApi;
    let endpoint: () => Promise<Response>;

    beforeEach(() => {
      api = JsonApiRegistry.api('reqres-api');
      endpoint = api.endpoint('/api').build();
    });

    test('Then API is registered', () => {
      expect(api).toBeTruthy();
    });

    describe('And try using API', () => {
      test('Then throws error', async () => {
        await expect(async () => await endpoint()).rejects.toThrowError(
          'Base URL is not defined for the API "reqres-api"'
        );
      });
    });

    describe('And set the API base URL', () => {
      beforeEach(() => {
        JsonApiRegistry.api('reqres-api', 'https://reqres.in/');
      });

      test('Then can use API', async () => {
        const response = await endpoint();
        expect(response).toBeTruthy();
      });
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
