/** One-page receipt PDF. Uses only the standard PDF fonts so the browser can download it directly. */
export function buildReceiptPdf(receipt) {
  const lines = [
    ['Receipt number', receipt.receiptNumber],
    ['Transaction ID', receipt.id],
    ['Status', receipt.status],
    ['Customer', `${receipt.customerName} (${receipt.customerId})`],
    ['Phone', receipt.customerPhone || '—'],
    ['Loan', receipt.loanId],
    ['Amount received', receipt.amountLabel],
    ['Payment method', receipt.method],
    ['Reference', receipt.reference || '—'],
    ['Date and time', receipt.when],
    ['Previous outstanding', receipt.previousLabel],
    ['Remaining outstanding', receipt.remainingLabel],
    ['Unallocated credit', receipt.unallocatedLabel],
    ['Collector', receipt.collectorName],
    ['Allocated to', receipt.allocationText],
  ]
  if (receipt.brandDetail) lines.unshift(['Business', receipt.brandDetail])

  const commands = [
    '0.047 0.137 0.255 rg',
    '36 760 523 52 re f',
    '0.369 0.918 0.831 rg',
    '52 788 18 8 re f',
    '1 1 1 rg',
    '52 776 12 6 re f',
    '0.600 0.965 0.894 rg',
    '52 766 18 6 re f',
    `BT /F2 18 Tf 84 786 Td (${escapePdf(receipt.brandName || 'SAAJ')}) Tj ET`,
    'BT /F1 10 Tf 84 770 Td (Payment receipt) Tj ET',
    '0.059 0.090 0.145 rg',
  ]

  let y = 728
  for (const [label, value] of lines) {
    commands.push(`BT /F2 10 Tf 48 ${y} Td (${escapePdf(label)}) Tj ET`)
    commands.push(`BT /F1 11 Tf 210 ${y} Td (${escapePdf(value)}) Tj ET`)
    y -= 22
  }

  commands.push('0.392 0.455 0.545 rg')
  commands.push(
    `BT /F1 9 Tf 48 ${y - 8} Td (${escapePdf('Development receipt. Stored in this browser, separate from the repayment schedule.')}) Tj ET`,
  )

  return assemblePdf(commands.join('\n'))
}

function assemblePdf(stream) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>',
    `<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]

  let body = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(byteLength(body))
    body += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefAt = byteLength(body)
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let index = 1; index < offsets.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  body += `${xref}trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`
  return new TextEncoder().encode(body)
}

function escapePdf(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function byteLength(value) {
  return new TextEncoder().encode(value).length
}
