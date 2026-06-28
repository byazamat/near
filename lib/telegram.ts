import TelegramBot from "node-telegram-bot-api";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

let bot: TelegramBot | null = null;
if (TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
}

export async function sendToAdmin(message: string): Promise<void> {
  if (!bot || !TELEGRAM_ADMIN_CHAT_ID) {
    console.log("[telegram] missing config, skipping message:", message);
    return;
  }

  try {
    await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message);
  } catch (error) {
    console.log("[telegram] error sending message:", error);
  }
}
