import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const smtp = this.config.get("app.smtp");

    this.logger.debug(
      `SMTP config loaded — host="${smtp?.host}" port=${smtp?.port} user="${smtp?.user}" pass=${smtp?.pass ? "***set***" : "NOT SET"} from="${smtp?.from}"`,
    );

    if (smtp?.host && smtp?.user && smtp?.pass) {
      this.transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465,
        auth: { user: smtp.user, pass: smtp.pass },
      });
      this.logger.log(`SMTP transporter created (${smtp.host}:${smtp.port})`);
    } else {
      this.logger.warn(
        `SMTP not fully configured — emails will be logged to console. Missing: ${[!smtp?.host && "SMTP_HOST", !smtp?.user && "SMTP_USER", !smtp?.pass && "SMTP_PASS"].filter(Boolean).join(", ")}`,
      );
    }
  }

  async sendNoticeMail(
    to: string,
    tenantName: string,
    roomName: string,
    propertyName: string,
    vacatingDate: Date,
  ): Promise<void> {
    const from = this.config.get<string>("app.smtp.from");
    const dateStr = vacatingDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const subject = `Move-Out Notice — ${roomName}`;
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#d97706;">Move-Out Notice</h2>
        <p>Hi,</p>
        <p><strong>${tenantName}</strong> has set a move-out date of <strong>${dateStr}</strong> for <strong>${roomName}</strong> at <strong>${propertyName}</strong>.</p>
        <p style="color:#6b7280;font-size:13px;">You can view or update this in RentoRoll.</p>
      </div>`;

    if (this.transporter) {
      this.logger.log(`Sending move-out notice email to ${to}...`);
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          html,
        });
        this.logger.log(
          `Move-out notice sent to ${to} — messageId: ${info.messageId}`,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed to send notice email to ${to}: ${err.message}`,
          err.stack,
        );
        // fire-and-forget — swallow error
      }
    } else {
      this.logger.warn(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      this.logger.warn(
        `  DEV MODE — Move-out notice for ${to}: ${tenantName} leaving ${roomName} on ${dateStr}`,
      );
      this.logger.warn(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    }
  }

  async sendOtp(to: string, name: string, otp: string): Promise<void> {
    const from = this.config.get<string>("app.smtp.from");
    const subject = "RentoRoll — Your password reset OTP";
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#4f46e5;">Reset your password</h2>
        <p>Hi ${name},</p>
        <p>Use the OTP below to reset your RentoRoll password. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111827;
                    background:#f3f4f6;border-radius:8px;padding:16px 24px;
                    display:inline-block;margin:16px 0;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px;">If you didn't request this, ignore this email.</p>
      </div>`;

    if (this.transporter) {
      this.logger.log(`Sending OTP email to ${to}...`);
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          html,
        });
        this.logger.log(
          `OTP email sent to ${to} — messageId: ${info.messageId}`,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed to send OTP email to ${to}: ${err.message}`,
          err.stack,
        );
        throw err;
      }
    } else {
      this.logger.warn(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      this.logger.warn(`  DEV MODE — OTP for ${to}: ${otp}`);
      this.logger.warn(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    }
  }
}
