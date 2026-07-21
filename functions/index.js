import { randomInt } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

const db = getFirestore();
const auth = getAuth();
const REGION = "us-central1";
const ALLOWED_COLLECTIONS = new Set(["user", "users"]);
const ADMIN_ROLES = new Set(["admin", "manager"]);

function hasOwn(data, key) {
  return Object.prototype.hasOwnProperty.call(data, key);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function roleMarkerAllowsAdmin(data, key) {
  return !hasOwn(data, key) || ADMIN_ROLES.has(normalizeText(data[key]));
}

function isActiveAdmin(data) {
  const roleAllowed =
    roleMarkerAllowsAdmin(data, "role") &&
    roleMarkerAllowsAdmin(data, "userType") &&
    roleMarkerAllowsAdmin(data, "type") &&
    (!hasOwn(data, "isAdmin") || data.isAdmin === true);
  const active =
    (!hasOwn(data, "isActive") || data.isActive === true) &&
    (!hasOwn(data, "status") || normalizeText(data.status) === "active");
  return roleAllowed && active;
}

async function requireActiveAdmin(request) {
  const callerUid = request.auth?.uid;
  if (!callerUid) {
    throw new HttpsError("unauthenticated", "Administrator sign-in is required.");
  }

  const snapshot = await db.collection("admin").doc(callerUid).get();
  if (!snapshot.exists || !isActiveAdmin(snapshot.data() || {})) {
    throw new HttpsError(
      "permission-denied",
      "Only an active administrator can manage grower accounts.",
    );
  }

  return callerUid;
}

function requiredString(value, label, maxLength) {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${label} is required.`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new HttpsError("invalid-argument", `${label} is required.`);
  }
  if (normalized.length > maxLength) {
    throw new HttpsError(
      "invalid-argument",
      `${label} must be ${maxLength} characters or fewer.`,
    );
  }
  return normalized;
}

function collectionNameFrom(value) {
  const collectionName = normalizeText(value);
  if (!ALLOWED_COLLECTIONS.has(collectionName)) {
    throw new HttpsError(
      "invalid-argument",
      "The grower collection must be user or users.",
    );
  }
  return collectionName;
}

function generateTemporaryPassword(length = 20) {
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%^&*_-+=";
  const all = lowercase + uppercase + digits + symbols;
  const characters = [
    lowercase[randomInt(lowercase.length)],
    uppercase[randomInt(uppercase.length)],
    digits[randomInt(digits.length)],
    symbols[randomInt(symbols.length)],
  ];

  while (characters.length < length) {
    characters.push(all[randomInt(all.length)]);
  }
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }
  return characters.join("");
}

function firebaseErrorCode(error) {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "";
}

function publicCreateError(error) {
  const code = firebaseErrorCode(error);
  if (code === "auth/email-already-exists") {
    return new HttpsError(
      "already-exists",
      "A Firebase Authentication account already uses this email address.",
    );
  }
  if (code === "auth/invalid-email") {
    return new HttpsError("invalid-argument", "Enter a valid email address.");
  }
  if (error instanceof HttpsError) return error;
  return new HttpsError(
    "internal",
    "The grower account could not be created. No partial account was kept.",
  );
}

export const createGrowerAccount = onCall({ region: REGION }, async (request) => {
  const callerUid = await requireActiveAdmin(request);
  const data = request.data || {};
  const firstName = requiredString(data.firstName, "First name", 80);
  const lastName = requiredString(data.lastName, "Last name", 80);
  const email = requiredString(data.email, "Email", 254).toLowerCase();
  const phoneNumber = requiredString(data.phoneNumber, "Phone number", 40);
  const address = requiredString(data.address, "Address", 300);
  const collectionName = collectionNameFrom(data.collectionName);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "Enter a valid email address.");
  }

  const fullName = `${firstName} ${lastName}`;
  let createdUser = null;
  try {
    createdUser = await auth.createUser({
      displayName: fullName,
      email,
      emailVerified: false,
      password: generateTemporaryPassword(),
      disabled: false,
    });

    const profileRef = db.collection(collectionName).doc(createdUser.uid);
    const counterRef = db.collection("configuration").doc("grower_user_counter");
    const numericIdQuery = db
      .collection(collectionName)
      .where("user_id", ">=", 0)
      .orderBy("user_id", "desc")
      .limit(1);

    const userId = await db.runTransaction(async (transaction) => {
      const counterSnapshot = await transaction.get(counterRef);
      const idSnapshot = await transaction.get(numericIdQuery);
      const counterValue = counterSnapshot.exists
        ? Number(counterSnapshot.data()?.lastUserId)
        : 0;
      const existingValue = idSnapshot.empty
        ? 0
        : Number(idSnapshot.docs[0].get("user_id"));
      const nextUserId = Math.max(
        Number.isFinite(counterValue) ? counterValue : 0,
        Number.isFinite(existingValue) ? existingValue : 0,
      ) + 1;

      transaction.set(
        counterRef,
        {
          lastUserId: nextUserId,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: callerUid,
        },
        { merge: true },
      );
      transaction.set(
        profileRef,
        {
          user_id: nextUserId,
          first_name: firstName,
          last_name: lastName,
          name: fullName,
          email,
          phone_num: phoneNumber,
          address,
          role: "grower",
          status: "active",
          isActive: true,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdBy: callerUid,
        },
        { merge: true },
      );
      return nextUserId;
    });

    logger.info("Grower account created", {
      callerUid,
      growerUid: createdUser.uid,
      collectionName,
      userId,
    });
    return { uid: createdUser.uid, email, userId, collectionName };
  } catch (error) {
    if (createdUser) {
      await auth.deleteUser(createdUser.uid).catch((rollbackError) => {
        logger.error("Failed to roll back grower Auth account", {
          growerUid: createdUser.uid,
          error: rollbackError,
        });
      });
    }
    logger.error("Create grower failed", { callerUid, error });
    throw publicCreateError(error);
  }
});

export const deleteGrowerAccount = onCall({ region: REGION }, async (request) => {
  const callerUid = await requireActiveAdmin(request);
  const data = request.data || {};
  const growerUid = requiredString(data.uid, "Grower UID", 128);
  const collectionName = collectionNameFrom(data.collectionName);
  const confirmation = requiredString(data.confirmation, "Confirmation", 20);

  if (confirmation !== "DELETE") {
    throw new HttpsError(
      "failed-precondition",
      "Type DELETE exactly to confirm permanent account deletion.",
    );
  }
  if (growerUid === callerUid) {
    throw new HttpsError(
      "failed-precondition",
      "You cannot delete the account you are currently using.",
    );
  }

  const profileRef = db.collection(collectionName).doc(growerUid);
  const [profileSnapshot, adminSnapshot] = await Promise.all([
    profileRef.get(),
    db.collection("admin").doc(growerUid).get(),
  ]);
  if (!profileSnapshot.exists) {
    throw new HttpsError("not-found", "The selected grower profile no longer exists.");
  }
  if (adminSnapshot.exists) {
    throw new HttpsError(
      "failed-precondition",
      "An administrator account cannot be deleted from Grower Management.",
    );
  }

  const profile = profileSnapshot.data() || {};
  const role = normalizeText(profile.role);
  if (role && role !== "grower" && role !== "user") {
    throw new HttpsError(
      "failed-precondition",
      "The selected profile is not a grower account.",
    );
  }

  let authAccountExisted = true;
  try {
    await auth.deleteUser(growerUid);
  } catch (error) {
    if (firebaseErrorCode(error) === "auth/user-not-found") {
      authAccountExisted = false;
    } else {
      logger.error("Grower Auth deletion failed", {
        callerUid,
        growerUid,
        collectionName,
        error,
      });
      throw new HttpsError(
        "internal",
        "The Firebase Authentication account could not be deleted. No Firestore data was removed.",
      );
    }
  }

  try {
    await db.recursiveDelete(profileRef);
  } catch (error) {
    logger.error("Grower Firestore recursive deletion failed", {
      callerUid,
      growerUid,
      collectionName,
      authAccountExisted,
      error,
    });
    throw new HttpsError(
      "internal",
      "The sign-in account was removed, but stored grower data could not be fully deleted. Retry this deletion to finish cleanup.",
    );
  }

  logger.info("Grower account deleted", {
    callerUid,
    growerUid,
    collectionName,
    authAccountExisted,
  });
  return {
    uid: growerUid,
    collectionName,
    authAccountExisted,
    retainedAuditCollections: [
      "environmental_alerts",
      "support_tickets",
      "ticket_history",
    ],
  };
});
