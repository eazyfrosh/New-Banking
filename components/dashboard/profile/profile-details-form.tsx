"use client";

import { ShieldCheck } from "lucide-react";

import { initials } from "@/lib/utils";
import type { UserProfile } from "@/types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const fields: Array<{ label: string; value: (p: UserProfile) => string }> = [
  { label: "First name", value: (p) => p.firstName },
  { label: "Last name", value: (p) => p.lastName },
  { label: "Phone number", value: (p) => p.phone || "—" },
  { label: "Date of birth", value: (p) => p.dateOfBirth || "—" },
  { label: "Occupation", value: (p) => p.occupation || "—" },
  { label: "Address", value: (p) => p.address || "—" },
];

export function ProfileDetailsForm({ profile }: { profile: UserProfile }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-20">
            <AvatarImage src={profile.photoURL} />
            <AvatarFallback className="text-lg">
              {initials(`${profile.firstName} ${profile.lastName}`)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
          </div>
        </div>

        <div className="bg-muted/50 flex items-start gap-2.5 rounded-xl p-3.5 text-sm">
          <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground">
            For your security, identity and KYC details can&apos;t be self-edited. Contact support to
            request a change.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">{field.label}</span>
              <span className="font-medium">{field.value(profile)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
