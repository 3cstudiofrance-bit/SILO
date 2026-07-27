// ============================================================
// 3C STUDIO — Types TypeScript centralisés
// ============================================================

export type UserRole = "client" | "agency" | "project_manager" | "admin";
export type ProjectStatus =
  | "lead"
  | "qualification"
  | "devis"
  | "validation"
  | "production"
  | "livraison_agence"
  | "verification"
  | "livraison_client"
  | "correction"
  | "validation_finale"
  | "notation"
  | "archive";
export type ProjectType =
  | "mariage"
  | "clip"
  | "corporate"
  | "reseaux"
  | "evenement"
  | "pub";
export type MissionStatus =
  | "disponible"
  | "en_cours"
  | "rendu"
  | "valide"
  | "archive";
export type QuoteStatus =
  | "brouillon"
  | "envoye"
  | "accepte"
  | "refuse"
  | "expire";
export type InvoiceStatus =
  | "brouillon"
  | "envoye"
  | "paye"
  | "en_retard"
  | "annule";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type FileType =
  | "video"
  | "photo"
  | "audio"
  | "document"
  | "contract"
  | "invoice";
export type SignatureStatus =
  | "pending"
  | "sent"
  | "signed"
  | "refused"
  | "expired";
export type NotificationType =
  | "project_created"
  | "project_updated"
  | "status_changed"
  | "message_received"
  | "file_uploaded"
  | "quote_sent"
  | "quote_accepted"
  | "invoice_sent"
  | "payment_received"
  | "delivery_ready"
  | "correction_requested"
  | "mention";

export interface UserProfile {
  id: string;
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
  role: UserRole;
  phone?: string;
  timezone: string;
  notificationPreferences: { email: boolean; push: boolean; inApp: boolean };
  isOnline: boolean;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  siret?: string;
  vatNumber?: string;
  address?: string;
  city?: string;
  zip?: string;
  country: string;
  website?: string;
  logoUrl?: string;
  billingEmail?: string;
}

export interface Agency {
  id: string;
  userProfileId?: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  specialties: ProjectType[];
  bio?: string;
  portfolioUrl?: string;
  status: "actif" | "inactif" | "suspendu";
  rating: number;
  missionsCount: number;
  currentMissions: number;
  joinDate: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: "haute" | "normale" | "basse";
  budget?: number;
  startDate?: string;
  deliveryDate?: string;
  shootingDate?: string;
  progress: number;
  tags: string[];
  brief?: Record<string, unknown>;
  clientId?: string;
  pmId?: string;
  agencyId?: string;
  // Populated relations
  client?: UserProfile;
  pm?: UserProfile;
  agency?: Agency;
  createdAt: string;
  updatedAt: string;
}

export interface Mission {
  id: string;
  projectId: string;
  agencyId?: string;
  title: string;
  brief?: string;
  status: MissionStatus;
  budget?: number;
  deadline?: string;
  deliverables: string[];
  priority: "haute" | "normale" | "basse";
  // Populated
  project?: Project;
  agency?: Agency;
}

export interface Conversation {
  id: string;
  projectId?: string;
  type: "project" | "support" | "direct";
  title?: string;
  participantIds: string[];
  lastMessageAt?: string;
  createdAt: string;
  // Populated
  participants?: UserProfile[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId?: string;
  content: string;
  type: "text" | "file" | "system" | "correction_request";
  metadata?: Record<string, unknown>;
  editedAt?: string;
  deletedAt?: string;
  readBy: string[];
  createdAt: string;
  // Populated
  sender?: UserProfile;
}

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  id: string;
  reference: string;
  projectId?: string;
  clientId?: string;
  status: QuoteStatus;
  amountHt: number;
  vatRate: number;
  amountTtc: number;
  validUntil?: string;
  items: QuoteItem[];
  notes?: string;
  signedAt?: string;
  signedBy?: string;
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  reference: string;
  projectId?: string;
  quoteId?: string;
  clientId?: string;
  status: InvoiceStatus;
  amountHt: number;
  vatRate: number;
  amountTtc: number;
  dueDate?: string;
  items: QuoteItem[];
  stripePaymentIntentId?: string;
  pdfPath?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  projectId?: string;
  clientId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  projectId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  projectId: string;
  reviewerId: string;
  subjectId: string;
  rating: number;
  comment?: string;
  aspects?: { quality?: number; communication?: number; timing?: number };
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  projectId?: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  createdAt: string;
  user?: UserProfile;
}

export interface Signature {
  id: string;
  documentType: "quote" | "contract" | "delivery_receipt";
  documentId: string;
  signerEmail: string;
  signerName?: string;
  status: SignatureStatus;
  provider: string;
  providerDocumentId?: string;
  signedAt?: string;
  signedDocumentUrl?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface VideoRoom {
  id: string;
  projectId: string;
  roomName: string;
  title?: string;
  startedAt?: string;
  endedAt?: string;
  participants: {
    userId: string;
    name: string;
    joinedAt: string;
    leftAt?: string;
  }[];
  recordingUrl?: string;
  createdBy?: string;
  createdAt: string;
}

export interface CollaborativeDocument {
  id: string;
  projectId: string;
  title: string;
  type: "brief" | "notes" | "script" | "storyboard";
  liveblocksRoomId?: string;
  content?: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// API Response types
// ============================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ============================================================
// Storage bucket names
// ============================================================

export const STORAGE_BUCKETS = {
  PROJECT_FILES: "project-files",
  DELIVERABLES: "deliverables",
  INVOICES: "invoices",
  QUOTES: "quotes",
  CONTRACTS: "contracts",
  AGENCY_ASSETS: "agency-assets",
  CLIENT_UPLOADS: "client-uploads",
} as const;

export type StorageBucket =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
