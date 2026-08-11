import { handleOxapayWebhook } from "@/lib/payments/webhook-handler";

// POST /api/payments/oxapay/webhook — канонический callback_url для OxaPay.
// Вся логика (подпись, статусы, идемпотентность, активация) — в общем обработчике.
export async function POST(req: Request) {
  return handleOxapayWebhook(req);
}
