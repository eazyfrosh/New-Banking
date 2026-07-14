import "server-only";
import { GoogleAuth } from "google-auth-library";

import { readFirebaseAdminEnv } from "@/lib/firebase/env";

/**
 * firebase-admin/auth transitively requires jwks-rsa, which requires the
 * ESM-only `jose` package - and that import crashes (ERR_REQUIRE_ESM) at
 * MODULE LOAD time on any Node runtime without require(esm) support,
 * regardless of which Auth method is actually called (confirmed: even just
 * `require("firebase-admin/auth")` alone crashes). That makes every Auth
 * operation (verifyIdToken, createUser, updateUser, deleteUser) unreliable
 * in this app's Vercel environment. These functions call the same Identity
 * Platform REST API firebase-admin uses internally, directly - Google still
 * performs the real cryptographic verification, this just avoids routing
 * through the fragile local dependency chain.
 */

let cachedAuth: GoogleAuth | null = null;

function getGoogleAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth;
  const result = readFirebaseAdminEnv();
  if (!result.ok) throw new Error(result.error);
  cachedAuth = new GoogleAuth({
    credentials: { client_email: result.env.clientEmail, private_key: result.env.privateKey },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  return cachedAuth;
}

async function getAccessToken(): Promise<string> {
  const client = await getGoogleAuth().getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Failed to obtain an access token for the service account.");
  return token;
}

function projectId(): string {
  const result = readFirebaseAdminEnv();
  if (!result.ok) throw new Error(result.error);
  return result.env.projectId;
}

/**
 * Verifies a client ID token via the public accounts:lookup endpoint
 * (authenticated by the token itself plus the project's public API key -
 * the same mechanism Firebase's own client SDKs use). Throws if the token
 * is missing, malformed, expired, or otherwise invalid.
 */
export async function verifyIdTokenRest(idToken: string): Promise<{ uid: string; email: string }> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("Missing environment variable: NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!idToken) throw new Error("No ID token provided.");

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || `Token verification failed (${res.status}).`);
  }

  const body = await res.json();
  const user = body.users?.[0];
  if (!user) throw new Error("Token did not resolve to a user.");
  return { uid: user.localId, email: user.email ?? "" };
}

export async function restCreateUser(input: {
  email: string;
  password: string;
  displayName: string;
  emailVerified?: boolean;
}): Promise<{ uid: string }> {
  const token = await getAccessToken();
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId()}/accounts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      emailVerified: input.emailVerified ?? true,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || `Failed to create user (${res.status}).`);
  return { uid: body.localId };
}

export async function restSetUserDisabled(uid: string, disabled: boolean): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId()}/accounts:update`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ localId: uid, disableUser: disabled }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || `Failed to update user (${res.status}).`);
  }
}

export async function restUpdateUserEmail(uid: string, email: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId()}/accounts:update`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ localId: uid, email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || `Failed to update email (${res.status}).`);
  }
}

export async function restDeleteUser(uid: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId()}/accounts:delete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ localId: uid }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || `Failed to delete user (${res.status}).`);
  }
}
