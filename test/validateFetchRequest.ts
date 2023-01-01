import { Mock } from 'jest-mock';

export async function validateFetchRequest(
  fetch: Mock<() => Promise<Response>>,
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

  let expectEmptyHeaders = true;
  if (expectedRequest.headers != null) {
    for (const [key, value] of expectedRequest.headers) {
      expectEmptyHeaders = false;
      expect(fetchRequest.headers.get(key)).toEqual(value);
    }
  }

  if (expectEmptyHeaders) {
    let actualHeaders = 0;
    fetchRequest.headers.forEach(() => actualHeaders++);
    expect(actualHeaders).toEqual(0);
  }
}
