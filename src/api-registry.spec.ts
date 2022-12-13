import { ApiRegistry } from './index';

test('ApiRegistry', async () => {
  const restApi = ApiRegistry.api('rest-api', 'https://reqres.in/api');
  const getUser = restApi.endpoint<{ id: number }, UserData>('/users/{id}', 'get', Number.POSITIVE_INFINITY);

  expect(getUser).toBeDefined();

  const user = await getUser({ id: 1 });

  expect((await user.json()).data.email).toEqual('george.bluth@reqres.in');
});

class UserData {
  data: User;
}

class User {
  id: number;
  email: string;
}
