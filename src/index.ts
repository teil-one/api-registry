import { parse } from 'rfc6570-uri-template';

class Registry {
  private readonly _apis: Map<string, Api>;

  constructor() {
    this._apis = new Map<string, Api>();
  }

  public api(name: string, baseURL?: string, headers?: { [key: string]: string }): Api {
    let api = this._apis.get(name);

    if (api == null) {
      if (baseURL == null) {
        throw new Error('baseURL must be defined in the first API declaration');
      }

      // TODO: Add headers support
      const apiConfig: ApiConfig = {
        baseURL: baseURL.replace(/\/$/, ''), // Remove trailing slash
        headers
      };

      api = new Api(apiConfig);

      this._apis.set(name, api);
    }

    return api;
  }
}

class Api {
  private readonly _apiConfig: ApiConfig;
  private readonly _endpoints: Map<string, (data: any) => Promise<Response>>;
  private readonly _cache: Map<string, { expires: Number; response: Promise<Response> }>;

  constructor(apiConfig: ApiConfig) {
    this._apiConfig = apiConfig;
    this._endpoints = new Map<string, (data: any) => Promise<Response>>();
    this._cache = new Map<string, { expires: Number; response: Promise<Response> }>();
  }

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  public endpoint<T extends Record<string, PrimitiveValue> | void, TResult>(
    url: string,
    method: string,
    ttl: number
  ): (data: T) => Promise<TypedResponse<TResult>> {
    url = url.replace(/^\//, '');
    const endpointId = `${method} ${url}`;

    let request = this._endpoints.get(endpointId) as (data: T) => Promise<TypedResponse<TResult>>;

    if (request == null) {
      const fullUrl: string = this._apiConfig.baseURL == null ? url : `${this._apiConfig.baseURL}/${url}`;

      const requestConfig: RequestConfig = {
        url: fullUrl,
        request: new Request(fullUrl, { method }),
        ttl
      };

      request = (
        this.request as (
          ...args: Parameters<(endpointConfig: RequestConfig, data: T) => Promise<TypedResponse<TResult>>>
        ) => Promise<TypedResponse<TResult>>
      ).bind(this, requestConfig);

      this._endpoints.set(endpointId, request);
    }

    return request;
  }

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  private async request<T extends Record<string, PrimitiveValue> | void, TResult>(
    endpointConfig: RequestConfig,
    data: T
  ): Promise<TypedResponse<TResult>> {
    const requestConfig: RequestConfig = { ...endpointConfig };

    if (data != null) {
      // TODO: Catch parsing errors when the URL has no template
      const url = parse(requestConfig.url).expand(data);
      requestConfig.request = new Request(url, requestConfig.request);
    }

    const requestKey = await Api.getRequestKey(requestConfig);

    const cachedResponse = this._cache.get(requestKey);
    if (cachedResponse != null && cachedResponse.expires > performance.now()) {
      return await cachedResponse.response;
    }

    const responsePromise = fetch(requestConfig.request);
    this._cache.set(requestKey, { expires: performance.now() + (endpointConfig.ttl ?? 0), response: responsePromise });

    const response = await responsePromise;
    return response;
  }

  private static async getRequestKey(request: RequestConfig): Promise<string> {
    if (request.request.url == null) {
      throw new Error('request.request.url is not defined');
    }

    let key = request.request.url;
    if (request.request.bodyUsed) {
      const requestData = await request.request.json();
      key += '|' + new URLSearchParams(requestData as Record<string, string>).toString();
    }

    return key;
  }
}

const ApiRegistry = new Registry();

export { ApiRegistry };

class ApiConfig {
  baseURL: string;
  headers?: { [key: string]: string };
}

class RequestConfig {
  url: string;
  request: Request;
  ttl?: number;
}

class TypedResponse<T> extends Response {
  override async json(): Promise<T> {
    const response = await super.json();

    return response as T;
  }
}

type PrimitiveValue = string | number | boolean | null;
