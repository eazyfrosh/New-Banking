"use client";

import * as React from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateProfileDetails } from "@/lib/actions/profile-actions";
import { uploadUserFile } from "@/lib/services/storage";
import { initials } from "@/lib/utils";
import type { UserProfile } from "@/types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileDetailsForm({ profile }: { profile: UserProfile }) {
  const [firstName, setFirstName] = React.useState(profile.firstName);
  const [lastName, setLastName] = React.useState(profile.lastName);
  const [phone, setPhone] = React.useState(profile.phone ?? "");
  const [address, setAddress] = React.useState(profile.address ?? "");
  const [dateOfBirth, setDateOfBirth] = React.useState(profile.dateOfBirth ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function handleSave() {
    setSubmitting(true);
    const result = await updateProfileDetails(profile.uid, {
      firstName,
      lastName,
      phone,
      address,
      dateOfBirth,
    });
    setSubmitting(false);
    if (result.ok) toast.success("Profile updated");
    else toast.error(result.error);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadUserFile(profile.uid, "avatar", file);
      await updateProfileDetails(profile.uid, { photoURL: url });
      toast.success("Profile photo updated");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-20">
              <AvatarImage src={profile.photoURL} />
              <AvatarFallback className="text-lg">
                {initials(`${profile.firstName} ${profile.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              className="bg-primary text-primary-foreground absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full shadow-md"
              aria-label="Change photo"
            >
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
          </div>
          <div>
            <p className="font-semibold">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>First name</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Last name</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Phone number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Date of birth</Label>
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={submitting} variant="gradient" className="w-fit">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
      </CardContent>
    </Card>
  );
}
