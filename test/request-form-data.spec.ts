import { JsonApiRegistry } from '../src';
import { jest } from '@jest/globals';

const fetch = jest.fn(async () => await Promise.resolve(new Response()));
global.fetch = fetch;

describe('When endpoint is called with parameters in URL and FormData body', () => {
  beforeEach(async () => {
    const restApi = JsonApiRegistry.api('rest-api-request-form-data', 'http://foo.bar/api');

    const apiCall = restApi
      .endpoint('/{parameter}/call', 'post')
      .receives<{ parameter: number }>()
      .returns<boolean>()
      .build();

    const formData = new FormData();
    formData.append('foo', 'bar');
    await apiCall(
      { parameter: 42 },
      {
        body: formData
      }
    );
  });

  test('Fetch should be called with the parameter value in the URL', async () => {
    const calls = fetch.mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0]).toHaveLength(1);

    const actualRequest = (calls[0] as Request[])[0];

    expect(actualRequest.url).toEqual('http://foo.bar/api/42/call');
  });

  test('Fetch should be called with the body matching the form data', async () => {
    const calls = fetch.mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0]).toHaveLength(1);

    const actualRequest = (calls[0] as Request[])[0];

    const body = (await (await actualRequest.body?.getReader())?.read())?.value;
    if (body == null) {
      throw new Error();
    }
    const bodyString = Buffer.from(body).toString();

    expect(bodyString).toContain('Content-Disposition: form-data; name="foo"');
  });
});
