import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  firebaseApp,
  initializeFirebaseClientServices,
} from "@/lib/firebase";
import type {
  CreateGrowerInput,
  CreateGrowerResult,
  DeleteGrowerResult,
  GrowerCollectionName,
} from "@/types/grower";

const functionsRegion = "us-central1";

type CreateGrowerBackendResult = Omit<
  CreateGrowerResult,
  "passwordResetEmailSent"
>;

type DeleteGrowerRequest = {
  uid: string;
  collectionName: GrowerCollectionName;
  confirmation: string;
};

function firebaseFunctions() {
  if (typeof window === "undefined" || !firebaseApp) {
    throw new Error(
      "Firebase is unavailable. Check .env.local and restart the development server.",
    );
  }
  return getFunctions(firebaseApp, functionsRegion);
}

export async function createGrowerAccount(
  input: CreateGrowerInput,
): Promise<CreateGrowerResult> {
  const callable = httpsCallable<
    CreateGrowerInput,
    CreateGrowerBackendResult
  >(firebaseFunctions(), "createGrowerAccount");
  const result = await callable(input);
  const { auth } = initializeFirebaseClientServices();
  let passwordResetEmailSent = false;

  if (auth) {
    try {
      await sendPasswordResetEmail(auth, result.data.email);
      passwordResetEmailSent = true;
    } catch {
      // Account creation succeeded. Keep it and let the administrator send a
      // reset email later instead of rolling back a usable account/profile.
    }
  }

  return { ...result.data, passwordResetEmailSent };
}

export async function deleteGrowerAccount(
  request: DeleteGrowerRequest,
): Promise<DeleteGrowerResult> {
  const callable = httpsCallable<DeleteGrowerRequest, DeleteGrowerResult>(
    firebaseFunctions(),
    "deleteGrowerAccount",
  );
  const result = await callable(request);
  return result.data;
}

export function growerAccountErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (error instanceof FirebaseError) {
    const message = error.message
      .replace(/^FirebaseError:\s*/i, "")
      .replace(/^\[[^\]]+\]\s*/i, "")
      .trim();
    return message || fallback;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message) || fallback;
  }
  return fallback;
}
