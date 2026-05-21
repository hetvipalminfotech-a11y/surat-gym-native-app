import API from "./api";
import { AxiosResponse } from "axios";

// --- Types ---
export interface Member {
  id: number;
  member_code: string;
  name: string;
  phone: string;
  email: string | null;
  age: number | null;
  gender: string | null;
  status: "ACTIVE" | "EXPIRED" | "FROZEN" | "CANCELLED";
  remaining_pt_sessions: number;
  membership_plan_id: number;
  plan_name?: string;
  start_date?: string;
  end_date?: string;
  health_conditions?: string | null;
  emergency_contact_phone?: string | null;
  created_at?: string;
}

export interface PaginatedMembers {
  members: Member[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateMemberDto {
  name: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: "MALE" | "FEMALE" | "OTHER";
  membershipPlanId: number;
  startDate: string;
  paymentMethod?: "CASH" | "UPI" | "CARD" | "ONLINE";
  healthConditions?: string;
  emergencyContactPhone?: string;
}

export interface Trainer {
  id: number;
  name: string;
  specialization: string;
  session_rate: number;
}

export interface Slot {
  id: number;
  trainer_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
}

export interface AttendanceLog {
  id: number;
  member_id: number;
  member_name?: string;
  member_code?: string;
  check_in_time: string;
  check_out_time: string | null;
  status: "PRESENT" | "DEPARTED";
}

interface NestResponseWrapper<T> {
  success?: boolean;
  data?: T;
  timestamp?: string;
}

// Fail-safe helper to unwrap NestJS API envelopes without using 'any'
const unwrap = <T>(res: AxiosResponse<NestResponseWrapper<T> | T>): T => {
  const body = res.data;
  if (body && typeof body === "object") {
    const wrapper = body as NestResponseWrapper<T>;
    if (wrapper.data !== undefined) {
      return wrapper.data;
    }
  }
  return body as T;
};

// --- Receptionist Endpoints ---
export const getMembers = async (search?: string, status?: string, planId?: number): Promise<Member[]> => {
  let url = "/members?limit=100";
  if (status && status !== "ALL") {
    url += `&status=${status}`;
  }
  if (planId) {
    url += `&planId=${planId}`;
  }
  const res = await API.get<NestResponseWrapper<PaginatedMembers> | PaginatedMembers>(url);
  const data = unwrap<PaginatedMembers>(res);

  let list = data?.members;
  if (!Array.isArray(list)) {
    const fallback = data as unknown as Member[];
    list = Array.isArray(fallback) ? fallback : [];
  }

  if (search) {
    list = list.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      m.member_code.toLowerCase().includes(search.toLowerCase())
    );
  }
  return list;
};

export const createMember = async (dto: CreateMemberDto): Promise<Member> => {
  const res = await API.post<NestResponseWrapper<Member> | Member>("/members", dto);
  return unwrap<Member>(res);
};

export const getTrainers = async (): Promise<Trainer[]> => {
  const res = await API.get<NestResponseWrapper<Trainer[]> | Trainer[]>("/trainers");
  const data = unwrap<Trainer[]>(res);
  return Array.isArray(data) ? data : [];
};

export const getTrainerSlots = async (trainerId: number, date: string): Promise<Slot[]> => {
  const res = await API.get<NestResponseWrapper<Slot[]> | Slot[]>(`/trainers/${trainerId}/slots?date=${date}`);
  const data = unwrap<Slot[]>(res);
  return Array.isArray(data) ? data : [];
};

export const bookPtSession = async (memberId: number, slotId: number): Promise<unknown> => {
  const res = await API.post<NestResponseWrapper<unknown> | unknown>("/pt-sessions/book", { memberId, slotId });
  return unwrap<unknown>(res);
};

export const getAttendanceByDate = async (date: string): Promise<AttendanceLog[]> => {
  const res = await API.get<NestResponseWrapper<AttendanceLog[]> | AttendanceLog[]>(`/attendance/date/${date}`);
  const data = unwrap<AttendanceLog[]>(res);
  return Array.isArray(data) ? data : [];
};

export const checkInMember = async (memberId: number): Promise<unknown> => {
  const res = await API.post<NestResponseWrapper<unknown> | unknown>("/attendance/check-in", { memberId });
  return unwrap<unknown>(res);
};

export const checkOutMember = async (memberId: number): Promise<unknown> => {
  const res = await API.patch<NestResponseWrapper<unknown> | unknown>(`/attendance/check-out/${memberId}`);
  return unwrap<unknown>(res);
};

// --- Pt-Session & Modification Endpoints ---
export interface MemberPtSession {
  id: number;
  member_id: number;
  session_code: string;
  session_date: string;
  trainer_name: string;
  member_name?: string;
  session_type: string;
  session_source: string;
  amount_charged: number;
  status: string;
}

export interface UpdateMemberFields {
  name?: string;
  phone?: string;
  email?: string;
  age?: number;
  gender?: "MALE" | "FEMALE" | "OTHER";
  healthConditions?: string;
  emergencyContactPhone?: string;
  status?: "ACTIVE" | "EXPIRED" | "FROZEN";
}

export interface RenewMemberFields {
  planId: number;
  startDate: string;
  paymentMethod?: "CASH" | "UPI" | "CARD" | "ONLINE";
}

export interface MembershipPlan {
  id: number;
  name: string;
  duration_months: number;
  price: number;
  status: string;
}

export const getMembershipPlans = async (): Promise<MembershipPlan[]> => {
  const res = await API.get<NestResponseWrapper<MembershipPlan[]> | MembershipPlan[]>("/membership-plans");
  const data = unwrap<MembershipPlan[]>(res);
  return Array.isArray(data) ? data : [];
};

export const getMemberPtSessions = async (memberId: number): Promise<MemberPtSession[]> => {
  const res = await API.get<NestResponseWrapper<MemberPtSession[]> | MemberPtSession[]>(`/pt-sessions/member/${memberId}`);
  const data = unwrap<MemberPtSession[]>(res);
  return Array.isArray(data) ? data : [];
};

export const updateMember = async (id: number, dto: UpdateMemberFields): Promise<Member> => {
  const res = await API.patch<NestResponseWrapper<Member> | Member>(`/members/${id}`, dto);
  return unwrap<Member>(res);
};

export const renewMember = async (id: number, dto: RenewMemberFields): Promise<Member> => {
  const res = await API.patch<NestResponseWrapper<Member> | Member>(`/members/${id}/renew`, dto);
  return unwrap<Member>(res);
};

export const freezeMember = async (id: number): Promise<Member> => {
  const res = await API.patch<NestResponseWrapper<Member> | Member>(`/members/${id}/freeze`);
  return unwrap<Member>(res);
};

export const unfreezeMember = async (id: number): Promise<Member> => {
  const res = await API.patch<NestResponseWrapper<Member> | Member>(`/members/${id}/unfreeze`);
  return unwrap<Member>(res);
};

export interface PaginatedSessionsResponse {
  sessions: MemberPtSession[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getAllPtSessions = async (status?: string, date?: string, page = 1, limit = 100): Promise<MemberPtSession[]> => {
  let url = `/pt-sessions?page=${page}&limit=${limit}`;
  if (status && status !== "ALL") {
    url += `&status=${status}`;
  }
  if (date) {
    url += `&date=${date}`;
  }
  const res = await API.get<NestResponseWrapper<PaginatedSessionsResponse> | PaginatedSessionsResponse | MemberPtSession[]>(url);
  const data = unwrap<PaginatedSessionsResponse | MemberPtSession[]>(res);

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object" && 'sessions' in data && Array.isArray(data.sessions)) {
    return data.sessions;
  }

  return [];
};

export const cancelPtSession = async (id: number): Promise<unknown> => {
  const res = await API.patch<NestResponseWrapper<unknown> | unknown>(`/pt-sessions/${id}/cancel`);
  return unwrap<unknown>(res);
};

export const getMembersPaginated = async (
  page = 1,
  limit = 20,
  search?: string,
  status?: string,
  planId?: number | string
): Promise<PaginatedMembers> => {
  let url = `/members?page=${page}&limit=${limit}`;
  if (status && status !== "ALL") {
    url += `&status=${status}`;
  }
  if (planId) {
    url += `&planId=${planId}`;
  }
  if (search && search.trim() !== "") {
    url += `&search=${encodeURIComponent(search.trim())}`;
  }
  const res = await API.get<NestResponseWrapper<PaginatedMembers> | PaginatedMembers>(url);
  return unwrap<PaginatedMembers>(res);
};

export const getPtSessionsPaginated = async (
  page = 1,
  limit = 20,
  status?: string,
  date?: string
): Promise<PaginatedSessionsResponse> => {
  let url = `/pt-sessions?page=${page}&limit=${limit}`;
  if (status && status !== "ALL") {
    url += `&status=${status}`;
  }
  if (date) {
    url += `&date=${date}`;
  }
  const res = await API.get<NestResponseWrapper<PaginatedSessionsResponse> | PaginatedSessionsResponse>(url);
  return unwrap<PaginatedSessionsResponse>(res);
};

export const completePtSession = async (id: number): Promise<unknown> => {
  const res = await API.patch<NestResponseWrapper<unknown> | unknown>(`/pt-sessions/${id}/complete`);
  return unwrap<unknown>(res);
};

export const noShowPtSession = async (id: number): Promise<unknown> => {
  const res = await API.patch<NestResponseWrapper<unknown> | unknown>(`/pt-sessions/${id}/no-show`);
  return unwrap<unknown>(res);
};

export interface BulkSlotItem {
  startTime: string;
  endTime: string;
}

export const createBulkSlots = async (
  trainerId: number,
  slotDate: string,
  slots: BulkSlotItem[]
): Promise<Slot[]> => {
  const res = await API.post<NestResponseWrapper<Slot[]> | Slot[]>(
    `/trainers/${trainerId}/slots/bulk`,
    { slotDate, slots }
  );
  const data = unwrap<Slot[]>(res);
  return Array.isArray(data) ? data : [];
};


