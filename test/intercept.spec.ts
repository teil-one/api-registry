import { JsonApiRegistry, JsonApi, RequestOptions, RequestInterceptor } from '../src';
import { jest } from '@jest/globals';
import { Mock } from 'jest-mock';

const fetch = jest.fn(async () => await Promise.resolve(new Response()));
global.fetch = fetch;

function createEmptyInterceptor(): RequestInterceptor {
  return jest.fn(async (_: Request, next: () => Promise<Response>): Promise<Response> => await next());
}

describe('API with intercept', () => {
  let api: JsonApi;
  let apiInterceptor1: RequestInterceptor;

  beforeAll(() => {
    apiInterceptor1 = createEmptyInterceptor();
    api = JsonApiRegistry.api('rest-api', 'http://foo.bar/api').intercept(apiInterceptor1);
  });

  describe('And endpoint with intercept and data', () => {
    let getUser: (data: { id: number }, requestOptions?: RequestOptions) => Promise<Response>;
    let endpointInterceptor1: RequestInterceptor;

    beforeAll(async () => {
      endpointInterceptor1 = createEmptyInterceptor();
      getUser = api.endpoint('user/{id}').receives<{ id: number }>().intercept(endpointInterceptor1).build();
    });

    describe('Request is called', () => {
      beforeEach(async () => {
        await getUser({ id: 1 });
      });

      test('API and endpoint interceptors are called in the right order', async () => {
        expect(apiInterceptor1).toHaveBeenCalledTimes(1);
        expect(endpointInterceptor1).toHaveBeenCalledTimes(1);

        expect((endpointInterceptor1 as Mock<RequestInterceptor>).mock.invocationCallOrder[0]).toBeLessThan(
          (apiInterceptor1 as Mock<RequestInterceptor>).mock.invocationCallOrder[0]
        );
      });
    });

    describe('Added more API interceptors', () => {
      let apiInterceptor2: RequestInterceptor;

      beforeAll(() => {
        apiInterceptor2 = createEmptyInterceptor();
        JsonApiRegistry.api('rest-api').intercept(apiInterceptor2);
      });

      describe('Request is called', () => {
        beforeEach(async () => {
          await getUser({ id: 1 });
        });

        test('API and endpoint interceptors are called in the right order', async () => {
          expect(apiInterceptor1).toHaveBeenCalledTimes(1);
          expect(apiInterceptor2).toHaveBeenCalledTimes(1);
          expect(endpointInterceptor1).toHaveBeenCalledTimes(1);

          expect((endpointInterceptor1 as Mock<RequestInterceptor>).mock.invocationCallOrder[0]).toBeLessThan(
            (apiInterceptor2 as Mock<RequestInterceptor>).mock.invocationCallOrder[0]
          );

          expect((apiInterceptor2 as Mock<RequestInterceptor>).mock.invocationCallOrder[0]).toBeLessThan(
            (apiInterceptor1 as Mock<RequestInterceptor>).mock.invocationCallOrder[0]
          );
        });
      });
    });
  });

  describe('And endpoint with intercept', () => {
    let getUsers: () => Promise<Response>;
    let endpointInterceptor1: RequestInterceptor;

    beforeAll(async () => {
      endpointInterceptor1 = createEmptyInterceptor();
      getUsers = api.endpoint('users').intercept(endpointInterceptor1).build();
    });

    describe('Request is called', () => {
      beforeEach(async () => {
        await getUsers();
      });

      test('API and endpoint interceptors are called in the right order', async () => {
        expect(apiInterceptor1).toHaveBeenCalledTimes(1);
        expect(endpointInterceptor1).toHaveBeenCalledTimes(1);

        expect((endpointInterceptor1 as Mock<RequestInterceptor>).mock.invocationCallOrder[0]).toBeLessThan(
          (apiInterceptor1 as Mock<RequestInterceptor>).mock.invocationCallOrder[0]
        );
      });
    });
  });
});
