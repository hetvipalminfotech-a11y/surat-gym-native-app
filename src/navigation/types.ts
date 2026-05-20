export type RootStackParamList = {
  Welcome: undefined;
  Login: { email?: string } | undefined;
  Register: undefined;
  TrainerHome: undefined;
  ReceptionTabs: undefined;
};

export type ReceptionTabParamList = {
  Dashboard: undefined;
  Members: undefined;
  "Pt-sessions": undefined;
  Attendance: undefined;
};