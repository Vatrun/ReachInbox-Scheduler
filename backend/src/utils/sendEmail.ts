import nodemailer from "nodemailer";

interface SenderCredentials {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
}

interface SendEmailParams {
  sender: SenderCredentials;
  to: string;
  subject: string;
  body: string;
}

export async function sendEmailViaEthereal({
  sender,
  to,
  subject,
  body,
}: SendEmailParams) {
  const transporter = nodemailer.createTransport({
    host: sender.smtp_host,
    port: sender.smtp_port,
    auth: {
      user: sender.smtp_user,
      pass: sender.smtp_pass,
    },
  });

  const info = await transporter.sendMail({
    from: sender.smtp_user,
    to,
    subject,
    text: body,
  });

  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info),
  };
}