import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json();
    const { referralCode } = body;

    if (!referralCode || typeof referralCode !== "string") {
      return NextResponse.json(
        { valid: false, message: "Referral code is required" },
        { status: 400 }
      );
    }

    const cleanCode = referralCode.trim().toUpperCase();
    const referrer = await User.findOne({ referralCode: cleanCode }).select("name referralCode");

    if (!referrer) {
      return NextResponse.json(
        { valid: false, message: "Invalid referral code" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        referrerName: referrer.name,
        referralCode: referrer.referralCode,
        message: `Valid code from ${referrer.name}! You both get credit bonuses.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("VALIDATE REFERRAL CODE ERROR:", error);
    return NextResponse.json(
      { valid: false, message: "Failed to validate code" },
      { status: 500 }
    );
  }
}
