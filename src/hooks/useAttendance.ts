import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAttendanceByDate,
  checkInMember,
  checkOutMember,
} from "../services/receptionist.service";

/**
 * Hook for querying gate check-in/out logs for a specific calendar date.
 */
export function useDailyAttendance(date: string) {
  return useQuery({
    queryKey: ["attendance", { date }],
    queryFn: () => getAttendanceByDate(date),
    enabled: !!date,
    staleTime: 1000 * 15, // 15 seconds stale time for live front-desk updates
  });
}

/**
 * Mutation for recording a member's check-in.
 */
export function useCheckInMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: number) => checkInMember(memberId),
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", memberId] });
    },
  });
}

/**
 * Mutation for recording a member's check-out.
 */
export function useCheckOutMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: number) => checkOutMember(memberId),
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", memberId] });
    },
  });
}
