export type UserRole = "customer" | "admin";

export type KycStatus = "unverified" | "pending" | "verified" | "rejected";

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: "active" | "suspended" | "closed";
  photoURL?: string;
  kycStatus: KycStatus;
  address?: string;
  dateOfBirth?: string;
  occupation?: string;
  currency: string;
  language: string;
  notificationPrefs: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  transactionPin?: string;
  /** Non-blocking admin review queue for new registrations - never gates dashboard/login access. Absent on accounts created before this field existed. */
  reviewStatus?: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export type AccountType = "current" | "savings" | "fixed_deposit";

/** Absent/undefined is treated as "active" everywhere - existing accounts predate this field. */
export type AccountStatus = "active" | "frozen" | "closed";

export interface Account {
  id: string;
  userId: string;
  type: AccountType;
  name: string;
  accountNumber: string;
  balance: number;
  currency: string;
  interestRate?: number;
  maturityDate?: string;
  isPrimary?: boolean;
  status?: AccountStatus;
  createdAt: string;
}

export type TransactionType =
  | "transfer_internal"
  | "transfer_bank"
  | "transfer_international"
  | "bill_payment"
  | "deposit"
  | "withdrawal"
  | "loan_disbursement"
  | "loan_repayment"
  | "investment"
  | "card_payment"
  | "interest"
  | "currency_conversion";

export type TransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "scheduled"
  | "reversed";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  direction: "credit" | "debit";
  amount: number;
  currency: string;
  status: TransactionStatus;
  reference: string;
  description: string;
  counterparty?: string;
  counterpartyAccount?: string;
  /** Not currently written by any flow - present only for forward-compatibility with the receipt UI, which reads it if it's ever set. */
  recipientBank?: string;
  /** Admin-editable display label, independent of the real owning `userId` -
   * editing it corrects a record's display name, it never reassigns
   * ownership of the transaction or its account. */
  customerName?: string;
  category?: string;
  recurring?: boolean;
  recurringInterval?: "daily" | "weekly" | "monthly";
  scheduledFor?: string;
  fee?: number;
  createdAt: string;
}

export type CardType = "virtual" | "physical";
export type CardNetwork = "visa" | "mastercard" | "verve";
export type CardStatus = "active" | "frozen" | "blocked" | "expired";

export interface BankCard {
  id: string;
  userId: string;
  accountId: string;
  type: CardType;
  network: CardNetwork;
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  pin: string;
  status: CardStatus;
  dailyLimit: number;
  monthlyLimit: number;
  color: string;
  createdAt: string;
}

export type SavingsPlanType = "flexible" | "target" | "fixed_deposit";

export interface SavingsPlan {
  id: string;
  userId: string;
  type: SavingsPlanType;
  name: string;
  targetAmount?: number;
  currentAmount: number;
  interestRate: number;
  startDate: string;
  endDate?: string;
  frequency?: "daily" | "weekly" | "monthly";
  autoSaveAmount?: number;
  status: "active" | "completed" | "broken";
  createdAt: string;
}

export type LoanStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "completed"
  | "defaulted";

export interface Loan {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  purpose: string;
  status: LoanStatus;
  monthlyRepayment: number;
  outstandingBalance: number;
  disbursedAt?: string;
  nextRepaymentDate?: string;
  createdAt: string;
}

export interface RepaymentScheduleItem {
  installment: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  status: "upcoming" | "paid" | "overdue";
}

export type InvestmentType = "mutual_fund" | "stock" | "crypto";

export interface Investment {
  id: string;
  userId: string;
  type: InvestmentType;
  symbol: string;
  name: string;
  units: number;
  avgBuyPrice: number;
  currentPrice: number;
  currency: string;
  createdAt: string;
}

export type BillCategory =
  | "electricity"
  | "cable_tv"
  | "internet"
  | "water"
  | "education"
  | "tax"
  | "insurance";

export interface BillProvider {
  id: string;
  category: BillCategory;
  name: string;
  logo?: string;
}

export interface BillPayment {
  id: string;
  userId: string;
  category: BillCategory;
  provider: string;
  accountReference: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
}

export type NotificationType =
  | "transaction"
  | "security"
  | "loan"
  | "system"
  | "promo";

export interface AppNotification {
  id: string;
  userId: string | "all";
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: string;
}

export interface FraudAlert {
  id: string;
  userId: string;
  transactionId?: string;
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
  status: "open" | "reviewed" | "dismissed";
  createdAt: string;
}

export interface ExchangeRate {
  currency: string;
  rate: number;
  change: number;
}

export interface AuditLog {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  targetUserId: string | null;
  /** Secondary target id for actions on a non-user record, e.g. a transaction id. */
  targetId?: string | null;
  changedFields: string[] | null;
  before: unknown;
  after: unknown;
  /** True once this entry has been reverted via "Undo last edit" - prevents undoing the same entry twice. */
  undone?: boolean;
  ip: string | null;
  createdAt: string;
}
