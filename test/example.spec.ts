import { JsonResponseError } from '../src';
import { API_CONFIG, UserApi } from './UserApi';

describe('User API', () => {
  let api: UserApi;

  beforeAll(() => {
    api = new UserApi();
  });

  test('Get users', async () => {
    const users = await api.getUsers();
    expect(users.data).toHaveLength(6);
    expect(users.data[0].email).toEqual('george.bluth@reqres.in');
  });

  test('Get user', async () => {
    const user = await api.getUser({ id: 2 });
    expect(user.data.email).toEqual('janet.weaver@reqres.in');
  });

  test('Get user - not found', async () => {
    let withErrors = false;
    try {
      await api.getUser({ id: 23 });
    } catch (e: unknown) {
      withErrors = true;
      expect(e).toBeInstanceOf(JsonResponseError);

      const error = e as JsonResponseError;
      expect(error.response.status).toEqual(404);
    }

    expect(withErrors).toEqual(true);
  });
});

describe('User API with wrong URL', () => {
  let api: UserApi;

  beforeAll(() => {
    API_CONFIG.apiName = 'user-api-wrong-url';
    API_CONFIG.apiUrl = 'http://wrong-url.bar';
    api = new UserApi();
  });

  test('Get user', async () => {
    let withErrors = false;
    try {
      await api.getUser({ id: 1 });
    } catch (e: unknown) {
      withErrors = true;

      // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#instance_properties
      const error = e as { message: string; cause: Error };
      expect(error.message).toEqual('fetch failed');
      expect(error.cause).toMatchObject(expect.objectContaining({ code: 'ENOTFOUND' }));
    }

    expect(withErrors).toEqual(true);
  });
});
