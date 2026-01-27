export enum RequestStatus {
  None = 0,
  Created = 1,
  Authorised = 2,
  Approved = 3
}

export interface Request {
  id: number;
  rowVersion: number;
  companyId: number;
  productId: number;
  serviceTokenCount: number;
  regDate: string;
  status: RequestStatus | number;
  authorizeDate?: string | null;
  approveDate?: string | null;
}
