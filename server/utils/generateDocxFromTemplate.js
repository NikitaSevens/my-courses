import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateDocxFromTemplate(data, outputPath) {
  // Выбор шаблона по возрасту
  let templateFile = "";

  if (data.age < 14) {
    templateFile = "child-under-14.docx";
  } else if (data.age < 18) {
    templateFile = "child-under-18.docx";
  } else {
    templateFile = "grown-human.docx";
  }

  // Normalize fields so all template vars are always defined
  const templateData = {
    ...data,
    courseName: data.courseName || data.course || "",
    startDate: data.startDate || "",
    endDate: data.endDate || "",
    duration: data.duration || "",
    courseFormat: data.courseFormat || "",
    customAddress: data.customAddress || data.adress || data.passportAddress || "",
    adress: data.adress || data.customAddress || data.passportAddress || "",
  };

  const templatePath = path.join(__dirname, "../templates", templateFile);
  const content = fs.readFileSync(templatePath); // Buffer — сохраняет UTF-8 корректно
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: {
      start: "{{",
      end: "}}",
    },
  });

  try {
    doc.render(templateData);
  } catch (error) {
    console.error("Ошибка генерации DOCX:", error);
    throw error;
  }

  const buffer = doc.getZip().generate({ type: "nodebuffer" });

  // Создаем папку output, если ее нет
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, buffer);
}
