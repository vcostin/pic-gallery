/**
 * Data fetching utilities to optimize API requests and responses
 */

import logger from './logger';

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface FilterParams {
  userId?: string;
  isPublic?: boolean;
  tag?: string;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Handles pagination for database queries
 * @param params Pagination parameters
 * @returns Pagination options for Prisma
 */
export function getPaginationOptions(params: PaginationParams) {
  const { page = 1, limit = 20, cursor } = params;
  const skip = cursor ? 1 : (page - 1) * limit;
  
  return {
    take: limit,
    skip: skip,
    ...(cursor ? { cursor: { id: cursor } } : {}),
  };
}

/**
 * Creates a where clause for filtering queries
 * @param filters Filter parameters
 * @returns Where clause for Prisma
 */
export function createWhereClause(filters: FilterParams = {}) {
  const where: Record<string, unknown> = {};
  
  if (filters.userId) {
    where.userId = filters.userId;
  }
  
  if (filters.isPublic !== undefined) {
    where.isPublic = filters.isPublic;
  }
  
  if (filters.tag) {
    where.tags = {
      some: {
        name: filters.tag,
      },
    };
  }
  
  return where;
}

/**
 * Creates a select clause to control which fields are returned
 * @param fields Array of field names to include
 * @returns Select clause for Prisma
 */
export function createSelectClause(fields?: string[]) {
  if (!fields || fields.length === 0) {
    return undefined;
  }
  
  const select: Record<string, boolean> = {};
  fields.forEach(field => {
    select[field] = true;
  });
  
  return select;
}

/**
 * Handles error in data fetching operations
 * @param error The caught error
 * @param entityName The name of the entity being fetched (for logging)
 */
export function handleFetchError(error: unknown, entityName: string) {
  return logger.handleError(error, `Error fetching ${entityName}`);
}

/**
 * Formats the response from the database into a standard format
 * @param data The data returned from the database
 * @param total The total number of items (for pagination)
 * @param params The pagination parameters used
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
) {
  const { page = 1, limit = 20 } = params;
  const lastPage = Math.ceil(total / limit);
  const nextPage = page < lastPage ? page + 1 : null;
  const prevPage = page > 1 ? page - 1 : null;
  
  return {
    data,
    meta: {
      total,
      currentPage: page,
      lastPage,
      perPage: limit,
      hasNextPage: nextPage !== null,
      hasPrevPage: prevPage !== null,
      nextPage,
      prevPage,
    },
  };
}
