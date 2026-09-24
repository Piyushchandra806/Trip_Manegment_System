export const cache = {
  trains: { map: null, expiresAt: 0 },
  hotels: { map: null, expiresAt: 0 },
  rooms: { map: null, expiresAt: 0 },
};

const TTL_MS = 60 * 1000; // 60 seconds

const ID_KEYS = {
  trains: 'trainId',
  hotels: 'hotelId',
  rooms: 'roomId'
};

export async function getCachedMap(db, collectionName) {
  const now = Date.now();
  
  if (cache[collectionName] && cache[collectionName].expiresAt > now && cache[collectionName].map) {
    return cache[collectionName].map;
  }

  try {
    const arr = await db.collection(collectionName).find({}).maxTimeMS(10000).toArray();
    const map = arr.reduce((acc, item) => {
      acc[item[ID_KEYS[collectionName]]] = item;
      return acc;
    }, {});
    
    if (cache[collectionName]) {
      cache[collectionName].map = map;
      cache[collectionName].expiresAt = now + TTL_MS;
    }
    return map;
  } catch (err) {
    // Failure safety: If MongoDB fails, try to return stale cache if we have it
    if (cache[collectionName] && cache[collectionName].map) {
      console.warn(`[Cache] Failed to refresh ${collectionName}, serving stale data`, err);
      return cache[collectionName].map;
    }
    throw err;
  }
}

export function invalidateCache(collectionName) {
  if (cache[collectionName]) {
    cache[collectionName].expiresAt = 0;
  }
}

export async function getCachedArray(db, collectionName) {
  const map = await getCachedMap(db, collectionName);
  return Object.values(map);
}
