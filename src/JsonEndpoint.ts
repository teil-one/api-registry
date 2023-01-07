import { parse } from 'rfc6570-uri-template';
import { ApiRequestCache } from './ApiRequestCache';
import { JsonResponse } from './JsonResponse';
import { JsonResponseError } from './JsonResponseError';
import { RequestInterceptor } from './RequestInterceptor';
import { RequestOptions } from './RequestOptions';
import { SimpleObject } from './SimpleObject';

class JsonEndpointBase {
  private readonly _cache: ApiRequestCache;
  private readonly _parentOptions: RequestOptions[];
  private readonly _parentInterceptors: RequestInterceptor[];

  protected readonly _url: string;
  protected readonly _options: RequestOptions[];
  protected readonly _interceptors: RequestInterceptor[];
  protected _ttl: number;

  constructor(
    input: string | JsonEndpointBase,
    parentOptions: RequestOptions[],
    parentInterceptors: RequestInterceptor[]
  ) {
    if (typeof input === 'string') {
      this._cache = new Map<string, { expires: Number; response: Promise<Response> }>();
      this._parentOptions = parentOptions;
      this._parentInterceptors = parentInterceptors;

      this._url = input;
      this._options = [];
      this._interceptors = [];
      this._ttl = 0;
    } else {
      this._cache = input._cache;
      this._parentOptions = input._parentOptions;
      this._parentInterceptors = input._parentInterceptors;

      this._url = input._url;
      this._options = input._options;
      this._interceptors = input._interceptors;
      this._ttl = input._ttl;
    }
  }

  protected async send(data?: Record<string, unknown>, init?: RequestOptions): Promise<Response> {
    const request = await this.buildRequest(data, init);

    const requestKey = await getRequestKey(request, data);
    const cachedResponse = this._cache.get(requestKey);
    if (cachedResponse != null && cachedResponse.expires >= performance.now()) {
      return await cachedResponse.response;
    }

    const responsePromise = this.fetchWithInterceptors(
      request,
      [...this._parentInterceptors, ...this._interceptors],
      data,
      init
    );

    this._cache.set(requestKey, { expires: performance.now() + this._ttl, response: responsePromise });

    return await responsePromise;
  }

  private async buildRequest(data?: Record<string, unknown>, init?: RequestOptions): Promise<Request> {
    let request: Request;

    const endpointOptions = await this.reduceOptions(init);

    if (data == null) {
      request = new Request(this._url, endpointOptions);
    } else {
      let url: string = this._url;
      try {
        url = parse(this._url).expand(data);
      } catch {}

      const method = (endpointOptions.method ?? 'get').toLowerCase();
      if (['get', 'head'].includes(method)) {
        // GET and HEAD requests cannot have body
        request = new Request(url, endpointOptions);
      } else {
        request = new Request(url, {
          ...endpointOptions,
          headers: { 'Content-Type': 'application/json', ...endpointOptions.headers },
          body: JSON.stringify(data)
        });
      }
    }

    return request;
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

  private async reduceOptions(requestOptions?: RequestOptions): Promise<RequestInit> {
    const combinedOptions =
      requestOptions == null
        ? [...this._parentOptions, ...this._options]
        : [...this._parentOptions, ...this._options, requestOptions];

    const optionsPromises = combinedOptions.map(async (item) =>
      item instanceof Function ? await item() : await Promise.resolve(item)
    );
    const allOptions = await Promise.all(optionsPromises);

    let result: RequestInit = {};

    for (const options of allOptions) {
      result = { ...result, ...options, headers: { ...result.headers, ...options.headers } };
    }

    return result;
  }

  private async fetchWithInterceptors(
    request: Request,
    interceptors: RequestInterceptor[],
    data?: Record<string, unknown>,
    init?: RequestOptions
  ): Promise<Response> {
    const interceptor = interceptors.pop();
    if (interceptor != null) {
      return await interceptor(
        request,
        async () => await this.fetchWithInterceptors(await this.buildRequest(data, init), interceptors, data, init)
      );
    }

    return await fetch(request);
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
    return new JsonEndpointWithData<TResult, T>(this, [], []);
  }

  public returns<TNewResult>(): JsonEndpoint<TNewResult> {
    return this as unknown as JsonEndpoint<TNewResult>;
  }

  public withOptions(endpointOptions: RequestOptions): JsonEndpoint<TResult> {
    this._options.push(endpointOptions);

    return this;
  }

  public intercept(interceptor: RequestInterceptor): JsonEndpoint<TResult> {
    this._interceptors.push(interceptor);

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

    return this;
  }

  public intercept(interceptor: RequestInterceptor): JsonEndpointWithData<TResult, T> {
    this._interceptors.push(interceptor);

    return this;
  }

  public withTTL(ttl: number): JsonEndpointWithData<TResult, T> {
    this._ttl = ttl;

    return this;
  }
}

async function getRequestKey(request: Request, data?: Record<string, unknown>): Promise<string> {
  let key = request.url;

  key += '|' + request.method;

  if (data != null) {
    key += '|' + new URLSearchParams(data as Record<string, string>).toString();
  }

  return key;
}
