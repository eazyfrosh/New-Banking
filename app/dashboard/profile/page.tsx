"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

import { ProfileDetailsForm } from "@/components/dashboard/profile/profile-details-form";
import { SecuritySettings } from "@/components/dashboard/profile/security-settings";
import { PreferencesPanel } from "@/components/dashboard/profile/preferences-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ProfileTabs() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "profile";

  if (!profile) return <Skeleton className="h-96 w-full" />;

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="mt-6">
        <ProfileDetailsForm profile={profile} />
      </TabsContent>
      <TabsContent value="security" className="mt-6">
        <SecuritySettings userId={profile.uid} />
      </TabsContent>
      <TabsContent value="preferences" className="mt-6">
        <PreferencesPanel profile={profile} />
      </TabsContent>
    </Tabs>
  );
}

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile & settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your personal details, security and preferences.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ProfileTabs />
      </Suspense>
    </div>
  );
}
