export interface TokenPayload {
  userId: string;
  role: Role;
}

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
