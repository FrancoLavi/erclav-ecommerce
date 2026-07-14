import { deterministicAssistant } from "@/lib/assistant/rules-provider";
import type { ShoppingAssistantProvider } from "@/lib/assistant/types";

// Swap this provider for an API-backed adapter without changing the route or UI.
export function getShoppingAssistant(): ShoppingAssistantProvider {
  return deterministicAssistant;
}

export type { AssistantProduct, AssistantReply } from "@/lib/assistant/types";
