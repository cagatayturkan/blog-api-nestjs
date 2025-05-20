export interface GenericResponse<T = any> {
  status: 'SUCCESS' | 'FAILED';
  message?: string;
  data?: T;
  pagination?: any;
} 