const hindiToEngConsonants = {
  'क': 'k', 'ख': 'k', 'ग': 'g', 'घ': 'g', 'ङ': 'n',
  'च': 'c', 'छ': 'c', 'ज': 'j', 'झ': 'j', 'ञ': 'n',
  'ट': 't', 'ठ': 't', 'ड': 'd', 'ढ': 'd', 'ण': 'n',
  'त': 't', 'थ': 't', 'द': 'd', 'ध': 'd', 'न': 'n',
  'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'b', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 's', 'ष': 's', 'स': 's', 'ह': 'h',
  'क्ष': 'ks', 'त्र': 'tr', 'ज्ञ': 'gy',
  'क़': 'q', 'ख़': 'k', 'ग़': 'g', 'ज़': 'z', 'ड़': 'd', 'ढ़': 'd', 'फ़': 'f'
};

function getPhoneticSkeleton(str) {
  if (!str) return '';
  str = str.toLowerCase().trim();
  
  // If English, strip vowels and non-alphabets
  let isEnglish = /^[a-z\s]+$/.test(str);
  if (isEnglish) {
    str = str.replace(/[aeiou\s]/g, '');
    str = str.replace(/kh|gh|ch|jh|th|dh|ph|bh/g, match => match[0]); 
    str = str.replace(/sh/g, 's');
    str = str.replace(/w/g, 'v');
    str = str.replace(/z/g, 'j');
    str = str.replace(/c/g, 'k'); 
    return str;
  }
  
  // If Hindi, extract consonants and map to english
  let skeleton = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (hindiToEngConsonants[char]) {
      skeleton += hindiToEngConsonants[char];
    }
  }
  return skeleton;
}

/**
 * Clean up a name for basic comparison (remove extra spaces)
 */
function normalizeString(str) {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Evaluates if the input name matches the database name.
 * 1. Exact or lowercase match
 * 2. First-name exact match
 * 3. Phonetic match
 */
export function isNameMatch(inputName, dbName) {
  if (!inputName || !dbName) return false;

  const normInput = normalizeString(inputName);
  const normDb = normalizeString(dbName);

  // 1. Exact match
  if (normInput === normDb) return true;

  // 2. First-name exact match
  const inputFirst = normInput.split(' ')[0];
  const dbFirst = normDb.split(' ')[0];
  if (inputFirst === dbFirst) return true;

  // 3. Phonetic match (Fallback for Hindi/English differences)
  const inputPhonetic = getPhoneticSkeleton(normInput);
  const dbPhonetic = getPhoneticSkeleton(normDb);
  
  if (!inputPhonetic || !dbPhonetic) return false;
  
  // Check full phonetic match
  if (inputPhonetic === dbPhonetic) return true;

  // Check first-name phonetic match
  const inputFirstPhonetic = getPhoneticSkeleton(inputFirst);
  const dbFirstPhonetic = getPhoneticSkeleton(dbFirst);
  
  if (inputFirstPhonetic && dbFirstPhonetic && inputFirstPhonetic === dbFirstPhonetic) {
    return true;
  }

  return false;
}
