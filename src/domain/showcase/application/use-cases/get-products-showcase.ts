import { Partial } from '@/core/types/deep-partial';
import { PaginatedRequest, PaginatedResponse } from '@/core/types/pagination';

export type GetProductsShowcaseRequest = PaginatedRequest<
  Partial<{
    name: string;
    categoryId: string;
    subCategoryId: string;
  }>
>;

export type GetProductsShowcaseResponse = PaginatedResponse<any>;
