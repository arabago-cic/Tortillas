import nodemailer from "nodemailer";
import { db } from "../db";
import { members } from "../db/schema";
import { eq } from "drizzle-orm";
import { getTodayAssignment } from "./schedule";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: parseInt(process.env.SMTP_PORT || "587", 10) === 465,
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email using the configured SMTP transport.
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const transport = getTransporter();
  const from = process.env.SMTP_FROM || "tortillas@example.com";

  await transport.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

/**
 * Send a reminder email to the member who is assigned to bring tortillas.
 */
/**
 * Send daily notification to all members with email,
 * informing them who brings tortillas today.
 * Only sends if there is an assignment for today.
 */
export async function sendDailyNotification(): Promise<void> {
  const assignment = await getTodayAssignment();

  if (!assignment.member) {
    console.log("[Email] No hay asignación para hoy, no se envían emails.");
    return;
  }

  const assignedName = assignment.member.name;
  const date = assignment.date;

  // Get all active members with email
  let allMembers;
  try {
    allMembers = await db
      .select()
      .from(members)
      .where(eq(members.active, true));
  } catch (err) {
    console.error("[Email] Error obteniendo miembros:", err);
    return;
  }

  const withEmail = allMembers.filter((m) => m.email);
  if (withEmail.length === 0) {
    console.log("[Email] Ningún miembro tiene email configurado.");
    return;
  }

  console.log(`[Email] Enviando notificación a ${withEmail.length} miembros: hoy trae ${assignedName}`);

  for (const member of withEmail) {
    try {
      await sendEmail({
        to: member.email!,
        subject: `🫓 Hoy trae tortillas: ${assignedName}`,
        text: `Hola ${member.name},\n\nHoy (${date}) le toca traer tortillas a ${assignedName}.\n\n¡Buen provecho!`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #92400e;">🫓 Tortillas de Hoy</h2>
            <p>Hola <strong>${member.name}</strong>,</p>
            <p>Hoy <strong>(${date})</strong> le toca traer tortillas a:</p>
            <p style="font-size: 24px; text-align: center; padding: 16px; background: #fef3c7; border-radius: 8px;">
              <strong>${assignedName}</strong>
            </p>
            <p>¡Buen provecho!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">Calendario de Tortillas del Departamento</p>
          </div>
        `,
      });
      console.log(`[Email] Enviado a ${member.name} (${member.email})`);
    } catch (err) {
      console.error(`[Email] Error enviando a ${member.email}:`, err);
    }
  }
}
