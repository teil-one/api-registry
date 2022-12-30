import { JsonApiRegistry } from '../src';
import { CreatedUser, NewUser, UpdatedUser, User, UserData, UsersData } from './User';

export const API_CONFIG = {
  apiName: 'user-api',
  apiUrl: 'https://reqres.in/api'
};

export class UserApi {
  private readonly _api = JsonApiRegistry.api(API_CONFIG.apiName, API_CONFIG.apiUrl);

  public readonly getUsers = this._api.endpoint('users').returns<UsersData>().buildWithParse();

  public readonly getUser = this._api
    .endpoint('users/{id}')
    .receives<{ id: number }>()
    .returns<UserData>()
    .buildWithParse();

  public readonly createUser = this._api
    .endpoint('users', 'post')
    .returns<CreatedUser>()
    .receives<NewUser>()
    .buildWithParse();

  public readonly updateUser = this._api
    .endpoint('users/{id}', 'put')
    .receives<User>()
    .returns<UpdatedUser>()
    .buildWithParse();

  public readonly deleteUser = this._api.endpoint('users/{id}', 'delete').receives<{ id: number }>().build();
}
