export function getRequestKey(request: Request): string {
  // Only get and head requests can be cached
  if (!['get', 'head'].includes(request.method.toLowerCase())) {
    return getUniqueString();
  }

  let key = request.url;

  key += '|' + request.method;

  // TODO: Use the 'Vary' response header value to match cache items instead of matching all headers
  // See https://www.rfc-editor.org/rfc/rfc7231#section-7.1.4
  let headersKey = '';
  request.headers.forEach((value, key) => {
    headersKey += `(${key}, ${value})`;
  });
  if (headersKey.length > 0) {
    key += '|' + headersKey;
  }

  return key;
}

function getUniqueString(): string {
  return `${Math.random()}${new Date().getTime()}`;
}
