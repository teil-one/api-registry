import { ApiRegistry } from '../src';
import { UserData, UsersData } from './User';

export const API_CONFIG = {
  apiName: 'user-api',
  apiUrl: 'https://reqres.in/api'
};

export class UserApi {
  private readonly _api = ApiRegistry.api(API_CONFIG.apiName, API_CONFIG.apiUrl);

  public readonly getUsers = this._api.jsonEndpoint<UsersData>('users');
  public readonly getUser = this._api.jsonEndpoint<UserData, { id: number }>('users/{id}');
}
