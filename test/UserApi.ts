import { ApiRegistry } from '../src';
import { CreatedUser, NewUser, UpdatedUser, User, UserData, UsersData } from './User';

export const API_CONFIG = {
  apiName: 'user-api',
  apiUrl: 'https://reqres.in/api'
};

export class UserApi {
  private readonly _api = ApiRegistry.api(API_CONFIG.apiName, API_CONFIG.apiUrl);

  public readonly getUsers = this._api.jsonEndpoint<UsersData>('users');
  public readonly getUser = this._api.jsonEndpoint<UserData, { id: number }>('users/{id}');
  public readonly createUser = this._api.jsonEndpoint<CreatedUser, NewUser>('users', 'post');
  public readonly updateUser = this._api.jsonEndpoint<UpdatedUser, User>('users/{id}', 'put');
  public readonly deleteUser = this._api.endpoint<null, { id: number }>('users/{id}', 'delete');
}
