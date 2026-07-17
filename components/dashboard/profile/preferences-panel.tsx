"use client";

import * as React from "react";
import { toast } from "sonner";

import { updateProfileDetails } from "@/lib/actions/profile-actions";
import { CURRENCIES } from "@/lib/currencies";
import type { UserProfile } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "pt", label: "Português" },
];

export function PreferencesPanel({ profile }: { profile: UserProfile }) {
  const [language, setLanguage] = React.useState(profile.language);
  const [currency, setCurrency] = React.useState(profile.currency);
  const [prefs, setPrefs] = React.useState(profile.notificationPrefs);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSave() {
    setSubmitting(true);
    try {
      const result = await updateProfileDetails(profile.uid, {
        language,
        currency,
        notificationPrefs: prefs,
      });
      if (result.ok) toast.success("Preferences saved");
      else toast.error(result.error);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Display currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} {c.code} &middot; {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Used to total your balance across currencies on the dashboard. To hold and spend a
              balance directly in another currency, open a dedicated account from the Currency page.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">Notification preferences</h3>
          {(["email", "push", "sms"] as const).map((channel) => (
            <div key={channel} className="flex items-center justify-between">
              <Label className="capitalize">{channel} notifications</Label>
              <Switch
                checked={prefs[channel]}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, [channel]: checked }))}
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={submitting} variant="gradient" className="w-fit">
          Save preferences
        </Button>
      </CardContent>
    </Card>
  );
}
