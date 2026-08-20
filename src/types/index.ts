export type Tone = "ink" | "navy" | "clay" | "sand" | "dune";

// --- Raw backend shapes (as returned by the NestJS API) ---

export interface ProductImage {
  id: string;
  url: string;
  publicId: string;
  isPrimary: boolean;
  position: number;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  _count: { products: number };
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  sizes: string[];
  colors: string[];
  stock: number;
  sku: string | null;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category: ApiCategory;
  images: ProductImage[];
}

export interface PaginatedResult<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// --- Display shapes (derived at the data-fetching boundary, see src/lib/adapters.ts) ---

export interface Product extends Omit<ApiProduct, "compareAtPrice"> {
  compareAtPrice?: number;
  tone: Tone;
  flatImage: string;
  primaryImage: string;
}

export interface CategoryDisplay {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  tone: Tone;
  image: string;
  count: number;
}

// --- Accounts ---

export type Role = "SUPER_ADMIN" | "USER";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface Address {
  id: string;
  userId: string;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  postalCode?: string | null;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Cart / wishlist ---

export interface CartLine {
  id: string;
  userId: string;
  productId: string;
  size: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: ApiProduct;
}

export interface Cart {
  items: CartLine[];
  subtotal: number;
  totalItems: number;
}

export interface WishlistLine {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: ApiProduct;
}

// --- Orders & payments ---

export type PaymentMethod =
  | "CASH_ON_DELIVERY"
  | "CARD_ON_DELIVERY"
  | "CARD"
  | "JAZZCASH"
  | "EASYPAISA"
  | "BANK_TRANSFER";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider?: string | null;
  providerTxnRef?: string | null;
  providerPaymentId?: string | null;
  amount: number;
  currency: string;
  bankReferenceNumber?: string | null;
  bankTransferAmount?: number | null;
  proofImageUrl?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankDetails {
  accountTitle?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  branch?: string;
  instructions?: string;
}

export type InitiatePaymentResult =
  | { type: "none"; message: string }
  | { type: "bank_transfer"; amount: number; bankDetails: BankDetails }
  | { type: "redirect"; actionUrl: string; fields: Record<string, string> }
  | { type: "redirect_simple"; url: string }
  | { type: "demo"; method: PaymentMethod; message: string };

// --- Payment settings (Admin -> Payment Settings, and checkout's public read) ---

export type PaymentMode = "DEMO" | "LIVE";

export interface PaymentProviderPublic {
  provider: PaymentMethod;
  enabled: boolean;
  publicConfig: Record<string, unknown> | null;
}

export interface PaymentSettingsPublic {
  mode: PaymentMode;
  providers: PaymentProviderPublic[];
}

export interface PaymentProviderAdmin extends PaymentProviderPublic {
  hasSecretConfigured: boolean;
  updatedAt: string | null;
}

export interface PaymentSettingsAdmin {
  mode: PaymentMode;
  providers: PaymentProviderAdmin[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  price: number;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  total: number;
  contactEmail: string;
  contactPhone: string;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
  payment?: Payment | null;
  address?: Address | null;
  user?: { id: string; email: string; firstName: string; lastName: string } | null;
}

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// --- Site config (unrelated to the backend, unchanged) ---

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  href: string;
}
