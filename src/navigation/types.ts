import { NavigatorScreenParams } from "@react-navigation/native";
import { Member, MemberPtSession } from "../services/receptionist.service";

export type RootStackParamList = {
  Welcome: undefined;
  Login: { email?: string } | undefined;
  Register: undefined;
  TrainerHome: undefined;
  ReceptionTabs: NavigatorScreenParams<ReceptionTabParamList>;
  TrainerTabs: NavigatorScreenParams<TrainerTabParamList>;
  MemberDetail: { member: Member; updatedMember?: Member };
  PtSessionDetail: { session: MemberPtSession };
  EditMember: { member: Member };
  RenewPlan: { member: Member };
  AddMember: undefined;
  BookPtSession: undefined;
  AddSlots: { selectedDateStr: string };
};

export type ReceptionTabParamList = {
  Attendance: undefined;
  Members: undefined;
  "Pt-sessions": undefined;
  Profile: undefined;
};

export type TrainerTabParamList = {
  Members: undefined;
  MySlot: undefined;
  "Pt-sessions": undefined;
  Profile: undefined;
};