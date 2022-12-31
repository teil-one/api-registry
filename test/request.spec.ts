import { jest } from '@jest/globals';
import { JsonApiRegistry } from '../src/index';

const fetch = jest.fn(async () => await Promise.resolve(new Response()));
global.fetch = fetch;

const headers = {
  'Content-Type': 'application/json',
  Authorization:
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
};

const apiRequestOptions: RequestInit = {
  cache: 'reload',
  credentials: 'include',
  headers,
  keepalive: true,
  mode: 'no-cors',
  redirect: 'error',
  referrer: 'about:no-referrer',
  referrerPolicy: 'same-origin',
  signal: new AbortController().signal,
  integrity: 'sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC'
};

const requestOptions: RequestInit = {
  cache: 'reload',
  credentials: 'include',
  headers,
  keepalive: true,
  mode: 'no-cors',
  redirect: 'error',
  referrer: 'about:no-referrer',
  referrerPolicy: 'same-origin',
  signal: new AbortController().signal,
  integrity: 'sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC',
  method: 'POST'
};

describe('Simple API request options', () => {
  const restApi = JsonApiRegistry.api('rest-api-simple-options', 'http://foo.bar/api', apiRequestOptions);

  describe('Endpoint is called with POST', () => {
    beforeEach(async () => {
      const apiCall = restApi.endpoint('/call', 'post').returns<boolean>().build();
      await apiCall();
    });

    test('Fetch is called with the same request options', async () => {
      await validateFetchRequest('http://foo.bar/api/call', apiRequestOptions, 'POST');
    });
  });

  describe('Endpoint is called with default method', () => {
    beforeEach(async () => {
      const apiCall = restApi.endpoint('/call').returns<boolean>().build();
      await apiCall();
    });

    test('Fetch is called with GET', () => {
      expect(fetch).toHaveBeenNthCalledWith(1, expect.objectContaining({ method: 'GET' }));
    });
  });

  describe('Endpoint is called with custom options', () => {
    const localRequestOptions: RequestInit = { keepalive: false, method: 'POST' };

    beforeEach(async () => {
      const apiCall = restApi.endpoint('/call').returns<boolean>().build();
      await apiCall(localRequestOptions);
    });

    test('Fetch is called with merged api and request options', async () => {
      await validateFetchRequest('http://foo.bar/api/call', { ...apiRequestOptions, ...localRequestOptions });
    });
  });

  describe('Endpoint is called with custom options factory', () => {
    const localRequestOptions: RequestInit = { keepalive: false, method: 'POST' };

    beforeEach(async () => {
      const apiCall = restApi.endpoint('/call').returns<boolean>().build();
      await apiCall(async () => await Promise.resolve(localRequestOptions));
    });

    test('Fetch is called with merged api and request options', async () => {
      await validateFetchRequest('http://foo.bar/api/call', { ...apiRequestOptions, ...localRequestOptions });
    });
  });

  describe('Endpoint is called with custom headers', () => {
    const localRequestOptions: RequestInit = {
      headers: { Authorization: 'Basic Zm9vOmJhcg==', 'Accept-Language': '*' }
    };

    beforeEach(async () => {
      const apiCall = restApi.endpoint('/call').returns<boolean>().build();
      await apiCall(localRequestOptions);
    });

    test('Fetch is called with merged headers from api and request options', async () => {
      await validateFetchRequest('http://foo.bar/api/call', {
        ...apiRequestOptions,
        ...localRequestOptions,
        headers: { ...apiRequestOptions.headers, ...localRequestOptions.headers }
      });
    });
  });

  describe('Endpoint is called with data and custom options', () => {
    const localRequestOptions: RequestInit = { keepalive: false, method: 'POST' };

    beforeEach(async () => {
      const getUser = restApi.endpoint('/users/{id}').receives<{ id: number }>().returns<boolean>().build();
      await getUser({ id: 1 }, localRequestOptions);
    });

    test('Fetch is called with merged api options, request options, and data', async () => {
      await validateFetchRequest(
        'http://foo.bar/api/users/1',
        { ...apiRequestOptions, ...localRequestOptions },
        'POST',
        { id: 1 }
      );
    });
  });
});

describe('API request options factory', () => {
  const restApi = JsonApiRegistry.api(
    'rest-api-options-factory',
    'http://foo.bar/api',
    async () => await Promise.resolve(apiRequestOptions)
  );

  describe('Endpoint is called with GET', () => {
    beforeEach(async () => {
      const apiCall = restApi.endpoint('/call', 'get').returns<boolean>().build();
      await apiCall();
    });

    test('Fetch is called with the same request options', async () => {
      await validateFetchRequest('http://foo.bar/api/call', apiRequestOptions);
    });

    test('Fetch is called with GET', () => {
      expect(fetch).toHaveBeenNthCalledWith(1, expect.objectContaining({ method: 'GET' }));
    });
  });
});

