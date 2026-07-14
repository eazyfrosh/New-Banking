import { orderBy } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMany } from "@/lib/services/firestore-helpers";
import type {
  AuditLog,
  FraudAlert,
  SupportTicket,
  UserProfile,
} from "@/types";

export function listAllUsers() {
  return getMany<UserProfile>(COLLECTIONS.users, orderBy("createdAt", "desc"));
}

/** Single-field orderBy only (no where) so it never needs a composite index. */
export function listAuditLogs() {
  return getMany<AuditLog>(COLLECTIONS.auditLogs, orderBy("createdAt", "desc"));
}

export function listSupportTickets() {
  return getMany<SupportTicket>(COLLECTIONS.supportTickets, orderBy("createdAt", "desc"));
}

export function listFraudAlerts() {
  return getMany<FraudAlert>(COLLECTIONS.fraudAlerts, orderBy("createdAt", "desc"));
}
