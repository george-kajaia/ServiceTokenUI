export interface Investor {
  id: number;
  publicKey: string;
  userName: string;
  password: string;
}

export interface AdminUser {
  id: number;
  userName: string;
  userFullName: string;
  password: string;
}
