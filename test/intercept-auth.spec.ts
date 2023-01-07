import { UserApi } from './UserApi';
import { jest } from '@jest/globals';

const fetch = jest.fn(async () => await Promise.resolve(new Response(null, { status: 401 })));
global.fetch = fetch;

describe('API with authorization returns 401', () => {
  let api: UserApi;

  beforeAll(() => {
    api = new UserApi();
  });

  beforeEach(async () => {
    await api.deleteUser({ id: 1 });
  });

  test('Authorization is updated', async () => {
    const calls = fetch.mock.calls;
    expect(calls).toHaveLength(2);

    const fetchRequest1 = (calls[0] as Request[])[0];
    const fetchRequest2 = (calls[1] as Request[])[0];

    expect(fetchRequest1.headers.get('Authorization')).toEqual('Basic Sm9objpEb2U=');
    expect(fetchRequest2.headers.get('Authorization')).toEqual(
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    );
  });
});
