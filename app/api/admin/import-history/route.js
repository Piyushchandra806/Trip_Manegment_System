import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    
    // Sort by timestamp descending, limit to 10
    const history = await db.collection("importHistory")
      .find({ adminId: admin.adminId })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json(history);
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
