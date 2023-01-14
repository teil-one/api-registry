export async function getRequestKey(request: Request): Promise<string> {
  let key = request.url;

  key += '|' + request.method;

  let headersKey = '';
  request.headers.forEach((value, key) => {
    headersKey += `${key}:${value}`;
  });
  if (headersKey.length > 0) {
    key += '|' + headersKey;
  }

  if (request.body != null) {
    const clone = request.clone();

    const body = Buffer.from(await clone.arrayBuffer()).toString('base64');
    key += '|' + body;
  }

  return key;
}
