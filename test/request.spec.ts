import { jest } from '@jest/globals';
import { ApiRegistry } from '../src/index';

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
  const restApi = ApiRegistry.api('rest-api-simple-options', 'http://foo.bar/api', apiRequestOptions);

  describe('Endpoint is called with POST', () => {
    beforeEach(async () => {
      const apiCall = restApi.endpoint<boolean>('/call', 'post');
      await apiCall();
    });

    test('Fetch is called with the same request options', () => {
      validateFetchRequest('http://foo.bar/api/call', apiRequestOptions, 'POST');
    });
  });

  describe('Endpoint is called with default method', () => {
    beforeEach(async () => {
      const apiCall = restApi.endpoint<boolean>('/call');
      await apiCall();
    });

    test('Fetch is called with GET', () => {
      expect(fetch).toHaveBeenNthCalledWith(1, expect.objectContaining({ method: 'GET' }));
    });
  });
});

describe('API request options factory', () => {
  const restApi = ApiRegistry.api('rest-api-options-factory', 'http://foo.bar/api', () => apiRequestOptions);

  describe('Endpoint is called with GET', () => {
    beforeEach(async () => {
      const apiCall = restApi.endpoint<boolean>('/call', 'get');
      await apiCall();
    });

    test('Fetch is called with the same request options', () => {
      validateFetchRequest('http://foo.bar/api/call', apiRequestOptions);
    });

    test('Fetch is called with GET', () => {
      expect(fetch).toHaveBeenNthCalledWith(1, expect.objectContaining({ method: 'GET' }));
    });
  });
});

describe('No API request options', () => {
  const restApi = ApiRegistry.api('rest-api-no-options', 'http://foo.bar/api');

  describe('Endpoint is called with DELETE', () => {
    beforeEach(async () => {
      const apiCall = restApi.endpoint<boolean>('/call', 'delete');
      await apiCall();
    });

    test('Fetch is called with DELETE', () => {
      expect(fetch).toHaveBeenNthCalledWith(1, expect.objectContaining({ method: 'DELETE' }));
    });
  });

  describe('Endpoint is called with custom options', () => {
    beforeEach(async () => {
      const getUser = restApi.endpoint<boolean, { id: number }>('/users/{id}');

      await getUser({ id: 1 }, requestOptions);
    });

    test('Fetch is called with the same request options', () => {
      validateFetchRequest('http://foo.bar/api/users/1', requestOptions);
    });
  });

  describe('Endpoint is called with options factory', () => {
    beforeEach(async () => {
      const getUser = restApi.endpoint<boolean, { id: number }>('users/{id}');

      await getUser({ id: 1 }, () => requestOptions);
    });

    test('Fetch is called with the same request options', () => {
      validateFetchRequest('http://foo.bar/api/users/1', requestOptions);
    });
  });
});

function validateFetchRequest(url: string, requestOptions: RequestInit, method?: string): void {
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

  for (const [key, value] of expectedRequest.headers) {
    expect(fetchRequest.headers.get(key)).toEqual(value);
  }
}
