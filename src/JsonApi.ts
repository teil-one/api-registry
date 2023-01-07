import { JsonEndpoint } from './JsonEndpoint';
import { RequestOptions } from './RequestOptions';
import { parse } from 'rfc6570-uri-template';
import { RequestInterceptor } from './RequestInterceptor';

export class JsonApi {
  private readonly _baseURL: string;
  private readonly _options: RequestOptions[];
  private readonly _interceptors: RequestInterceptor[];
  private readonly _endpoints: Map<string, JsonEndpoint>;

  constructor(baseURL: string) {
    this._baseURL = baseURL;
    this._options = [];
    this._interceptors = [];
    this._endpoints = new Map<string, JsonEndpoint>();
  }

  public get baseURL(): string {
    return this._baseURL;
  }

  public endpoint(url: string, method: string = 'GET'): JsonEndpoint {
    url = url.replace(/^\//, ''); // Remove leading slash
    url = url.replace(/\/$/, ''); // Remove trailing slash;

    const separator = url.startsWith('{?') ? '' : '/';
    const fullUrl: string = `${this._baseURL}${separator}${url}`;

    const endpointKey = getEndpointKey(fullUrl, method);

    let endpoint = this._endpoints.get(endpointKey);

    if (endpoint == null) {
      endpoint = new JsonEndpoint(fullUrl, this._options, this._interceptors);

      if (method.toLowerCase() !== 'get') {
        // Don't add the default GET method
        endpoint.withOptions({ method });
      }

      this._endpoints.set(endpointKey, endpoint);
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

function getEndpointKey(url: string, method: string): string {
  let expandedUrl: string;
  try {
    const template = parse(url);
    const variables = {};
    getTemplateVariables(template, variables);

    expandedUrl = template.expand(variables);
  } catch {
    expandedUrl = url;
  }

  return `${method.toLowerCase()} ${expandedUrl}`;
}

function getTemplateVariables(template: unknown, variables: Record<string, unknown>): void {
  if (template == null) {
    return;
  }

  if (Array.isArray(template)) {
    for (const item of template) {
      getTemplateVariables(item, variables);
    }
  } else if (typeof template === 'object') {
    Object.keys(template).forEach((key) => {
      if (key === 'variables') {
        const variableList = (template as any)[key];
        for (const item of variableList) {
          if (item.name != null) {
            if (variables[item.name] == null) {
              variables[item.name] = Object.keys(variables).length;
            }
          }
        }
      } else {
        const value = (template as any)[key];
        getTemplateVariables(value, variables);
      }
    });
  }
}
