import { NextResponse } from "next/server";
import { getRecentActivity } from "@/lib/activity";
import { getLoggedInAdmin } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    const admin = await getLoggedInAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const activities = await getRecentActivity(20, admin.adminId);
    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
