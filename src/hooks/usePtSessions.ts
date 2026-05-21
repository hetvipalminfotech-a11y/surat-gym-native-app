import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPtSessionsPaginated,
  getTrainerSlots,
  bookPtSession,
  cancelPtSession,
  completePtSession,
  noShowPtSession,
  createBulkSlots,
  BulkSlotItem,
} from "../services/receptionist.service";

/**
 * Hook for fetching and paginating all PT sessions with filters.
 */
export function useInfinitePtSessions(status = "ALL", date?: string) {
  return useInfiniteQuery({
    queryKey: ["pt-sessions", { status, date }],
    queryFn: ({ pageParam = 1 }) =>
      getPtSessionsPaginated(pageParam, 20, status, date),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
  });
}

/**
 * Hook for fetching time slot schedules for a specific trainer and date.
 */
export function useTrainerSlots(trainerId: number | null, date: string) {
  return useQuery({
    queryKey: ["trainer-slots", { trainerId, date }],
    queryFn: () => {
      if (!trainerId) return [];
      return getTrainerSlots(trainerId, date);
    },
    enabled: !!trainerId && !!date,
    staleTime: 1000 * 30, // 30 seconds stale time (high volatility on booking slots)
  });
}

/**
 * Mutation for booking a Personal Training slot.
 */
export function useBookPtSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, slotId }: { memberId: number; slotId: number }) =>
      bookPtSession(memberId, slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pt-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["trainer-slots"] });
      queryClient.invalidateQueries({ queryKey: ["members"] }); // remaining sessions count will decrement
    },
  });
}

/**
 * Mutation for canceling a booked PT Session.
 */
export function useCancelPtSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelPtSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pt-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["trainer-slots"] });
      queryClient.invalidateQueries({ queryKey: ["member-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["members"] }); // remaining sessions count might restore
    },
  });
}

/**
 * Mutation for completing a PT Session.
 */
export function useCompletePtSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => completePtSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pt-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["trainer-slots"] });
      queryClient.invalidateQueries({ queryKey: ["member-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

/**
 * Mutation for marking a session as No Show.
 */
export function useNoShowPtSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => noShowPtSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pt-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["member-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

/**
 * Mutation for bulk creating trainer slots.
 */
export function useCreateBulkSlots() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trainerId, slotDate, slots }: { trainerId: number; slotDate: string; slots: BulkSlotItem[] }) =>
      createBulkSlots(trainerId, slotDate, slots),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainer-slots"] });
    },
  });
}
