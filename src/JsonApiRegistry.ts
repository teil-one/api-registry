import { JsonApi } from './JsonApi';

export class JsonApiRegistry {
  private readonly _apis: Map<string, JsonApi>;

  constructor() {
    this._apis = new Map<string, JsonApi>();
  }

  public api(name: string, baseURL?: string): JsonApi {
    if (baseURL != null) {
      baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash;
      baseURL = baseURL.toLowerCase();
    }

    let api = this._apis.get(name);

    if (api == null) {
      if (baseURL == null) {
        throw new Error('baseURL must be defined in the first API declaration');
      }

      api = new JsonApi(baseURL);

      this._apis.set(name, api);
    } else {
      if (baseURL != null && api.baseURL !== baseURL) {
        throw new Error(`API ${name} is already registered with another URL ${api.baseURL}`);
      }
    }

    return api;
  }
}
