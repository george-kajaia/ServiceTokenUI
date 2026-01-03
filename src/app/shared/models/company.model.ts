export interface CompanyUser {
  id: number;
  companyId: number;
  userName: string;
  password: string;
}

export interface Company {
  id: number;
  name: string;
  status: number; // 0 or 1
  regDate: string;
  taxCode: string;
  user?: CompanyUser | null;
}

export interface BondRequest {
  id: number;
  companyId: number;
  regDate: string;
  status: number;
  totalCount: number;
  price: number;
  term: number;
  approveDate: string;
  interestRate?: number | null;
}