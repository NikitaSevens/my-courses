// Script to add template variables to DOCX templates for course data
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templates = ['grown-human.docx', 'child-under-14.docx', 'child-under-18.docx'];

// Inject a text run into the first empty <w:p> inside a <w:tc> cell
function injectIntoCell(cellXml, varName) {
  // Find the first <w:p>...</w:p> that has no <w:r> (i.e. no text run)
  // We insert a run with the template variable into it
  const emptyPRe = /(<w:p>)(<w:pPr>[\s\S]*?<\/w:pPr>)(<\/w:p>)/;
  const match = cellXml.match(emptyPRe);
  if (match) {
    const run = `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" /><w:color w:val="auto" /><w:spacing w:val="0" /><w:position w:val="0" /><w:sz w:val="18" /><w:shd w:fill="auto" w:val="clear" /></w:rPr><w:t xml:space="preserve">${varName}</w:t></w:r>`;
    return cellXml.replace(emptyPRe, `$1$2${run}$3`);
  }
  // If no empty <w:p> found, try replacing spaces-only content
  return cellXml.replace(
    /(<w:t xml:space="preserve">)\s+(<\/w:t>)/,
    `$1${varName}$2`
  );
}

// Process a data row: inject vars into cells 2-7 (cell 1 is row number "1")
function patchDataRow(rowXml, vars) {
  // Split by </w:tc> to get individual cells
  const parts = rowXml.split('</w:tc>');
  // parts[0] = cell 1 (row number), parts[1..n-2] = data cells, parts[n-1] = closing row tag
  if (parts.length < 3) return rowXml;

  const patchedParts = [parts[0]]; // keep cell 1 (row number) unchanged

  for (let i = 1; i < parts.length - 1; i++) {
    const varName = vars[i - 1];
    if (varName) {
      patchedParts.push(injectIntoCell(parts[i], varName));
    } else {
      patchedParts.push(parts[i]);
    }
  }
  patchedParts.push(parts[parts.length - 1]); // closing tag

  return patchedParts.join('</w:tc>');
}

// Cell vars order: [courseName, startDate, endDate, duration, courseFormat, courseTerm]
const cellVars = ['{{courseName}}', '{{startDate}}', '{{endDate}}', '{{duration}}', '{{courseFormat}}', null];

for (const template of templates) {
  const templatePath = path.join(__dirname, '../server/templates', template);
  const content = fs.readFileSync(templatePath);
  const zip = new PizZip(content);

  let xml = zip.files['word/document.xml'].asText();

  // --- TEXT REPLACEMENTS ---
  // IMPORTANT: order matters — replace the date blank BEFORE the course name blank,
  // because both use «___» pattern and the date one is more specific.

  // 1. Start date blank: «______» ________________20
  //    Replace only the date run (without the leading «по курсу:»).
  xml = xml.replace(
    /«______» _{3,}20(\s*)/g,
    '{{startDate}} '
  );

  // 2. Course name blank in application text (long underscores inside «»)
  xml = xml.replace(
    /«_{10,}»/g,
    '«{{courseName}}»'
  );

  // 3. Duration blank: "в объёме _____ часов" — remove static "часов" since {{duration}} may already contain it
  xml = xml.replace(
    /в объёме _+ часов/g,
    'в объёме {{duration}}'
  );

  // --- TABLE CELL REPLACEMENTS ---
  // Both tables (Заявление + Договор) have same structure.
  // Find each <w:tbl> and patch the data row (row with just "1").
  const tables = [];
  let pos = 0;
  while (true) {
    const start = xml.indexOf('<w:tbl>', pos);
    if (start === -1) break;
    const end = xml.indexOf('</w:tbl>', start) + 8;
    tables.push({ start, end });
    pos = end;
  }

  console.log(`${template}: found ${tables.length} tables`);

  // Process tables in reverse order to keep positions valid
  for (const { start, end } of [...tables].reverse()) {
    const tableXml = xml.substring(start, end);

    // Find rows
    const rowMatches = [...tableXml.matchAll(/<w:tr>[\s\S]*?<\/w:tr>|<w:tr [\s\S]*?<\/w:tr>/g)];
    if (rowMatches.length === 0) continue;

    // The data row is the last row that contains ">1<" in cell 1
    let dataRowMatch = null;
    for (const m of rowMatches) {
      const rowText = m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      // Data row starts with "1" (the row number) and cells are mostly empty
      if (/^1\s*$/.test(rowText) || rowText.startsWith('1 ') && rowText.length < 20) {
        dataRowMatch = m;
      }
    }

    if (!dataRowMatch) {
      console.log(`  Table at ${start}: data row not found`);
      continue;
    }

    const originalRow = dataRowMatch[0];
    const patchedRow = patchDataRow(originalRow, cellVars);

    if (originalRow === patchedRow) {
      console.log(`  Table at ${start}: no changes to data row`);
      continue;
    }

    // Replace in the full xml
    xml = xml.substring(0, start) +
      tableXml.replace(originalRow, patchedRow) +
      xml.substring(end);

    console.log(`  Table at ${start}: data row patched`);
  }

  // Save the patched file
  zip.file('word/document.xml', xml);
  const output = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, output);
  console.log(`✓ Saved ${template}\n`);
}

console.log('Done! All templates patched.');
