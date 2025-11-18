export interface IPaginatedResponse<T> {
  message?: string;
  data: T[];
  total: number;
  page: number;
  limit: number;
}
