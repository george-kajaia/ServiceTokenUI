export enum RequestStatus {
  None = 0,
  Registered = 1,
  Authorized = 2,
  Approved = 3,
  Rejected = 4
}

export interface Request {
  id: number;
  rowVersion: string;
  companyId: number;
  prodId: number;
  regDate: string;
  status: number;
  authorizeDate?: string | null;
  approveDate?: string | null;
}
