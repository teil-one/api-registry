export class UserData {
  data: User;
}

export class UsersData {
  data: User[];
}

export class NewUser {
  email: string;
}

export class User extends NewUser {
  id: number;
}

export class CreatedUser extends User {
  createdAt: string;
}

export class UpdatedUser extends NewUser {
  updatedAt: string;
}
