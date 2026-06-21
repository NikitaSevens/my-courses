import prisma from '../server/prisma.js'

const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } })
console.log('Пользователи:', JSON.stringify(users, null, 2))

const email = process.argv[2]
if (!email) {
  console.log('\nУкажи email: node scripts/make-superadmin.js your@email.com')
  await prisma.$disconnect()
  process.exit(0)
}

const updated = await prisma.user.update({
  where: { email },
  data: { role: 'SUPERADMIN' },
  select: { id: true, email: true, role: true },
})
console.log('\nОбновлено:', updated)
await prisma.$disconnect()
