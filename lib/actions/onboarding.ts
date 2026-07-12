"use server";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { generateAccountNumber, generateReference } from "@/lib/utils";

interface InitInput {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function initializeCustomerAccount(input: InitInput) {
  if (!isAdminConfigured || !adminDb) {
    return { ok: false as const, error: "Firebase admin is not configured on the server." };
  }

  const db = adminDb;
  const now = new Date().toISOString();
  const batch = db.batch();

  const userRef = db.collection(COLLECTIONS.users).doc(input.uid);
  batch.set(userRef, {
    uid: input.uid,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    role: "customer",
    status: "active",
    kycStatus: "unverified",
    currency: "USD",
    language: "en",
    notificationPrefs: { email: true, push: true, sms: false },
    createdAt: now,
    updatedAt: now,
  });

  const currentAccountId = `acc_${input.uid}_current`;
  const savingsAccountId = `acc_${input.uid}_savings`;
  const fixedAccountId = `acc_${input.uid}_fixed`;

  batch.set(db.collection(COLLECTIONS.accounts).doc(currentAccountId), {
    userId: input.uid,
    type: "current",
    name: "Current Account",
    accountNumber: generateAccountNumber(),
    balance: 5000,
    currency: "USD",
    isPrimary: true,
    createdAt: now,
  });

  batch.set(db.collection(COLLECTIONS.accounts).doc(savingsAccountId), {
    userId: input.uid,
    type: "savings",
    name: "Savings Account",
    accountNumber: generateAccountNumber(),
    balance: 12500,
    currency: "USD",
    interestRate: 4.5,
    createdAt: now,
  });

  batch.set(db.collection(COLLECTIONS.accounts).doc(fixedAccountId), {
    userId: input.uid,
    type: "fixed_deposit",
    name: "Fixed Deposit",
    accountNumber: generateAccountNumber(),
    balance: 20000,
    currency: "USD",
    interestRate: 7.2,
    maturityDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
    createdAt: now,
  });

  const seedTx = [
    { desc: "Welcome bonus", amount: 50, type: "deposit", direction: "credit" as const },
    { desc: "Grocery Mart", amount: 84.32, type: "card_payment", direction: "debit" as const },
    { desc: "Salary deposit", amount: 3200, type: "deposit", direction: "credit" as const },
    { desc: "Electric Co. bill", amount: 120.5, type: "bill_payment", direction: "debit" as const },
  ];

  seedTx.forEach((tx, i) => {
    const ref = db.collection(COLLECTIONS.transactions).doc();
    const createdAt = new Date(Date.now() - (seedTx.length - i) * 86400000).toISOString();
    batch.set(ref, {
      userId: input.uid,
      accountId: currentAccountId,
      type: tx.type,
      direction: tx.direction,
      amount: tx.amount,
      currency: "USD",
      status: "completed",
      reference: generateReference(),
      description: tx.desc,
      createdAt,
    });
  });

  const cardRef = db.collection(COLLECTIONS.cards).doc();
  batch.set(cardRef, {
    userId: input.uid,
    accountId: currentAccountId,
    type: "virtual",
    network: "visa",
    cardholderName: `${input.firstName} ${input.lastName}`.toUpperCase(),
    cardNumber: `4${Math.floor(100000000000000 + Math.random() * 899999999999999)}`,
    expiryMonth: "12",
    expiryYear: String(new Date().getFullYear() + 4),
    cvv: String(Math.floor(100 + Math.random() * 899)),
    pin: "1234",
    status: "active",
    dailyLimit: 2000,
    monthlyLimit: 20000,
    color: "from-indigo-600 to-violet-600",
    createdAt: now,
  });

  const notifRef = db.collection(COLLECTIONS.notifications).doc();
  batch.set(notifRef, {
    userId: input.uid,
    type: "system",
    title: "Welcome to Nexora Bank",
    message: "Your account has been created successfully. Explore your dashboard to get started.",
    read: false,
    archived: false,
    createdAt: now,
  });

  await batch.commit();

  return { ok: true as const };
}
