/**
 * API Type Helpers for React Query v5
 * 
 * Provides strongly-typed helpers for useQuery and useMutation
 * to resolve TanStack Query v5 type inference issues.
 */

import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions, type QueryKey } from '@tanstack/react-query';

/**
 * Typed useQuery wrapper for React Query v5
 * 
 * Usage:
 * const { data } = typedUseQuery<Campaign[]>(['campaigns'], '/api/campaigns');
 */
export function typedUseQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  endpoint?: string,
  options?: Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError, TData, QueryKey>({
    queryKey,
    queryFn: endpoint ? async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json() as Promise<TData>;
    } : undefined,
    ...options,
  } as UseQueryOptions<TData, TError, TData, QueryKey>);
}

/**
 * Typed useMutation wrapper for React Query v5
 */
export function typedUseMutation<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn,
    ...options,
  });
}

/**
 * Helper to assert array type from query data
 */
export function assertArray<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  return [];
}

/**
 * Helper to filter undefined from arrays
 */
export function filterDefined<T>(arr: (T | undefined)[]): T[] {
  return arr.filter((item): item is T => item !== undefined);
}

/**
 * Type guard for checking if data is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}
