import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'My-Course <onboarding@resend.dev>'
const CLIENT_URL = process.env.CLIENT_URL || 'https://my-courses-production.up.railway.app'

export async function sendVerificationEmail(to, token) {
  const link = `${CLIENT_URL}/verify-email?token=${token}`

  await resend.emails.send({
    from: FROM,
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
  const link = `${CLIENT_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: FROM,
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
  const { createReadStream } = await import('fs')
  const { basename } = await import('path')

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Заявка на курс: ${courseName}`,
    html: `<p>Во вложении заявка на курс <strong>${courseName}</strong>. Распечатайте, проверьте данные и подпишите.</p>`,
    attachments: [{
      filename: basename(attachmentPath),
      content: createReadStream(attachmentPath),
    }],
  })
}
