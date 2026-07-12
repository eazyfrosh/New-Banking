import { orderBy, where } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMany } from "@/lib/services/firestore-helpers";
import type { BillCategory, BillPayment, BillProvider } from "@/types";

export function listBillPayments(userId: string) {
  return getMany<BillPayment>(
    COLLECTIONS.billPayments,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
}

export const BILL_PROVIDERS: Record<BillCategory, BillProvider[]> = {
  electricity: [
    { id: "ec-1", category: "electricity", name: "Metro Power Grid" },
    { id: "ec-2", category: "electricity", name: "Northline Electric" },
  ],
  cable_tv: [
    { id: "tv-1", category: "cable_tv", name: "StreamMax TV" },
    { id: "tv-2", category: "cable_tv", name: "OrbitVision" },
  ],
  internet: [
    { id: "int-1", category: "internet", name: "FiberLink ISP" },
    { id: "int-2", category: "internet", name: "SkyNet Broadband" },
  ],
  water: [{ id: "wt-1", category: "water", name: "City Water Authority" }],
  education: [
    { id: "ed-1", category: "education", name: "State University Fees" },
    { id: "ed-2", category: "education", name: "Bright Future Academy" },
  ],
  tax: [{ id: "tax-1", category: "tax", name: "Revenue Service" }],
  insurance: [
    { id: "ins-1", category: "insurance", name: "SecureLife Insurance" },
    { id: "ins-2", category: "insurance", name: "GuardPlus Health" },
  ],
  airtime: [
    { id: "air-1", category: "airtime", name: "Connectel" },
    { id: "air-2", category: "airtime", name: "AirWave Mobile" },
    { id: "air-3", category: "airtime", name: "Globalink" },
  ],
  data: [
    { id: "dt-1", category: "data", name: "Connectel Data" },
    { id: "dt-2", category: "data", name: "AirWave Mobile Data" },
  ],
};
