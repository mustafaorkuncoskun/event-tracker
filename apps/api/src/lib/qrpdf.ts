import QRCode from 'qrcode'
import PDFDocument from 'pdfkit'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FONT_REGULAR = join(__dirname, '../assets/fonts/Roboto-Regular.ttf')
const FONT_BOLD = join(__dirname, '../assets/fonts/Roboto-Bold.ttf')
interface Employee { name: string }
interface InvitationWithEmployee { code: string; token: string; employee: Employee }

export async function generateInvitationPDF(
  invitation: InvitationWithEmployee,
  eventTitle: string,
  eventDate: Date,
  eventLocation: string | null
): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(invitation.token, { width: 200, margin: 2 })
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64')

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.registerFont('RobotoRegular', FONT_REGULAR)
    doc.registerFont('RobotoBold', FONT_BOLD)

    doc.fontSize(22).font('RobotoBold').text('ETKİNLİK DAVETI', { align: 'center' })
    doc.moveDown()

    doc.fontSize(16).font('RobotoRegular').text(`Merhaba ${invitation.employee.name},`, { align: 'left' })
    doc.moveDown(0.5)
    doc.fontSize(13).text(`${eventTitle} etkinliğine davetlisiniz.`)
    doc.moveDown(0.5)
    doc.fontSize(12).text(`Tarih: ${eventDate.toLocaleDateString('tr-TR', { dateStyle: 'full' })}`)
    if (eventLocation) doc.text(`Konum: ${eventLocation}`)
    doc.moveDown(1.5)

    doc.fontSize(14).font('RobotoBold').text('Giriş QR Kodunuz', { align: 'center' })
    doc.moveDown(0.5)

    const qrX = (doc.page.width - 180) / 2
    doc.image(qrBuffer, qrX, doc.y, { width: 180, height: 180 })
    doc.moveDown(10)

    doc.fontSize(12).font('RobotoRegular').text('veya 9 haneli kodunuz:', { align: 'center' })
    doc.moveDown(0.3)
    doc.fontSize(28).font('RobotoBold').text(
      invitation.code.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3'),
      { align: 'center', characterSpacing: 4 }
    )

    doc.moveDown(2)
    doc.fontSize(10).font('RobotoRegular').fillColor('#888888')
      .text('Bu davet kişiseldir, başkasıyla paylaşmayınız.', { align: 'center' })

    doc.end()
  })
}
