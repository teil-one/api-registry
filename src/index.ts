import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { parse } from 'uri-template';

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

      const axiosInstance = axios.create({
        baseURL,
        headers
      });
      axiosInstance.interceptors.request.use(urlTemplateInterceptor());

      api = new Api(axiosInstance);

      this._apis.set(name, api);
    }

    return api;
  }
}

class Api {
  private readonly _axiosInstance: AxiosInstance;
  private readonly _endpoints: Map<string, (data: any) => Promise<AxiosResponse>>;
  private readonly _cache: Map<string, { expires: Number; response: Promise<AxiosResponse> }>;

  constructor(axiosInstance: AxiosInstance) {
    this._axiosInstance = axiosInstance;
    this._endpoints = new Map<string, (data: any) => Promise<AxiosResponse>>();
    this._cache = new Map<string, { expires: Number; response: Promise<AxiosResponse> }>();
  }

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  public endpoint<T extends Record<string, PrimitiveValue> | void, TResult>(
    url: string,
    method: Method,
    ttl: number
  ): (data: T) => Promise<AxiosResponse<TResult, T>> {
    const endpointId = `${method} ${url}`;

    let request = this._endpoints.get(endpointId) as (data: T) => Promise<AxiosResponse<TResult, T>>;

    if (request == null) {
      const requestConfig: AxiosRequestConfig<T> = {
        url,
        method,
        ttl
      };

      request = (
        this.request as (
          ...args: Parameters<(endpointConfig: AxiosRequestConfig<T>, data: T) => Promise<AxiosResponse<TResult, T>>>
        ) => Promise<AxiosResponse<TResult, T>>
      ).bind(this, requestConfig);

      this._endpoints.set(endpointId, request);
    }

    return request;
  }

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  private async request<T extends Record<string, PrimitiveValue> | void, TResult>(
    endpointConfig: AxiosRequestConfig<T>,
    data: T
  ): Promise<AxiosResponse<TResult, T>> {
    const requestConfig: AxiosRequestConfig<T> = { ...endpointConfig };
    if (data != null) {
      requestConfig.urlTemplateParams = data;
      requestConfig.data = data;
    }

    const requestKey = Api.getRequestKey(requestConfig);

    const cachedResponse = this._cache.get(requestKey);
    if (cachedResponse != null && cachedResponse.expires > performance.now()) {
      return await cachedResponse.response;
    }

    const responsePromise = this._axiosInstance.request<TResult, AxiosResponse<TResult, T>>(requestConfig);
    this._cache.set(requestKey, { expires: performance.now() + (endpointConfig.ttl ?? 0), response: responsePromise });

    const response = await responsePromise;
    return response;
  }

  private static getRequestKey(request: AxiosRequestConfig): string {
    if (request.url == null) {
      throw new Error('request.url is not defined');
    }

    let url = request.url;
    if (request.urlTemplateParams != null) {
      const urlTemplate = parse(url);
      url = urlTemplate.expand(request.urlTemplateParams);
    }

    let key = url;
    if (request.data != null) {
      key += '|' + new URLSearchParams(request.data).toString();
    }

    return key;
  }
}

const ApiRegistry = new Registry();

export { ApiRegistry };

const urlTemplateInterceptor =
  () =>
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    const { url: originalUrl, urlTemplateParams = {} } = config;

    if (originalUrl != null) {
      const url = parse(originalUrl).expand(urlTemplateParams);
      return {
        ...config,
        url,
        urlTemplateParams
      };
    }
    return config;
  };

declare module 'axios' {
  interface AxiosRequestConfig {
    urlTemplateParams?: Record<string, PrimitiveValue>;
    ttl?: number;
  }
}

type PrimitiveValue = string | number | boolean | null;
