import { parse } from 'rfc6570-uri-template';

class Registry {
  private readonly _apis: Map<string, Api>;

  constructor() {
    this._apis = new Map<string, Api>();
  }

  public api(name: string, baseURL?: string, options?: RequestInit | (() => RequestInit)): Api {
    let api = this._apis.get(name);

    if (api == null) {
      if (baseURL == null) {
        throw new Error('baseURL must be defined in the first API declaration');
      }

      const apiConfig: ApiConfig = {
        baseURL: baseURL.replace(/\/$/, ''), // Remove trailing slash
        options: options ?? {}
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
  public endpoint<TResult, T extends Record<string, PrimitiveValue> | void = void>(
    url: string,
    method: string = 'GET',
    ttl: number = 0
  ): (data?: T, options?: RequestInit | (() => RequestInit)) => Promise<TypedResponse<TResult>> {
    url = url.replace(/^\//, '');
    const endpointId = `${method} ${url}`;

    let request = this._endpoints.get(endpointId) as (data?: T) => Promise<TypedResponse<TResult>>;

    if (request == null) {
      const apiRequestOptions =
        this._apiConfig.options instanceof Function ? this._apiConfig.options() : this._apiConfig.options;
      const fullUrl: string = this._apiConfig.baseURL == null ? url : `${this._apiConfig.baseURL}/${url}`;

      const requestConfig: RequestConfig = {
        url: fullUrl,
        request: new Request(fullUrl, { ...apiRequestOptions, method }),
        ttl
      };

      request = (
        this.request as (
          ...args: Parameters<
            (
              endpointConfig: RequestConfig,
              data?: T,
              options?: RequestInit | (() => RequestInit)
            ) => Promise<TypedResponse<TResult>>
          >
        ) => Promise<TypedResponse<TResult>>
      ).bind(this, requestConfig);

      this._endpoints.set(endpointId, request);
    }

    return request;
  }

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  private async request<TResult, T extends Record<string, PrimitiveValue> | void>(
    endpointConfig: RequestConfig,
    data?: T,
    options?: RequestInit | (() => RequestInit)
  ): Promise<TypedResponse<TResult>> {
    const requestConfig: RequestConfig = { ...endpointConfig };

    if (data != null) {
      try {
        const url = parse(requestConfig.url).expand(data);
        requestConfig.request = new Request(url, requestConfig.request);
      } catch {}
    }

    const requestKey = await Api.getRequestKey(requestConfig);

    const cachedResponse = this._cache.get(requestKey);
    if (cachedResponse != null && cachedResponse.expires > performance.now()) {
      return await cachedResponse.response;
    }

    let request = requestConfig.request;
    if (options != null) {
      const requestOptions = options instanceof Function ? options() : options;
      request = new Request(requestConfig.request, requestOptions);
    }

    const responsePromise = fetch(request);
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
  options: RequestInit | (() => RequestInit);
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
