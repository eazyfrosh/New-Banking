import { orderBy } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMany } from "@/lib/services/firestore-helpers";
import type {
  FraudAlert,
  SupportTicket,
  UserProfile,
} from "@/types";

export function listAllUsers() {
  return getMany<UserProfile>(COLLECTIONS.users, orderBy("createdAt", "desc"));
}

export function listSupportTickets() {
  return getMany<SupportTicket>(COLLECTIONS.supportTickets, orderBy("createdAt", "desc"));
}

export function listFraudAlerts() {
  return getMany<FraudAlert>(COLLECTIONS.fraudAlerts, orderBy("createdAt", "desc"));
}
