export interface KhaltiConfig {
  secretKey: string;
  initiateUrl: string;
  lookupUrl: string;
}

export interface KhaltiInitPayload {
  return_url: string;
  website_url: string;
  amount: number; // in paisa
  purchase_order_id: string;
  purchase_order_name: string;
  customer_info?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface KhaltiInitResponse {
  pidx: string;
  payment_url: string;
  expires_at: string;
  expires_in: number;
}

export interface KhaltiLookupResponse {
  pidx: string;
  total_amount: number;
  status: string; // "Completed" | "Pending" | "Initiated" | "Refunded" | "Expired" | "User canceled"
  transaction_id: string | null;
  fee: number;
  refunded: boolean;
}

export function getKhaltiConfig(): KhaltiConfig {
  const secretKey = process.env.KHALTI_SECRET_KEY || "";
  const isSandbox = process.env.KHALTI_SANDBOX !== "false";
  const initiateUrl =
    process.env.KHALTI_INITIATE_URL ||
    (isSandbox
      ? "https://dev.khalti.com/api/v2/epayment/initiate/"
      : "https://khalti.com/api/v2/epayment/initiate/");
  const lookupUrl =
    process.env.KHALTI_LOOKUP_URL ||
    (isSandbox
      ? "https://dev.khalti.com/api/v2/epayment/lookup/"
      : "https://khalti.com/api/v2/epayment/lookup/");

  return { secretKey, initiateUrl, lookupUrl };
}

export async function initiateKhaltiPayment(
  payload: KhaltiInitPayload,
): Promise<KhaltiInitResponse> {
  const config = getKhaltiConfig();

  const res = await fetch(config.initiateUrl, {
    method: "POST",
    headers: {
      "Authorization": `Key ${config.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Khalti initiate failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<KhaltiInitResponse>;
}

export async function lookupKhaltiPayment(
  pidx: string,
): Promise<KhaltiLookupResponse> {
  const config = getKhaltiConfig();

  const res = await fetch(config.lookupUrl, {
    method: "POST",
    headers: {
      "Authorization": `Key ${config.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pidx }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Khalti lookup failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<KhaltiLookupResponse>;
}
