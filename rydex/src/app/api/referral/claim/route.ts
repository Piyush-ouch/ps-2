import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { processReferralBonus } from "@/lib/referral";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in to claim a referral code." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { referralCode } = body;

    if (!referralCode || typeof referralCode !== "string") {
      return NextResponse.json(
        { message: "Referral code is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.referredBy) {
      return NextResponse.json(
        { message: "You have already claimed a referral bonus." },
        { status: 400 }
      );
    }

    const result = await processReferralBonus({
      newUserId: user._id.toString(),
      referralCodeStr: referralCode,
    });

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: result.message,
        referrerName: result.referrerName,
        refereeBonus: result.refereeBonus,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("CLAIM REFERRAL ERROR:", error);
    return NextResponse.json(
      { message: "Failed to claim referral bonus" },
      { status: 500 }
    );
  }
}
