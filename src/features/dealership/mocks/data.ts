import type {
  BusinessDocument,
  DealerProfile,
  DealershipActivity,
  KeyContact,
} from "@/features/dealership/types";

export const emptyActivity: DealershipActivity = {
  period: "month",
  metrics: [
    { id: "joins", label: "New Joins", value: 0, tone: "blue" },
    { id: "exits", label: "Exits", value: 0, tone: "orange" },
    { id: "transfers", label: "Transfers", value: 0, tone: "purple" },
    { id: "docs", label: "Docs Uploaded", value: 0, tone: "green" },
    { id: "pending", label: "Requests Pending", value: 0, tone: "warning" },
  ],
};

export const mockDealerProfile: DealerProfile = {
  id: "1",
  name: "Sharma Motors Pvt Ltd",
  email: "dealer@example.com",
  phone: "9876543210",
  dealerCode: "DLR-001",
  status: "approved",
  isActive: true,
  totalOutlets: 3,
  allEmployees: 42,
  typeOfDealership: "Authorised Dealer",
  yearOfEstablishment: "2010",
  panNumber: "AAKCS1234K",
  fadaMembershipId: "FADA-MH-001245",
  fadaMemberSince: "2012-01-15",
  address: "MG Road",
  city: "Pune",
  state: "Maharashtra",
  pinCode: "411001",
  country: "India",
  gstNumber: "27AAKCS1234K1Z5",
  natureOfBusiness: "Automobile retail and service",
  brandsRepresented: "Maruti Suzuki, Honda",
  brandIds: [2, 1],
  totalShowrooms: 2,
  totalWorkshops: 3,
  primaryContactName: "Rajesh Sharma",
  primaryContactPhone: "9876543210",
  logoUrl: "",
};

export const mockContacts: KeyContact[] = [
  {
    id: "c1",
    name: "Rajesh Sharma",
    email: "rajesh@example.com",
    phone: "9876543210",
    designation: "Owner",
    isActive: true,
  },
  {
    id: "c2",
    name: "Priya Patel",
    email: "priya@example.com",
    phone: "9876501234",
    designation: "GM",
    isActive: true,
  },
];

export const mockDocuments: BusinessDocument[] = [
  {
    id: "d1",
    name: "GST Certificate",
    category: "Compliance",
    notes: "Upload clear PDF",
    isMandatory: true,
    isVerificationRequired: true,
    isUploaded: false,
    upload: null,
  },
  {
    id: "d2",
    name: "PAN Card",
    category: "Identity",
    notes: "",
    isMandatory: true,
    isVerificationRequired: true,
    isUploaded: true,
    upload: {
      id: "u1",
      documentUrl: "https://example.com/pan.pdf",
      status: "pending",
      isVerified: false,
      uploadedAt: "",
    },
  },
];
