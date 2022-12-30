import { parse } from 'rfc6570-uri-template';
import { ApiRequestCache } from './ApiRequestCache';
import { JsonResponse } from './JsonResponse';
import { JsonResponseError } from './JsonResponseError';
import { RequestOptions } from './RequestOptions';
import { SimpleObject } from './SimpleObject';

class JsonEndpointBase {
  private readonly _cache: ApiRequestCache;

  protected readonly _url: string;
  protected _options: RequestOptions[];
  protected _ttl: number;

  constructor(input: string | JsonEndpointBase) {
    if (typeof input === 'string') {
      this._cache = new Map<string, { expires: Number; response: Promise<Response> }>();

      this._url = input;
      this._options = [];
      this._ttl = 0;
    } else {
      this._cache = input._cache;

      this._url = input._url;
      this._options = input._options;
      this._ttl = input._ttl;
    }
  }

  protected async send(data?: Record<string, unknown>, init?: RequestOptions): Promise<Response> {
    let request: Request | null = null;

    const endpointOptions = await this.reduceOptions();

    if (data == null) {
      request = new Request(this._url, endpointOptions);
    } else {
      let url: string = this._url;
      try {
        url = parse(this._url).expand(data);
      } catch {}

      if (['get', 'head'].includes((endpointOptions.method ?? 'get').toLowerCase())) {
        // GET and HEAD requests cannot have body
        request = new Request(url, endpointOptions);
      } else {
        request = new Request(url, { ...endpointOptions, body: JSON.stringify(data) });
      }
    }

    if (request == null) {
      throw new Error('Request build failed');
    }

    if (init != null) {
      const requestOptions = init instanceof Function ? await init() : init;
      request = new Request(request, requestOptions);
    }

    const requestKey = await getRequestKey(request);
    const cachedResponse = this._cache.get(requestKey);
    if (cachedResponse != null && cachedResponse.expires > performance.now()) {
      return await cachedResponse.response;
    }

    const responsePromise = fetch(request);

    this._cache.set(requestKey, { expires: performance.now() + this._ttl, response: responsePromise });

    return await responsePromise;
  }

  protected async sendAndParse<T>(data?: Record<string, unknown>, init?: RequestOptions): Promise<T> {
    const response = await this.send(data, init);

    if (!response.ok) {
      throw new JsonResponseError(response, 'request failed');
    }

    try {
      const json = await response.json();
      return json;
    } catch (e: unknown) {
      throw new JsonResponseError(response, 'response read failed', e as Error);
    }
  }

  private async reduceOptions(): Promise<RequestInit> {
    const optionsPromises = this._options.map(async (item) =>
      item instanceof Function ? await item() : await Promise.resolve(item)
    );
    const allOptions = await Promise.all(optionsPromises);

    let result: RequestInit = {};

    for (const options of allOptions) {
      result = { ...result, ...options };
    }

    return result;
  }
}

export class JsonEndpoint<TResult = void> extends JsonEndpointBase {
  public build(): (requestOptions?: RequestOptions) => Promise<JsonResponse<TResult>> {
    return async (requestOptions?: RequestOptions) => await super.send(undefined, requestOptions);
  }

  public buildWithParse(): (requestOptions?: RequestOptions) => Promise<TResult> {
    return async (requestOptions?: RequestOptions) => await super.sendAndParse(undefined, requestOptions);
  }

  public receives<T extends SimpleObject<T>>(): JsonEndpointWithData<TResult, T> {
    return new JsonEndpointWithData<TResult, T>(this);
  }

  public returns<TNewResult>(): JsonEndpoint<TNewResult> {
    return this as unknown as JsonEndpoint<TNewResult>;
  }

  public withOptions(endpointOptions: RequestOptions): JsonEndpoint<TResult> {
    this._options.push(endpointOptions);

    return this;
  }

  public withTTL(ttl: number): JsonEndpoint<TResult> {
    this._ttl = ttl;

    return this;
  }
}

class JsonEndpointWithData<TResult, T extends SimpleObject<T>> extends JsonEndpointBase {
  public build(): (data: T, requestOptions?: RequestOptions) => Promise<JsonResponse<TResult>> {
    return async (data: T, requestOptions?: RequestOptions) => await super.send(data, requestOptions);
  }

  public buildWithParse(): (data: T, requestOptions?: RequestOptions) => Promise<TResult> {
    return async (data: T, requestOptions?: RequestOptions) => await super.sendAndParse(data, requestOptions);
  }

  public returns<TNewResult>(): JsonEndpointWithData<TNewResult, T> {
    return this as unknown as JsonEndpointWithData<TNewResult, T>;
  }

  public withOptions(endpointOptions: RequestOptions): JsonEndpointWithData<TResult, T> {
    this._options.push(endpointOptions);

    return new JsonEndpointWithData<TResult, T>(this);
  }

  public withTTL(ttl: number): JsonEndpointWithData<TResult, T> {
    this._ttl = ttl;

    return this;
  }
}

async function getRequestKey(request: Request): Promise<string> {
  if (request.url == null) {
    throw new Error('request.url is not defined');
  }

  let key = request.url;

  key += '|' + request.method;

  if (request.bodyUsed) {
    const requestData = await request.json();
    key += '|' + new URLSearchParams(requestData as Record<string, string>).toString();
  }

  return key;
}
