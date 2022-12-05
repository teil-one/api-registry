import { ApiRegistry } from './index';

test('ApiRegistry', async () => {
  const restApi = ApiRegistry.api('rest-api', 'https://foo.bar');
  const getUser = restApi.endpoint<{ id: number }, User>('/user/{id}', 'get', Number.POSITIVE_INFINITY);

  expect(getUser).toBeDefined();
});

class User {
  id: number;
  foo: string;
}
