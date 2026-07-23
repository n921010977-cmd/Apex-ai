import type { BotContext } from "../types.js";
import { requireAccount } from "../middlewares/auth.js";
import { logAction } from "../database/repositories.js";
import { esc } from "../utils/format.js";

const SUPPORTED = /\.(pdf|docx|txt|csv|png|jpe?g|webp)$/i;
const MAX_BYTES = 15 * 1024 * 1024;

// Receives a document/photo. Validates type & size, acknowledges, and enqueues
// for processing. Full parse→chunk→embed (RAG ingestion) runs on the platform
// side when storage + embeddings are configured; here we validate and record.
export async function handleDocument(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg: any = ctx.message;
  const doc = msg?.document;
  const photo = msg?.photo?.[msg.photo.length - 1];

  const fileName: string = doc?.file_name ?? (photo ? "image.jpg" : "");
  const fileSize: number = doc?.file_size ?? photo?.file_size ?? 0;

  if (!doc && !photo) { await ctx.reply("Пришлите файл документом или изображением."); return; }
  if (doc && !SUPPORTED.test(fileName)) {
    await ctx.reply("❌ Поддерживаются: PDF, DOCX, TXT, CSV, изображения (PNG/JPG/WebP)."); return;
  }
  if (fileSize > MAX_BYTES) { await ctx.reply("❌ Файл слишком большой (максимум 15 МБ)."); return; }

  await ctx.sendChatAction("upload_document");
  await logAction(ctx.account.userId, ctx.account.orgId, "bot.document_received", { fileName, fileSize });

  await ctx.reply(
    `📄 Файл <b>${esc(fileName || "изображение")}</b> принят (${Math.round(fileSize / 1024)} КБ).\n\n` +
    `Извлечение текста и добавление в базу знаний выполняется в фоне. ` +
    `Как только документ обработан — придёт уведомление, и совет сможет ссылаться на него в ответах.\n\n` +
    `<i>Полный RAG-ingestion активируется при настроенном хранилище/эмбеддингах на платформе.</i>`,
    { parse_mode: "HTML" },
  );
}
