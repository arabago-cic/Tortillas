export interface Member {
  id: number;
  name: string;
  email: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ScheduleEntry {
  date: string; // YYYY-MM-DD
  member: Member | null;
  isOverride: boolean;
}

export interface MonthSchedule {
  [date: string]: {
    member: Member | null;
    isOverride: boolean;
  };
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
