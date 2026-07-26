import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDb();

    // Query top 15 users with highest referralCount and totalReferralEarnings > 0
    const topReferrers = await User.find({
      referralCount: { $gt: 0 },
    })
      .select("name email role referralCount totalReferralEarnings createdAt")
      .sort({ referralCount: -1, totalReferralEarnings: -1 })
      .limit(15)
      .lean();

    const leaderboard = topReferrers.map((user: any, index: number) => {
      const emailStr = user.email || "";
      const emailParts = emailStr.split("@");
      const maskedEmail =
        emailParts.length === 2
          ? `${emailParts[0].slice(0, 2)}***@${emailParts[1]}`
          : "User***";

      return {
        rank: index + 1,
        id: user._id.toString(),
        name: user.name,
        maskedEmail,
        role: user.role,
        referralCount: user.referralCount || 0,
        totalReferralEarnings: user.totalReferralEarnings || 0,
        joinedAt: user.createdAt,
      };
    });

    return NextResponse.json(
      {
        leaderboard,
        totalActiveReferrers: leaderboard.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET LEADERBOARD ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch referral leaderboard" },
      { status: 500 }
    );
  }
}
