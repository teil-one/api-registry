import { JsonApiRegistry, JsonApi, JsonEndpoint } from '../src';

describe('Registered API and endpoint', () => {
  let registeredApi: JsonApi;
  let userEndpoint: JsonEndpoint;

  beforeAll(() => {
    registeredApi = JsonApiRegistry.api('reqres', 'https://reqres.in/api');
    userEndpoint = registeredApi.endpoint('users/{id}');
  });

  describe('Register endpoint with the same URL and method', () => {
    let userEndpoint2: JsonEndpoint;

    beforeAll(() => {
      userEndpoint2 = registeredApi.endpoint('/users/{User}/', 'Get');
    });

    test('Retrieves the same endpoint', async () => {
      expect(userEndpoint2).toBe(userEndpoint);
    });
  });

  describe('Register endpoint with the same URL and a different method', () => {
    let userEndpoint2: JsonEndpoint;

    beforeAll(() => {
      userEndpoint2 = registeredApi.endpoint('users/{id}', 'post');
    });

    test('Returns another endpoint', async () => {
      expect(userEndpoint2).not.toBe(userEndpoint);
    });
  });

  describe('Register endpoint with a different URL', () => {
    let userEndpoint2: JsonEndpoint;

    beforeAll(() => {
      userEndpoint2 = registeredApi.endpoint('user/{id}');
    });

    test('Returns another endpoint', async () => {
      expect(userEndpoint2).not.toBe(userEndpoint);
    });
  });
});
