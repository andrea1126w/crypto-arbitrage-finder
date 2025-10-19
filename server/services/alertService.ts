import { db } from "../db";
import { alertConfigs } from "@shared/schema";
import { eq } from "drizzle-orm";

interface AlertPayload {
  type: string;
  title: string;
  message: string;
  data?: any;
  urgency?: "low" | "medium" | "high" | "critical";
}

class AlertService {
  async sendAlert(payload: AlertPayload) {
    try {
      const configs = await db.select().from(alertConfigs).where(eq(alertConfigs.enabled, true));

      for (const config of configs) {
        // Check silent hours
        if (config.silentHoursStart !== null && config.silentHoursEnd !== null) {
          const currentHour = new Date().getHours();
          if (currentHour >= config.silentHoursStart && currentHour <= config.silentHoursEnd) {
            continue; // Skip during silent hours
          }
        }

        // Send based on type
        if (config.type === "telegram" && config.telegramBotToken && config.telegramChatId) {
          await this.sendTelegram(config.telegramBotToken, config.telegramChatId, payload);
        } else if (config.type === "discord" && config.webhookUrl) {
          await this.sendDiscord(config.webhookUrl, payload);
        }
      }
    } catch (error) {
      console.error("Error sending alert:", error);
    }
  }

  private async sendTelegram(botToken: string, chatId: string, payload: AlertPayload) {
    try {
      const text = `${payload.title}\n\n${payload.message}`;
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "HTML",
        }),
      });

      if (!response.ok) {
        console.error("Telegram send failed:", await response.text());
      }
    } catch (error) {
      console.error("Telegram error:", error);
    }
  }

  private async sendDiscord(webhookUrl: string, payload: AlertPayload) {
    try {
      const color = payload.urgency === "critical" ? 0xFF0000 
        : payload.urgency === "high" ? 0xFFA500
        : payload.urgency === "medium" ? 0xFFFF00 
        : 0x00FF00;

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: payload.title,
            description: payload.message,
            color: color,
            timestamp: new Date().toISOString(),
          }],
        }),
      });

      if (!response.ok) {
        console.error("Discord send failed:", await response.text());
      }
    } catch (error) {
      console.error("Discord error:", error);
    }
  }

  async addConfig(config: typeof alertConfigs.$inferInsert) {
    await db.insert(alertConfigs).values(config);
  }

  async getConfigs() {
    return db.select().from(alertConfigs);
  }

  async updateConfig(id: number, updates: Partial<typeof alertConfigs.$inferInsert>) {
    await db.update(alertConfigs).set(updates).where(eq(alertConfigs.id, id));
  }

  async deleteConfig(id: number) {
    await db.delete(alertConfigs).where(eq(alertConfigs.id, id));
  }
}

export const alertService = new AlertService();
