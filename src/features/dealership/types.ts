export type DealerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** Legacy / registration code field from API (`dealerCode`). */
  dealerCode: string;
  /** Business company code from API (`dealerId`, e.g. DL38758). */
  dealerId: string;
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
  natureOfBusiness: string;
  /** Comma-separated brand names for display. */
  brandsRepresented: string;
  /** Brand master IDs from GET for form round-trip. */
  brandIds: number[];
  totalShowrooms: number;
  totalWorkshops: number;
  primaryContactName: string;
  primaryContactPhone: string;
  /** Profile / logo image URL when the API provides one. */
  logoUrl: string;
};

export type BusinessDetailsUpdateInput = {
  natureOfBusiness: string;
  /** Brand master IDs sent to PUT /dealers/user/profile. */
  brandsRepresented: number[];
  totalShowrooms: number;
  totalWorkshops: number;
  city: string;
  state: string;
  pinCode: string;
};

export type DealerLocationUpdateInput = {
  city: string;
  state: string;
  pinCode: string;
  address?: string;
  gstNumber?: string;
};

export type PrimaryContactUpdateInput = {
  name: string;
  phone: string;
};

export type DealerProfileUpdateInput = {
  name: string;
  phone: string;
  typeOfDealership?: string;
  yearOfEstablishment: string;
  panNumber: string;
  fadaMembershipId: string;
  fadaMemberSince: string;
  address?: string;
  gstNumber?: string;
  dealerLocations?: DealerLocationUpdateInput;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContact?: PrimaryContactUpdateInput;
} & Partial<BusinessDetailsUpdateInput>;

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

/**
 * Company Code shown on Company Profile.
 * Product rule: API top-level `dealerId` (e.g. DL38758), not numeric `id`.
 */
export function companyCode(profile: Pick<DealerProfile, "dealerId">): string {
  return displayValue(profile.dealerId);
}

/** Placeholder shown for unfilled read-only profile fields. */
export const PROFILE_EMPTY_MARKER = "____";

/** Returns trimmed value or PROFILE_EMPTY_MARKER when blank. */
export function displayProfileField(value: unknown): string {
  const text = displayValue(value);
  return text || PROFILE_EMPTY_MARKER;
}

/** Whether a profile field has no displayable value. */
export function isProfileFieldEmpty(value: unknown): boolean {
  return !displayValue(value);
}

const REQUIRED_PROFILE_FIELDS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "panNumber", label: "PAN number" },
  { key: "gstNumber", label: "GST Number" },
] as const;

/** Human-readable labels for required PUT fields that are blank. */
export function missingRequiredProfileFields(
  input: DealerProfileUpdateInput,
): string[] {
  return REQUIRED_PROFILE_FIELDS.filter(
    ({ key }) => !String(input[key] ?? "").trim(),
  ).map(({ label }) => label);
}

/** Full PUT body: current profile + the section being edited. */
export function buildDealerProfileUpdate(
  profile: DealerProfile,
  patch: Partial<DealerProfileUpdateInput>,
): DealerProfileUpdateInput {
  const text = (value: unknown) => String(value ?? "").trim();
  const city = text(patch.city ?? profile.city);
  const state = text(patch.state ?? profile.state);
  const pinCode = text(patch.pinCode ?? profile.pinCode);
  const address = text(
    patch.address ?? patch.dealerLocations?.address ?? profile.address,
  );
  const gstNumber = text(
    patch.gstNumber ?? patch.dealerLocations?.gstNumber ?? profile.gstNumber,
  );
  const contactName = text(
    patch.primaryContactName ??
      patch.primaryContact?.name ??
      profile.primaryContactName,
  );
  const contactPhone = text(
    patch.primaryContactPhone ??
      patch.primaryContact?.phone ??
      profile.primaryContactPhone,
  );
  return {
    name: text(patch.name ?? profile.name),
    phone: text(patch.phone ?? profile.phone),
    typeOfDealership: text(patch.typeOfDealership ?? profile.typeOfDealership),
    yearOfEstablishment: text(
      patch.yearOfEstablishment ?? profile.yearOfEstablishment,
    ),
    panNumber: text(patch.panNumber ?? profile.panNumber),
    fadaMembershipId: text(patch.fadaMembershipId ?? profile.fadaMembershipId),
    fadaMemberSince: text(patch.fadaMemberSince ?? profile.fadaMemberSince),
    natureOfBusiness: text(patch.natureOfBusiness ?? profile.natureOfBusiness),
    brandsRepresented: patch.brandsRepresented ?? profile.brandIds ?? [],
    totalShowrooms: patch.totalShowrooms ?? profile.totalShowrooms,
    totalWorkshops: patch.totalWorkshops ?? profile.totalWorkshops,
    address,
    gstNumber,
    city,
    state,
    pinCode,
    dealerLocations: {
      city,
      state,
      pinCode,
      address,
      gstNumber,
    },
    primaryContactName: contactName,
    primaryContactPhone: contactPhone,
    primaryContact: patch.primaryContact ?? {
      name: contactName,
      phone: contactPhone,
    },
  };
}
