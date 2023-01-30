import { BaseUrl } from './BaseUrl';
import { JsonApi } from './JsonApi';

export class JsonApiRegistry {
  private readonly _apis: Map<string, JsonApi>;

  constructor() {
    this._apis = new Map<string, JsonApi>();
  }

  public api(name: string, baseURL?: BaseUrl): JsonApi {
    let api = this._apis.get(name);

    if (api == null) {
      api = new JsonApi(name);
      api.baseURL = baseURL;

      this._apis.set(name, api);
    } else if (api.baseURL == null) {
      api.baseURL = baseURL;
    } else if (
      baseURL != null &&
      (baseURL instanceof Function ||
        api.baseURL instanceof Function ||
        api.baseURL.toLowerCase().replace(/\/$/, '') !== baseURL.toLocaleLowerCase().replace(/\/$/, ''))
    ) {
      throw new Error(`API ${name} is already registered with another URL ${api.baseURL.toString()}`);
    }

    return api;
  }
}
