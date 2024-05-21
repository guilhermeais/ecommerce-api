export type PaginatedResponse<T, ItemsKey extends string = 'items'> = {
  [K in ItemsKey]: T[];
} & {
  total: number;
  pages: number;
  limit: number;
  currentPage: number;
};

export type PaginatedRequest<OtherFilters = unknown> = {
  page: number;
  limit: number;
} & OtherFilters;
