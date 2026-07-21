import {
  Cable,
  Droplets,
  GraduationCap,
  Landmark,
  ShieldCheck,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { BillCategory } from "@/types";

export const billCategoryIcons: Record<BillCategory, LucideIcon> = {
  electricity: Zap,
  cable_tv: Cable,
  internet: Wifi,
  water: Droplets,
  education: GraduationCap,
  tax: Landmark,
  insurance: ShieldCheck,
};

export const billCategoryLabels: Record<BillCategory, string> = {
  electricity: "Electricity",
  cable_tv: "Cable TV",
  internet: "Internet",
  water: "Water",
  education: "Education",
  tax: "Taxes",
  insurance: "Insurance",
};

export const billCategories = Object.keys(billCategoryLabels) as BillCategory[];
