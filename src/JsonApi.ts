import { JsonEndpoint } from './JsonEndpoint';
import { RequestOptions } from './RequestOptions';
import { RequestInterceptor } from './RequestInterceptor';

export class JsonApi {
  private readonly _name: string;
  private readonly _options: RequestOptions[];
  private readonly _interceptors: RequestInterceptor[];

  private _baseURL?: string;

  constructor(name: string) {
    this._name = name;
    this._options = [];
    this._interceptors = [];
  }

  public get name(): string {
    return this._name;
  }

  public get baseURL(): string | undefined {
    return this._baseURL;
  }

  public set baseURL(value: string | undefined) {
    this._baseURL = value;
  }

  public get options(): RequestOptions[] {
    return this._options;
  }

  public get interceptors(): RequestInterceptor[] {
    return this._interceptors;
  }

  public endpoint(url: string, method: string = 'GET'): JsonEndpoint {
    url = url.replace(/^\//, ''); // Remove leading slash
    url = url.replace(/\/$/, ''); // Remove trailing slash;

    const endpoint = new JsonEndpoint(url, this);

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
