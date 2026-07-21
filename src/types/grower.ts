export type GrowerCollectionName = "user" | "users";
export type GrowerStatus = "active" | "inactive";

export type Grower = {
  uid: string;
  sourceCollection: GrowerCollectionName;
  name: string;
  email: string;
  status: GrowerStatus;
  isActive: boolean;
  address: string;
  createdAt: Date | null;
};

export type GrowerProfile = Grower & {
  updatedAt: Date | null;
};

export type CreateGrowerInput = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  collectionName: GrowerCollectionName;
};

export type CreateGrowerResult = {
  uid: string;
  email: string;
  userId: number;
  collectionName: GrowerCollectionName;
  passwordResetEmailSent: boolean;
};

export type DeleteGrowerResult = {
  uid: string;
  collectionName: GrowerCollectionName;
  authAccountExisted: boolean;
  retainedAuditCollections: string[];
};
