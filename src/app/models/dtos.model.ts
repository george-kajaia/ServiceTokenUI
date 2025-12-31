export interface LoginCredentialDto {
  userName: string;
  password: string;
}

export interface CompanyCreateDto {
  name: string;
  taxCode: string;
  userName: string;
  password: string;
}

export interface BondRequestDto {
  companyId: number;
  status: number;
  totalCount: number;
  price: number;
  term: number;
  interestRate: number;
  realizationPeriodNumber: number
}

export interface InvestorCreateDto {
  publicKey: string;
  userName: string;
  password: string;
}
