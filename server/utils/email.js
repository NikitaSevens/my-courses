import nodemailer from 'nodemailer'
import { lookup } from 'dns'
import { promisify } from 'util'

const lookupAsync = promisify(lookup)

async function createTransporter() {
  const smtpHost = await lookupAsync('smtp.gmail.com').then(r => r.address).catch(() => 'smtp.gmail.com')
  return nodemailer.createTransport({
    host: smtpHost,
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS?.replace(/\s/g, ''),
    },
    tls: {
      rejectUnauthorized: false,
      servername: 'smtp.gmail.com',
    },
  })
}

const transporter = await createTransporter()

export async function sendVerificationEmail(to, token) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  const link = `${clientUrl}/verify-email?token=${token}`

  await transporter.sendMail({
    from: `"My-Course" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Подтвердите ваш email — My-Course',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Подтверждение email</h2>
        <p>Для завершения регистрации перейдите по ссылке:</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2B5CE6;color:#fff;border-radius:8px;text-decoration:none;">
          Подтвердить email
        </a>
        <p style="color:#888;margin-top:24px;font-size:13px;">Ссылка действительна 24 часа. Если вы не регистрировались — проигнорируйте письмо.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(to, token) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  const link = `${clientUrl}/reset-password?token=${token}`

  await transporter.sendMail({
    from: `"My-Course" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Сброс пароля — My-Course',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Сброс пароля</h2>
        <p>Для сброса пароля перейдите по ссылке:</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2B5CE6;color:#fff;border-radius:8px;text-decoration:none;">
          Сбросить пароль
        </a>
        <p style="color:#888;margin-top:24px;font-size:13px;">Ссылка действительна 1 час. Если вы не запрашивали сброс — проигнорируйте письмо.</p>
      </div>
    `,
  })
}

export async function sendDocumentEmail(to, attachmentPath, courseName) {
  await transporter.sendMail({
    from: `"My-Course" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Заявка на курс: ${courseName}`,
    html: `<p>Во вложении заявка на курс <strong>${courseName}</strong>. Распечатайте, проверьте данные и подпишите.</p>`,
    attachments: [{ filename: 'zayavka.docx', path: attachmentPath }],
  })
}
