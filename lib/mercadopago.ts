import crypto from "crypto";

const apiBaseUrl = "https://api.mercadopago.com";

type PreferencePayload = {
  items: {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }[];
  payer: {
    email?: string | null;
    name?: string | null;
    surname?: string | null;
  };
  shipments?: {
    cost: number;
    mode: "not_specified";
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: "approved";
  notification_url: string;
  external_reference: string;
  statement_descriptor?: string;
  metadata?: Record<string, unknown>;
};

type MercadoPagoPreference = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

export type MercadoPagoPayment = {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  metadata?: Record<string, unknown>;
};

function accessToken() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Falta configurar MP_ACCESS_TOKEN en .env");
  }
  return token;
}

export function appUrl() {
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

export async function createMercadoPagoPreference(payload: PreferencePayload) {
  const response = await fetch(`${apiBaseUrl}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await response.json()) as MercadoPagoPreference & { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? "Mercado Pago rechazo la preferencia.");
  }

  return data;
}

export async function getMercadoPagoPayment(paymentId: string) {
  const response = await fetch(`${apiBaseUrl}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken()}`,
    },
    cache: "no-store",
  });

  const data = (await response.json()) as MercadoPagoPayment & { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? "No se pudo consultar el pago en Mercado Pago.");
  }

  return data;
}

export function mapMercadoPagoPaymentStatus(status: string) {
  if (status === "approved") return "PAID";
  if (status === "authorized" || status === "in_process" || status === "pending") return "PENDING";
  if (status === "refunded" || status === "charged_back") return "REFUNDED";
  if (status === "cancelled") return "CANCELLED";
  return "FAILED";
}

export function verifyMercadoPagoSignature({
  signature,
  requestId,
  dataId,
}: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature || !requestId || !dataId) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
}
