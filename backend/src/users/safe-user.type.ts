import { UserRole, UserStatus } from './user.entity';

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
};
