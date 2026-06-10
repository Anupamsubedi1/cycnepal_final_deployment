import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { VacancyApplication } from "@/services/vacancy-application-service";

export interface TransactionRow {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateNameNepali: string;
  email: string;
  phone: string;
  citizenshipNumber: string;
  gender: string;
  dobAD: string;
  jobTitle: string;
  applicationStatus: string;
  appliedAt: string;
  txnId: string;
  txnDate: string;
  txnAmount: number;
  paymentOption: "esewa" | "khalti" | "unknown";
  voucherNo: string;
  status: "success" | "pending" | "failed";
}

function parseTopPayment(app: VacancyApplication): Record<string, unknown> {
  try {
    return app.payment ? (JSON.parse(app.payment) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function parsePaymentData(app: VacancyApplication): Record<string, unknown> {
  try {
    const resp = app.responses.find((r) => r.fieldId === "paymentData");
    if (!resp || typeof resp.value !== "string") return {};
    return JSON.parse(resp.value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function parseResponseJson(app: VacancyApplication, fieldId: string): Record<string, unknown> {
  try {
    const resp = app.responses.find((r) => r.fieldId === fieldId);
    if (!resp || typeof resp.value !== "string") return {};
    return JSON.parse(resp.value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyAdminSession(token);
    if (!session?.sub || !ObjectId.isValid(session.sub)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();

    const vacancies = await db
      .collection("vacancies")
      .find({})
      .project({ _id: 1, titleEn: 1, titleNp: 1 })
      .toArray();

    const vacancyMap = new Map(
      vacancies.map((v) => [
        (v._id as ObjectId).toString(),
        (v.titleNp || v.titleEn) as string,
      ]),
    );

    const vacancyIds = vacancies.map((v) => v._id as ObjectId);
    if (vacancyIds.length === 0) {
      return NextResponse.json({ transactions: [] });
    }

    const applications = await db
      .collection<VacancyApplication>("vacancy_applications")
      .find({ vacancyId: { $in: vacancyIds } })
      .sort({ updatedAt: -1 })
      .toArray();

    const transactions: TransactionRow[] = [];

    for (const app of applications) {
      const top = parseTopPayment(app);
      const pd = parsePaymentData(app);
      const personal = parseResponseJson(app, "personalDetails");
      const contact = parseResponseJson(app, "contactDetails");

      const formName = [personal.firstName, personal.middleName, personal.lastName]
        .filter(Boolean).join(" ");
      const formNameNepali = [personal.firstNameNepali, personal.middleNameNepali, personal.lastNameNepali]
        .filter(Boolean).join(" ");

      // Merge: top-level payment is the most up-to-date
      const provider = (top.provider || pd.provider || "") as string;
      const statusRaw = String(top.status || pd.status || "").toUpperCase();
      const verified = Boolean(top.verified ?? pd.verified ?? false);

      // Determine txn status
      let status: "success" | "pending" | "failed";
      if (statusRaw === "COMPLETE" && verified) {
        status = "success";
      } else if (
        statusRaw === "PENDING" ||
        statusRaw === "INITIATED" ||
        statusRaw === ""
      ) {
        status = "pending";
      } else {
        status = "failed";
      }

      // Skip applications with no payment attempt at all
      if (!top.status && !pd.status) continue;

      // Payment fields differ by provider
      let txnId = "";
      let voucherNo = "";
      let txnAmount = 0;
      let txnDate = "";
      let paymentOption: "esewa" | "khalti" | "unknown" = "unknown";

      if (provider === "khalti" || top.pidx || pd.pidx) {
        paymentOption = "khalti";
        txnId = String(top.pidx || pd.pidx || "");
        voucherNo = String(top.transactionId || pd.transactionId || "");
        txnAmount = Number(top.amount || pd.totalAmount || 0);
        txnDate = String(top.verifiedAt || pd.verifiedAt || top.initiatedAt || app.updatedAt.toISOString());
      } else if (provider === "esewa" || top.transactionUuid || pd.transactionUuid) {
        paymentOption = "esewa";
        txnId = String(top.transactionUuid || pd.transactionUuid || "");
        voucherNo = String(top.refId || pd.refId || "");
        txnAmount = Number(top.amount || pd.totalAmount || 0);
        txnDate = String(top.verifiedAt || pd.verifiedAt || top.initiatedAt || app.updatedAt.toISOString());
      } else {
        txnDate = app.updatedAt.toISOString();
      }

      transactions.push({
        applicationId: app._id!.toString(),
        candidateId: app.userId.toString(),
        candidateName: formName || app.userFullName || app.userEmail,
        candidateNameNepali: formNameNepali,
        email: String(contact.email || app.userEmail || ""),
        phone: String(contact.mobile || app.userPhone || ""),
        citizenshipNumber: String(personal.citizenshipNumber || ""),
        gender: String(personal.gender || ""),
        dobAD: String(personal.dobAD || ""),
        jobTitle: vacancyMap.get(app.vacancyId.toString()) || "—",
        applicationStatus: app.status,
        appliedAt: app.createdAt.toISOString(),
        txnId,
        txnDate,
        txnAmount,
        paymentOption,
        voucherNo,
        status,
      });
    }

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Transactions error:", error);
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}
