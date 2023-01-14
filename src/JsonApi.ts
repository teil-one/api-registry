import { JsonEndpoint } from './JsonEndpoint';
import { RequestOptions } from './RequestOptions';
import { RequestInterceptor } from './RequestInterceptor';

export class JsonApi {
  private readonly _baseURL: string;
  private readonly _options: RequestOptions[];
  private readonly _interceptors: RequestInterceptor[];

  constructor(baseURL: string) {
    this._baseURL = baseURL;
    this._options = [];
    this._interceptors = [];
  }

  public get baseURL(): string {
    return this._baseURL;
  }

  public endpoint(url: string, method: string = 'GET'): JsonEndpoint {
    url = url.replace(/^\//, ''); // Remove leading slash
    url = url.replace(/\/$/, ''); // Remove trailing slash;

    const separator = url.startsWith('{?') ? '' : '/';
    const fullUrl: string = `${this._baseURL}${separator}${url}`;

    const endpoint = new JsonEndpoint(fullUrl, this._options, this._interceptors);

    if (method.toLowerCase() !== 'get') {
      // Don't add the default GET method
      endpoint.withOptions({ method });
    }

    return endpoint;
  }

  public withOptions(apiOptions: RequestOptions): JsonApi {
    this._options.push(apiOptions);

    return this;
  }

  public intercept(interceptor: RequestInterceptor): JsonApi {
    this._interceptors.push(interceptor);

    return this;
  }
}
