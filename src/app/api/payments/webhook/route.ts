import { handleOxapayWebhook } from "@/lib/payments/webhook-handler";

// POST /api/payments/webhook — прежний адрес callback'а. Оставлен как алиас,
// чтобы счета, выставленные до переезда на /api/payments/oxapay/webhook,
// по-прежнему подтверждались.
export async function POST(req: Request) {
  return handleOxapayWebhook(req);
}
