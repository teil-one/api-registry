import { JsonApiRegistry, JsonApi, RequestOptions } from '../src';
import { jest } from '@jest/globals';
import { validateFetchRequest } from './validateFetchRequest';

const fetch = jest.fn(async () => await Promise.resolve(new Response()));
global.fetch = fetch;

describe('API with options', () => {
  let api: JsonApi;

  beforeAll(() => {
    api = JsonApiRegistry.api('rest-api', 'http://foo.bar/api', {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      }
    });
  });

  describe('And endpoint with options', () => {
    let getUser: (data: { id: number }, requestOptions?: RequestOptions) => Promise<Response>;

    beforeAll(async () => {
      getUser = api
        .endpoint('user/{id}')
        .receives<{ id: number }>()
        .withOptions({ headers: { Authorization: 'Basic Zm9vOmJhcg==', 'Accept-Language': '*' }, method: 'UPDATE' })
        .build();
    });

    describe('Request is called with options', () => {
      beforeEach(async () => {
        await getUser(
          { id: 1 },
          {
            headers: { 'Accept-Language': 'de-DE', 'Accept-Encoding': 'deflate' },
            method: 'DELETE',
            credentials: 'same-origin'
          }
        );
      });

      test('All options are combined and applied', async () => {
        await validateFetchRequest(
          fetch,
          'http://foo.bar/api/user/1',
          {
            headers: {
              'Content-Type': 'application/vnd.api+json',
              Authorization: 'Basic Zm9vOmJhcg==',
              'Accept-Language': 'de-DE',
              'Accept-Encoding': 'deflate'
            },
            method: 'DELETE',
            credentials: 'same-origin'
          },
          'DELETE',
          { id: 1 }
        );
      });
    });

    describe('Request is called without options', () => {
      beforeEach(async () => {
        await getUser({ id: 1 });
      });

      test('API and endpoint options are combined and applied', async () => {
        await validateFetchRequest(
          fetch,
          'http://foo.bar/api/user/1',
          {
            headers: {
              'Content-Type': 'application/vnd.api+json',
              Authorization: 'Basic Zm9vOmJhcg==',
              'Accept-Language': '*'
            },
            method: 'UPDATE'
          },
          'UPDATE',
          { id: 1 }
        );
      });
    });
  });
});
