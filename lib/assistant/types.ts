export type AssistantVariant = {
  id: string;
  color: string | null;
  size: string | null;
  price: number;
  available: number;
};

export type AssistantProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  image: string | null;
  available: number;
  colors: string[];
  sizes: string[];
  variants: AssistantVariant[];
};

export type AssistantOrder = {
  orderNumber: string;
  status: string;
  statusLabel: string;
  paymentStatusLabel: string;
  total: number;
  currency: string;
  createdAt: string;
};

export type AssistantConversationContext = {
  lastSearch?: string;
};

export type AssistantReply = {
  message: string;
  products: AssistantProduct[];
  orders?: AssistantOrder[];
  suggestions: string[];
  context?: AssistantConversationContext;
};

export type AssistantRequest = {
  message: string;
  context?: AssistantConversationContext;
  userId?: string;
};

export interface ShoppingAssistantProvider {
  respond(input: AssistantRequest): Promise<AssistantReply>;
}
