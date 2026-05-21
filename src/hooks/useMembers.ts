import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMembersPaginated,
  createMember,
  updateMember,
  renewMember,
  freezeMember,
  unfreezeMember,
  CreateMemberDto,
  UpdateMemberFields,
  RenewMemberFields,
} from "../services/receptionist.service";

/**
 * Hook for fetching members list with dynamic infinite scroll backend pagination.
 */
export function useInfiniteMembers(search = "", status = "ALL", planId?: number | string) {
  return useInfiniteQuery({
    queryKey: ["members", { search, status, planId }],
    queryFn: ({ pageParam = 1 }) =>
      getMembersPaginated(pageParam, 20, search, status, planId),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 3, // Cache remains fresh for 3 minutes
  });
}

/**
 * Mutation for registering a new member.
 */
export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMemberDto) => createMember(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

/**
 * Mutation for updating generic member profile details.
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateMemberFields }) =>
      updateMember(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", variables.id] });
    },
  });
}

/**
 * Mutation for extending/renewing a membership subscription plan.
 */
export function useRenewMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: RenewMemberFields }) =>
      renewMember(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", variables.id] });
    },
  });
}

/**
 * Mutation for placing an active membership on hold (FROZEN).
 */
export function useFreezeMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => freezeMember(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", id] });
    },
  });
}

/**
 * Mutation for activating a frozen membership and shifting expiration.
 */
export function useUnfreezeMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unfreezeMember(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", id] });
    },
  });
}
