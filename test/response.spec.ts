import { JsonResponseError } from '../src';
import { UserApi } from './UserApi';

describe('User API', () => {
  let api: UserApi;

  beforeAll(() => {
    api = new UserApi();
  });

  test('Get data without parameters', async () => {
    const users = await api.getUsers();
    expect(users.data).toHaveLength(6);
    expect(users.data[0].email).toEqual('george.bluth@reqres.in');
  });

  test('Get data with parameters', async () => {
    const user = await api.getUser({ id: 2 });
    expect(user.data.email).toEqual('janet.weaver@reqres.in');
  });

  test('Throw 404 error if not found', async () => {
    let withErrors = false;
    try {
      await api.getUser({ id: 23 });
    } catch (e: unknown) {
      withErrors = true;
      expect(e).toBeInstanceOf(JsonResponseError);

      const error = e as JsonResponseError;
      expect(error.message).toEqual('request failed');
      expect(error.response.status).toEqual(404);
    }

    expect(withErrors).toEqual(true);
  });

  // TODO: Add more tests for endpoints with various combinations of data and options params

  test('Throw read error if no data', async () => {
    let withErrors = false;
    try {
      await api.getUsers({ method: 'delete' });
    } catch (e: unknown) {
      withErrors = true;
      expect(e).toBeInstanceOf(JsonResponseError);

      const error = e as JsonResponseError;
      expect(error.message).toEqual('response read failed');
      expect(error.cause).toMatchObject(expect.objectContaining({ message: 'Unexpected end of JSON input' }));
    }

    expect(withErrors).toEqual(true);
  });

  test('Throw read error if data with delete', async () => {
    let withErrors = false;
    try {
      await api.getUser({ id: 1 }, { method: 'delete' });
    } catch (e: unknown) {
      withErrors = true;
      expect(e).toBeInstanceOf(JsonResponseError);

      const error = e as JsonResponseError;
      expect(error.message).toEqual('response read failed');
      expect(error.cause).toMatchObject(expect.objectContaining({ message: 'Unexpected end of JSON input' }));
    }

    expect(withErrors).toEqual(true);
  });

  test('Post data', async () => {
    const user = await api.createUser({ email: 'new.user@reqres.in' });
    expect(user).toMatchObject({ id: expect.anything(), createdAt: expect.anything() });
  });

  test('Update data', async () => {
    const user = await api.updateUser({ id: 1, email: 'new.user@reqres.in' });
    expect(user).toMatchObject({ updatedAt: expect.anything() });
  });

  test('Delete data', async () => {
    const response = await api.deleteUser({ id: 1 });
    expect(response.status).toEqual(204);
  });
});
