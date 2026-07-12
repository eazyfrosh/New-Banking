import { z } from "zod";

export const transferSchema = z.object({
  fromAccountId: z.string().min(1, "Select an account"),
  kind: z.enum(["internal", "bank", "international"]),
  amount: z
    .string()
    .min(1, "Enter an amount")
    .refine((v) => Number(v) > 0, "Enter an amount greater than 0"),
  recipientName: z.string().min(2, "Enter recipient name"),
  recipientAccount: z.string().min(4, "Enter a valid account number"),
  recipientBank: z.string().optional(),
  swiftCode: z.string().optional(),
  note: z.string().max(140).optional(),
});

export type TransferValues = z.infer<typeof transferSchema>;

export const pinSchema = z.object({
  pin: z.string().length(4, "Enter your 4-digit PIN").regex(/^\d+$/, "Numbers only"),
});

export type PinValues = z.infer<typeof pinSchema>;
