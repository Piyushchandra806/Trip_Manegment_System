export function generateId(prefix, records, idField) {
  let maxId = 0;
  for (const record of records) {
    const idStr = record[idField];
    if (idStr && idStr.startsWith(prefix)) {
      const num = parseInt(idStr.substring(prefix.length), 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    }
  }
  const nextId = maxId + 1;
  return `${prefix}${nextId.toString().padStart(6, '0')}`;
}
