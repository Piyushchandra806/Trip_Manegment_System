import { connectToDatabase } from "./mongodb";

export async function logActivity(action, details, adminId = "SYSTEM") {
  try {
    const { db } = await connectToDatabase();
    await db.collection("activityLogs").insertOne({
      action,
      details,
      adminId,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getRecentActivity(limit = 10, adminId = null) {
  try {
    const { db } = await connectToDatabase();
    const query = adminId ? { adminId } : {};
    return await db.collection("activityLogs")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    return [];
  }
}
