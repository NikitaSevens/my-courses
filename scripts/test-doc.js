import http from 'http'

const data = JSON.stringify({
  name: 'Резанов Никита Александрович',
  age: 25,
  course: 'Python для начинающих',
  birthDate: '2000-01-01',
  phone: '79001234567',
  email: 'test@test.com',
  snils: '12345678901',
  fundingType: 'budget',
  placeOfStudy: 'СГТУ',
  documentType: 'passport',
  docSeries: '6312',
  docNumber: '567890',
  docDate: '2018-06-01',
  docIssuedBy: 'ГУ МВД России по Саратовской области',
  passportAddress: 'г. Саратов, ул. Огородная, д. 211, кв. 3',
  adress: 'г. Саратов, ул. Огородная, д. 211, кв. 3',
})

const req = http.request({
  hostname: 'localhost', port: 5000, path: '/documents/send',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
}, res => {
  let body = ''
  res.on('data', c => body += c)
  res.on('end', () => console.log('Response:', body))
})
req.on('error', e => console.error('Error:', e.message))
req.write(data)
req.end()
