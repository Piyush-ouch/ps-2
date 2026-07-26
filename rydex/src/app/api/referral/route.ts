import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Referral from "@/models/referral.model";
import { ensureUserReferralCode } from "@/lib/referral";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Ensure user has a referral code generated
    const referralCode = await ensureUserReferralCode(user);

    // Fetch referral history
    const history = await Referral.find({ referrerId: user._id })
      .populate("referredUserId", "name email createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const formattedHistory = history.map((item: any) => ({
      id: item._id,
      referredUser: item.referredUserId
        ? {
            name: item.referredUserId.name,
            emailMasked: item.referredUserId.email
              ? item.referredUserId.email.replace(/(.{2})(.*)(?=@)/, "$1***")
              : "User",
          }
        : { name: "Referred Friend", emailMasked: "***" },
      referrerBonus: item.referrerBonus,
      status: item.status,
      createdAt: item.createdAt,
    }));

    const origin = req.headers.get("origin") || req.nextUrl.origin || "http://localhost:3000";
    const shareableUrl = `${origin}/referral?code=${referralCode}`;

    return NextResponse.json(
      {
        referralCode,
        shareableUrl,
        referralCredits: user.referralCredits || 0,
        referralCount: user.referralCount || 0,
        totalReferralEarnings: user.totalReferralEarnings || 0,
        hasBeenReferred: !!user.referredBy,
        history: formattedHistory,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET REFERRAL DATA ERROR:", error);
    return NextResponse.json(
      { message: "Failed to retrieve referral data" },
      { status: 500 }
    );
  }
}
