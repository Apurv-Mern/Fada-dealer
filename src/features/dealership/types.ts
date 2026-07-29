export type DealerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  dealerCode: string;
  status: string;
  isActive: boolean;
  totalOutlets: number;
  allEmployees: number;
  typeOfDealership: string;
  yearOfEstablishment: string;
  panNumber: string;
  fadaMembershipId: string;
  fadaMemberSince: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  gstNumber: string;
  /** Profile / logo image URL when the API provides one. */
  logoUrl: string;
};

export type DealerProfileUpdateInput = {
  name: string;
  phone: string;
  typeOfDealership: string;
  yearOfEstablishment: string;
  panNumber: string;
  fadaMembershipId: string;
  fadaMemberSince: string;
};

export type KeyContact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  isActive: boolean;
};

export type KeyContactInput = {
  name: string;
  email: string;
  phone: string;
  designation: string;
  isActive?: boolean;
};

export type BusinessDocumentUpload = {
  id: string;
  documentUrl: string;
  status: string;
  isVerified: boolean;
  uploadedAt: string;
};

export type BusinessDocument = {
  id: string;
  name: string;
  category: string;
  notes: string;
  isMandatory: boolean;
  isVerificationRequired: boolean;
  isUploaded: boolean;
  upload: BusinessDocumentUpload | null;
};

export type DealershipActivityMetric = {
  id: string;
  label: string;
  value: number;
  tone: "blue" | "orange" | "purple" | "green" | "warning";
};

export type DealershipActivity = {
  period: string;
  metrics: DealershipActivityMetric[];
};

export type DealershipPageData = {
  profile: DealerProfile;
  contacts: KeyContact[];
  documents: BusinessDocument[];
  activity: DealershipActivity;
};

/** Trimmed display string; empty when missing. */
export function displayValue(value: unknown): string {
  if (value == null) return "";
  const text = String(value).trim();
  return text;
}
