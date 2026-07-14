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
};

export type AssistantReply = {
  message: string;
  products: AssistantProduct[];
  suggestions: string[];
};

export type AssistantRequest = {
  message: string;
};

export interface ShoppingAssistantProvider {
  respond(input: AssistantRequest): Promise<AssistantReply>;
}
