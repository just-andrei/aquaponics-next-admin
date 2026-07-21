import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

export type AdminAccess = {
  isAdmin: boolean;
  isActive: boolean;
  isActiveAdmin: boolean;
  reason: string | null;
};

const adminRoleValues = new Set(["admin", "manager"]);

function hasOwnValue(data: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(data, key);
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

function roleMarkerAllowsAdmin(data: Record<string, unknown>, key: string) {
  if (!hasOwnValue(data, key)) {
    return true;
  }

  return adminRoleValues.has(normalizeText(data[key]) ?? "");
}

function isAdminDocument(data: Record<string, unknown>) {
  return (
    roleMarkerAllowsAdmin(data, "role") &&
    roleMarkerAllowsAdmin(data, "userType") &&
    roleMarkerAllowsAdmin(data, "type") &&
    (!hasOwnValue(data, "isAdmin") || data.isAdmin === true)
  );
}

function isActiveAdminDocument(data: Record<string, unknown>) {
  return (
    (!hasOwnValue(data, "isActive") || data.isActive === true) &&
    (!hasOwnValue(data, "status") || normalizeText(data.status) === "active")
  );
}

export async function getAdminAccess(user: User): Promise<AdminAccess> {
  if (!isFirebaseConfigured || !db) {
    return {
      isAdmin: false,
      isActive: false,
      isActiveAdmin: false,
      reason: "Firebase is not configured. Add the Firebase values to .env.local and restart the app.",
    };
  }

  try {
    const adminSnapshot = await getDoc(doc(db, "admin", user.uid));

    if (!adminSnapshot.exists()) {
      return {
        isAdmin: false,
        isActive: false,
        isActiveAdmin: false,
        reason: "This account is not registered as an administrator.",
      };
    }

    const data = adminSnapshot.data();
    const isAdmin = isAdminDocument(data);
    const isActive = isActiveAdminDocument(data);

    if (!isAdmin) {
      return {
        isAdmin: false,
        isActive,
        isActiveAdmin: false,
        reason: "This account does not have an administrator role.",
      };
    }

    if (!isActive) {
      return {
        isAdmin: true,
        isActive: false,
        isActiveAdmin: false,
        reason: "This administrator account is inactive. Please contact an administrator.",
      };
    }

    return {
      isAdmin: true,
      isActive: true,
      isActiveAdmin: true,
      reason: null,
    };
  } catch {
    return {
      isAdmin: false,
      isActive: false,
      isActiveAdmin: false,
      reason: "We could not verify administrator access. Please try again.",
    };
  }
}

export function getSignInErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The email address or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many sign-in attempts. Please try again later.";
    case "auth/network-request-failed":
      return "A network error occurred. Check your connection and try again.";
    default:
      return "Sign-in could not be completed. Please try again.";
  }
}
