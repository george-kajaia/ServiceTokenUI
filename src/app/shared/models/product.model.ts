export enum ScheduleType {
  None = 0,
  Monthly = 1,
  Quarterly = 2,
  SemiAnnual = 3,
  Annual = 4
}

export interface Product {
  id: number;
  companyId: number;
  name: string;
  totalQuantity: number;
  price: number;
  term?: number | null;
  scheduleType: number;
}
