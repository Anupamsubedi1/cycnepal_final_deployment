import crypto from "crypto";

const DEFAULT_SIGNED_FIELDS = "total_amount,transaction_uuid,product_code";

export interface EsewaConfig {
  productCode: string;
  secretKey: string;
  formUrl: string;
  statusCheckUrl: string;
}

export interface EsewaInitPayload {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

export interface EsewaSuccessPayload {
  transaction_code: string;
  status: string;
  total_amount: string | number;
  transaction_uuid: string;
  product_code: string;
  signed_field_names: string;
  signature: string;
}

function toSignMessage(signedFieldNames: string, payload: Record<string, unknown>): string {
  return signedFieldNames
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean)
    .map((field) => `${field}=${String(payload[field] ?? "")}`)
    .join(",");
}

export function signEsewaPayload(
  signedFieldNames: string,
  payload: Record<string, unknown>,
  secretKey: string,
): string {
  const message = toSignMessage(signedFieldNames, payload);
  return crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("base64");
}

export function verifyEsewaPayloadSignature(
  payload: Record<string, unknown>,
  secretKey: string,
): boolean {
  const signedFieldNames = String(payload.signed_field_names || "");
  const receivedSignature = String(payload.signature || "");
  if (!signedFieldNames || !receivedSignature) {
    return false;
  }

  const expectedSignature = signEsewaPayload(signedFieldNames, payload, secretKey);
  return expectedSignature === receivedSignature;
}

export function getEsewaConfig(): EsewaConfig {
  // In production, never silently fall back to eSewa's public sandbox
  // credentials — that would make sandbox-signed payloads verify and real
  // payments fail. Require the real values to be configured.
  if (process.env.NODE_ENV === "production") {
    if (!process.env.ESEWA_PRODUCT_CODE || !process.env.ESEWA_SECRET_KEY) {
      throw new Error(
        "Missing eSewa configuration: ESEWA_PRODUCT_CODE and ESEWA_SECRET_KEY are required in production.",
      );
    }
  }

  const productCode = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
  const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
  const formUrl =
    process.env.ESEWA_FORM_URL ||
    "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
  const statusCheckUrl =
    process.env.ESEWA_STATUS_CHECK_URL ||
    "https://rc.esewa.com.np/api/epay/transaction/status/";

  return {
    productCode,
    secretKey,
    formUrl,
    statusCheckUrl,
  };
}

export function createEsewaInitPayload(params: {
  totalAmount: number;
  transactionUuid: string;
  successUrl: string;
  failureUrl: string;
}): EsewaInitPayload {
  const config = getEsewaConfig();
  const amountString = params.totalAmount.toFixed(2);
  const payloadWithoutSignature = {
    amount: amountString,
    tax_amount: "0",
    total_amount: amountString,
    transaction_uuid: params.transactionUuid,
    product_code: config.productCode,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: params.successUrl,
    failure_url: params.failureUrl,
    signed_field_names: DEFAULT_SIGNED_FIELDS,
  };

  const signature = signEsewaPayload(
    DEFAULT_SIGNED_FIELDS,
    payloadWithoutSignature,
    config.secretKey,
  );

  return {
    ...payloadWithoutSignature,
    signature,
  };
}

export function decodeEsewaSuccessData(base64Data: string): EsewaSuccessPayload | null {
  try {
    const decoded = Buffer.from(base64Data, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed as EsewaSuccessPayload;
  } catch {
    return null;
  }
}

export interface EsewaVerificationResult {
  verified: boolean;
  status: string;
  transactionUuid: string;
  totalAmount: number;
  refId: string | null;
  transactionCode: string;
}

export type EsewaVerificationOutcome =
  | { ok: true; data: EsewaVerificationResult }
  | { ok: false; status: number; error: string };

/**
 * Server-side, trusted verification of an eSewa success payload.
 * Verifies the HMAC signature with the secret key AND independently queries
 * eSewa's status-check API. Never trust client-supplied status/amount without
 * passing through this function.
 */
export async function verifyEsewaTransaction(
  encodedData: string,
): Promise<EsewaVerificationOutcome> {
  const trimmed = String(encodedData || "").trim();
  if (!trimmed) {
    return { ok: false, status: 400, error: "Missing eSewa response data" };
  }

  const decoded = decodeEsewaSuccessData(trimmed);
  if (!decoded) {
    return { ok: false, status: 400, error: "Invalid eSewa response payload" };
  }

  const config = getEsewaConfig();

  const signatureOk = verifyEsewaPayloadSignature(
    decoded as unknown as Record<string, unknown>,
    config.secretKey,
  );
  if (!signatureOk) {
    return { ok: false, status: 400, error: "Invalid eSewa signature" };
  }

  const totalAmount = String(decoded.total_amount || "");
  const statusCheckUrl = new URL(config.statusCheckUrl);
  statusCheckUrl.searchParams.set("product_code", String(decoded.product_code || ""));
  statusCheckUrl.searchParams.set("total_amount", totalAmount);
  statusCheckUrl.searchParams.set("transaction_uuid", String(decoded.transaction_uuid || ""));

  const statusResponse = await fetch(statusCheckUrl.toString(), { cache: "no-store" });
  if (!statusResponse.ok) {
    return { ok: false, status: 502, error: "Failed eSewa status check" };
  }

  const statusData = await statusResponse.json();
  const isComplete = String(statusData.status || "").toUpperCase() === "COMPLETE";

  if (!isComplete) {
    return {
      ok: false,
      status: 400,
      error: `Payment is not complete (status: ${statusData.status || "UNKNOWN"})`,
    };
  }

  return {
    ok: true,
    data: {
      verified: true,
      status: statusData.status,
      transactionUuid: String(statusData.transaction_uuid || decoded.transaction_uuid || ""),
      totalAmount: Number(statusData.total_amount || decoded.total_amount || 0),
      refId: statusData.ref_id || null,
      transactionCode: decoded.transaction_code,
    },
  };
}
