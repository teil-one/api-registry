import { JsonEndpoint } from './JsonEndpoint';
import { RequestOptions } from './RequestOptions';
import { RequestInterceptor } from './RequestInterceptor';
import { BaseUrl } from './BaseUrl';

export class JsonApi {
  private readonly _name: string;
  private readonly _options: RequestOptions[];
  private readonly _interceptors: RequestInterceptor[];

  private _baseURL?: BaseUrl;

  constructor(name: string) {
    this._name = name;
    this._options = [];
    this._interceptors = [];
  }

  public get name(): string {
    return this._name;
  }

  public async getBaseUrl(): Promise<string | undefined> {
    if (this._baseURL == null) {
      return this._baseURL;
    }

    let baseURL: string;
    if (this._baseURL instanceof Function) {
      baseURL = await this._baseURL();
    } else {
      baseURL = this._baseURL;
    }

    if (baseURL != null) {
      baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash;
      baseURL = baseURL.toLowerCase();
    }

    return baseURL;
  }

  public get baseURL(): BaseUrl | undefined {
    return this._baseURL;
  }

  public set baseURL(value: BaseUrl | undefined) {
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
