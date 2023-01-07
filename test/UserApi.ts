import { JsonApiRegistry } from '../src';
import { CreatedUser, NewUser, UpdatedUser, User, UserData, UsersData } from './User';

export const API_CONFIG = {
  apiName: 'user-api',
  apiUrl: 'https://reqres.in/api'
};

let authorization = 'Basic Sm9objpEb2U=';

const authOptions = async (): Promise<RequestInit> =>
  await Promise.resolve({ headers: { Authorization: authorization } });

function updateAuthorization(): void {
  authorization =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
}

export class UserApi {
  private readonly _api = JsonApiRegistry.api(API_CONFIG.apiName, API_CONFIG.apiUrl)
    .withOptions(authOptions)
    .intercept(async (_: Request, next: () => Promise<Response>) => {
      let response = await next();
      if (response.status === 401) {
        updateAuthorization();
        response = await next();
      }

      return response;
    });

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
