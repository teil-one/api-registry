import { JsonEndpoint } from './JsonEndpoint';
import { RequestOptions } from './RequestOptions';

export class JsonApi {
  private readonly _baseURL: string;
  private readonly _options: RequestOptions;
  private readonly _endpoints: Map<string, JsonEndpoint>;

  constructor(baseURL: string, options: RequestOptions) {
    this._baseURL = baseURL;
    this._options = options;
    this._endpoints = new Map<string, JsonEndpoint>();
  }

  public endpoint(url: string, method: string = 'GET', scope?: string): JsonEndpoint {
    url = url.replace(/^\//, '');
    // TODO: replace all template variables in the URL with the same name to match same urls with different var names
    const endpointKey = scope == null ? `${method} ${url}` : `${method} ${url} ${scope}`;

    let endpoint = this._endpoints.get(endpointKey);

    if (endpoint == null) {
      const fullUrl: string = this._baseURL == null ? url : `${this._baseURL}/${url}`;

      endpoint = new JsonEndpoint(fullUrl);
      endpoint.withOptions({ method });
      if (this._options != null) {
        endpoint.withOptions(this._options);
      }

      this._endpoints.set(endpointKey, endpoint);
    }

    return endpoint;
  }
}
