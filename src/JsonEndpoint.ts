import { parse } from 'rfc6570-uri-template';
import { JsonResponse } from './JsonResponse';
import { JsonResponseError } from './JsonResponseError';
import { RequestInterceptor } from './RequestInterceptor';
import { RequestOptions } from './RequestOptions';
import { SimpleObject } from './SimpleObject';
import './memory-caches';
import { getRequestKey } from './getRequestKey';
import { JsonApi } from './JsonApi';

const runningRequests = new Map<string, Promise<Response>>();

class JsonEndpointBase {
  protected readonly _api: JsonApi;
  protected readonly _path: string;
  protected readonly _options: RequestOptions[];
  protected readonly _interceptors: RequestInterceptor[];

  protected _ttl: number;

  constructor(input: string | JsonEndpointBase, api: JsonApi) {
    if (typeof input === 'string') {
      this._api = api;

      this._path = input;
      this._options = [];
      this._interceptors = [];
      this._ttl = 0;
    } else {
      this._api = input._api;

      this._path = input._path;
      this._options = input._options;
      this._interceptors = input._interceptors;
      this._ttl = input._ttl;
    }
  }

  protected async send(data?: Record<string, unknown>, init?: RequestOptions): Promise<Response> {
    const request = await this.buildRequest(data, init);

    if (this._ttl <= 0) {
      return await this.fetchWithInterceptors(request, [...this._api.interceptors, ...this._interceptors], data, init);
    }

    const requestOrigin = new URL(request.url).origin;
    const cache = await caches.open(requestOrigin);

    const requestKey = getRequestKey(request);

    const responsePromise = (async (): Promise<Response> => {
      const runningRequest = runningRequests.get(requestKey);
      if (runningRequest != null) {
        return (await runningRequest).clone();
      }

      const cachedResponse = await cache.match(request);
      if (cachedResponse != null) {
        const fetched = cachedResponse.headers.get('x-api-registry-fetched-on');
        if (fetched != null && parseFloat(fetched) + this._ttl >= new Date().getTime()) {
          return cachedResponse.clone();
        }
      }

      const response = await this.fetchWithInterceptors(
        request,
        [...this._api.interceptors, ...this._interceptors],
        data,
        init
      );

      const responseCopy = response.clone();
      const responseHeaders = new Headers(responseCopy.headers);
      responseHeaders.append('x-api-registry-fetched-on', new Date().getTime().toString());
      const responseForCaching = new Response(await responseCopy.blob(), {
        headers: responseHeaders,
        status: responseCopy.status,
        statusText: responseCopy.statusText
      });

      await cache.put(request, responseForCaching);

      setTimeout(() => {
        void cache.delete(request);
      }, this._ttl);

      return response;
    })();

    runningRequests.set(requestKey, responsePromise);
    const response = await responsePromise;
    runningRequests.delete(requestKey);

    return response;
  }

  private async getFullUrl(): Promise<string> {
    const baseUrl = await this._api.getBaseUrl();

    if (baseUrl == null) {
      throw new Error(`Base URL is not defined for the API "${this._api.name}"`);
    }

    const separator = this._path.startsWith('{?') ? '' : '/';
    const fullUrl = `${baseUrl}${separator}${this._path}`;

    return fullUrl;
  }

  private async buildRequest(data?: Record<string, unknown>, init?: RequestOptions): Promise<Request> {
    let request: Request;

    const fullUrl = await this.getFullUrl();
    const endpointOptions = await this.reduceOptions(init);

    if (data == null) {
      request = new Request(fullUrl, endpointOptions);
    } else {
      let url: string = fullUrl;
      try {
        url = parse(fullUrl).expand(data);
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
        ? [...this._api.options, ...this._options]
        : [...this._api.options, ...this._options, requestOptions];

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
    return new JsonEndpointWithData<TResult, T>(this, this._api);
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

  public withCache(ttl: number): JsonEndpoint<TResult> {
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

  public withCache(ttl: number): JsonEndpointWithData<TResult, T> {
    this._ttl = ttl;

    return this;
  }
}