describe('No API request options', () => {
  const restApi = JsonApiRegistry.api('rest-api-no-options', 'http://foo.bar/api');

  describe('Endpoint is called with DELETE', () => {
    beforeEach(async () => {
      const apiCall = restApi.endpoint('/call', 'delete').returns<boolean>().build();
      await apiCall();
    });

    test('Fetch is called with DELETE', () => {
      expect(fetch).toHaveBeenNthCalledWith(1, expect.objectContaining({ method: 'DELETE' }));
    });

    test('Fetch is called without headers', async () => {
      await validateFetchRequest('http://foo.bar/api/call', { method: 'DELETE', headers: undefined });
    });
  });

  describe('Endpoint is called with custom options', () => {
    beforeEach(async () => {
      const getUser = restApi.endpoint('/users/{id}').receives<{ id: number }>().returns<boolean>().build();

      await getUser({ id: 1 }, requestOptions);
    });

    test('Fetch is called with the same request options', async () => {
      await validateFetchRequest('http://foo.bar/api/users/1', requestOptions, requestOptions.method, { id: 1 });
    });
  });

  describe('Endpoint is called with GET and data', () => {
    beforeEach(async () => {
      const getUser = restApi.endpoint('/users/{id}', 'get').receives<{ id: number }>().returns<boolean>().build();

      await getUser({ id: 1 });
    });

    test('Fetch is called without body', async () => {
      await validateFetchRequest('http://foo.bar/api/users/1', { method: 'GET' }, 'GET', undefined);
    });
  });

  describe('Endpoint is called with HEAD and data', () => {
    beforeEach(async () => {
      const getUser = restApi.endpoint('/users/{id}', 'head').receives<{ id: number }>().returns<boolean>().build();

      await getUser({ id: 1 });
    });

    test('Fetch is called without body', async () => {
      await validateFetchRequest('http://foo.bar/api/users/1', { method: 'HEAD' }, 'HEAD', undefined);
    });
  });

  describe('Endpoint is called with POST and data', () => {
    beforeEach(async () => {
      const getUser = restApi.endpoint('/users/{id}', 'post').receives<{ id: number }>().returns<boolean>().build();

      await getUser({ id: 1 });
    });

    test('Fetch is called with body', async () => {
      await validateFetchRequest('http://foo.bar/api/users/1', { method: 'POST' }, 'POST', { id: 1 });
    });
  });

  describe('Endpoint is called with options factory', () => {
    beforeEach(async () => {
      const getUser = restApi.endpoint('users/{id}').receives<{ id: number }>().returns<boolean>().build();

      await getUser({ id: 1 }, async () => await Promise.resolve(requestOptions));
    });

    test('Fetch is called with the same request options', async () => {
      await validateFetchRequest('http://foo.bar/api/users/1', requestOptions, requestOptions.method, { id: 1 });
    });
  });
});

async function validateFetchRequest(
  url: string,
  requestOptions: RequestInit,
  method?: string,
  body?: Record<string, unknown>
): Promise<void> {
  const expectedRequest = new Request(url, requestOptions);

  const calls = fetch.mock.calls;
  expect(calls).toHaveLength(1);
  expect(calls[0]).toHaveLength(1);

  const fetchRequest = (calls[0] as Request[])[0];

  expect(fetchRequest.url).toEqual(expectedRequest.url);
  expect(fetchRequest.cache).toEqual(expectedRequest.cache);
  expect(fetchRequest.credentials).toEqual(expectedRequest.credentials);
  expect(fetchRequest.keepalive).toEqual(expectedRequest.keepalive);
  expect(fetchRequest.mode).toEqual(expectedRequest.mode);
  expect(fetchRequest.redirect).toEqual(expectedRequest.redirect);
  expect(fetchRequest.referrer).toEqual(expectedRequest.referrer);
  expect(fetchRequest.referrerPolicy).toEqual(expectedRequest.referrerPolicy);
  expect(fetchRequest.signal).toEqual(expectedRequest.signal);
  expect(fetchRequest.integrity).toEqual(expectedRequest.integrity);
  expect(fetchRequest.method).toEqual(method ?? expectedRequest.method);

  if (body != null) {
    expect(await fetchRequest.json()).toEqual(body);
  } else {
    expect(fetchRequest.body).toBeFalsy();
  }

  if (expectedRequest.headers != null && expectedRequest.headers.keys.length > 0) {
    for (const [key, value] of expectedRequest.headers) {
      expect(fetchRequest.headers.get(key)).toEqual(value);
    }
  } else {
    expect(fetchRequest.headers.keys.length).toEqual(0);
  }
}
