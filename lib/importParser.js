import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Make sure pdfjs worker is set up
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const FIELD_MAPPINGS = {
  aadhaarNumber: /aadhaar|aadhar|uid/i,
  name: /name|traveller|traveler|member|passenger/i,
  mobile: /mobile|phone|contact|ph/i,
  family: /family|group/i,
  coach: /coach|compartment/i,
  berth: /berth|seat/i,
  berthType: /berth\s*type|seat\s*type/i,
  hotel: /hotel|property|accommodation/i,
  room: /room/i,
  floor: /floor/i,
  day: /day/i
};

export function mapColumns(headers) {
  const mapped = {};
  for (const h of headers) {
    if (!h) continue;
    let found = false;
    for (const [key, regex] of Object.entries(FIELD_MAPPINGS)) {
      if (regex.test(h)) {
        mapped[h] = key;
        found = true;
        break;
      }
    }
    if (!found) mapped[h] = null; // unmapped
  }
  return mapped;
}

export async function parseSpreadsheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (json.length < 2) return resolve({ records: [], confidence: 100 });
        
        const headers = json[0];
        const mapping = mapColumns(headers);
        const records = [];
        
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.length === 0) continue;
          
          const record = { _confidence: 100, _warnings: {} }; // 100% confidence for digital text
          let hasData = false;
          headers.forEach((h, idx) => {
            if (mapping[h] && row[idx] !== undefined) {
              record[mapping[h]] = String(row[idx]).trim();
              hasData = true;
            }
          });
          if (hasData) records.push(record);
        }
        resolve({ records, confidence: 100 });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export async function parseImage(file, onProgress) {
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    }
  });
  
  const { data: { text, lines } } = await worker.recognize(file);
  await worker.terminate();
  
  // OCR output is usually raw text. Let's try to extract rows based on lines.
  const records = [];
  let avgConfidence = 0;
  let confCount = 0;

  for (const line of lines) {
    // If confidence is too low overall for a line, maybe it's noise
    if (line.confidence < 40) continue;
    
    // Very basic heuristic for a row: look for mobile numbers to anchor the row
    const mobileMatch = line.text.match(/(?:[^\d]|^)(\d{10})(?:[^\d]|$)/);
    if (mobileMatch) {
      const mobile = mobileMatch[1];
      
      // Calculate confidence of just the mobile word
      const mobileWord = line.words.find(w => w.text.includes(mobile));
      const mobileConf = mobileWord ? mobileWord.confidence : line.confidence;
      
      avgConfidence += line.confidence;
      confCount++;
      
      const record = { 
        mobile, 
        _confidence: line.confidence, 
        _warnings: {} 
      };
      
      if (mobileConf < 85) {
        record._warnings.mobile = true;
      }

      
      // Try to find Aadhaar (12 digits, maybe with spaces)
      const aadhaarMatch = line.text.match(/\b(\d{4}\s*\d{4}\s*\d{4})\b/);
      if (aadhaarMatch && !aadhaarMatch[1].replace(/\s+/g, '').includes(mobile)) {
        record.aadhaarNumber = aadhaarMatch[1].replace(/\s+/g, '');
      }

      // Try to find Name (words before mobile)
      const textBeforeMobile = line.text.substring(0, line.text.indexOf(mobile)).trim();
      if (textBeforeMobile.length > 2) {
        // Strip non letters
        record.name = textBeforeMobile.replace(/[^a-zA-Z\s]/g, '').trim();
      }

      // Try to find Coach (S1-12, B1-10, A1-5)
      const coachMatch = line.text.match(/\b([SBA]\d{1,2})\b/i);
      if (coachMatch) {
        record.coach = coachMatch[1].toUpperCase();
      }

      // Try to find Berth (1-80)
      const berthMatch = line.text.match(/\b([1-8][0-9]?)\b/);
      if (berthMatch && berthMatch[1] !== mobile) { // Ensure it's not part of mobile
        record.berth = berthMatch[1];
      }

      records.push(record);
    }
  }

  const finalConf = confCount > 0 ? avgConfidence / confCount : 0;
  return { records, confidence: finalConf };
}

export async function parsePDF(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  
  const allRecords = [];
  let isScanned = true;

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(i / numPages);
    
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map(item => item.str);
    const text = strings.join(' ');
    
    // If the page has significant text, it's digital
    if (text.length > 50) {
      isScanned = false;
      // Heuristic extraction for digital PDF text
      const words = strings.filter(s => s.trim().length > 0);
      
      // Look for mobile numbers and reconstruct rows
      for (let w = 0; w < words.length; w++) {
        if (words[w].match(/^\d{10}$/)) {
          const mobile = words[w];
          const record = { mobile, _confidence: 100, _warnings: {} };
          
          // Heuristics: Previous 2 words might be name
          if (w >= 2) {
            record.name = `${words[w-2]} ${words[w-1]}`.replace(/[^a-zA-Z\s]/g, '').trim();
          }
          
          
          // Next 5 words might have coach/berth/aadhaar
          for (let x = 1; x <= 5 && w + x < words.length; x++) {
            if (words[w+x].match(/^[SBA]\d{1,2}$/i)) record.coach = words[w+x].toUpperCase();
            if (words[w+x].match(/^[1-8][0-9]?$/)) record.berth = words[w+x];
            // If we see 12 digits, it's aadhaar
            if (words[w+x].match(/^\d{12}$/)) record.aadhaarNumber = words[w+x];
          }
          
          allRecords.push(record);
        }
      }
    } else {
      // Scanned page. Render to canvas and OCR
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: ctx, viewport }).promise;
      
      // Convert canvas to blob and run OCR
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
      const res = await parseImage(blob, () => {}); // ignoring inner progress for simplicity
      allRecords.push(...res.records);
    }
  }

  return { records: allRecords, confidence: isScanned ? 85 : 100 };
}

export async function parseFile(file, onProgress) {
  const type = file.type;
  const name = file.name.toLowerCase();
  
  if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return await parseSpreadsheet(file);
  } else if (name.endsWith('.pdf')) {
    return await parsePDF(file, onProgress);
  } else if (type.startsWith('image/')) {
    return await parseImage(file, onProgress);
  } else {
    throw new Error('Unsupported file format');
  }
}
