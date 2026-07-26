import User, { IUser } from "@/models/user.model";
import Referral from "@/models/referral.model";
import crypto from "crypto";

export const REFERRER_BONUS = 200; // ₹200 default bonus for referrer
export const REFEREE_BONUS = 100;  // ₹100 default discount bonus for referee on next ride

/**
 * Generate a unique upper-case alphanumeric referral code.
 */
export function generateReferralCode(name?: string): string {
  const cleanName = (name || "RYDEX")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 4);
  const prefix = cleanName.length >= 3 ? cleanName : "RYD";
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${randomHex}`;
}

/**
 * Ensures that a user object has a unique referral code.
 */
export async function ensureUserReferralCode(user: IUser): Promise<string> {
  if (user.referralCode) {
    return user.referralCode;
  }

  let unique = false;
  let code = "";
  let attempts = 0;

  while (!unique && attempts < 10) {
    attempts++;
    code = generateReferralCode(user.name);
    const existing = await User.findOne({ referralCode: code });
    if (!existing) {
      unique = true;
    }
  }

  if (!unique) {
    code = `RYDEX-${Date.now().toString(36).toUpperCase()}`;
  }

  user.referralCode = code;
  await user.save();
  return code;
}

export interface ProcessReferralResult {
  success: boolean;
  message: string;
  referrerName?: string;
  referrerBonus?: number;
  refereeBonus?: number;
}

/**
 * Process a referral code for a new user, applying credit bonuses to both parties.
 */
export async function processReferralBonus({
  newUserId,
  referralCodeStr,
  referrerBonusAmount = REFERRER_BONUS,
  refereeBonusAmount = REFEREE_BONUS,
}: {
  newUserId: string;
  referralCodeStr: string;
  referrerBonusAmount?: number;
  refereeBonusAmount?: number;
}): Promise<ProcessReferralResult> {
  try {
    const formattedCode = referralCodeStr.trim().toUpperCase();
    if (!formattedCode) {
      return { success: false, message: "Invalid referral code" };
    }

    // Find referee user
    const referee = await User.findById(newUserId);
    if (!referee) {
      return { success: false, message: "User not found" };
    }

    if (referee.referredBy) {
      return { success: false, message: "User has already used a referral code" };
    }

    // Find referrer user
    const referrer = await User.findOne({ referralCode: formattedCode });
    if (!referrer) {
      return { success: false, message: "Referral code not found" };
    }

    // Prevent self-referral
    if (referrer._id.toString() === referee._id.toString()) {
      return { success: false, message: "You cannot use your own referral code" };
    }

    // Check if referral transaction already exists
    const existingReferral = await Referral.findOne({
      referredUserId: referee._id,
    });
    if (existingReferral) {
      return { success: false, message: "Referral already processed for this user" };
    }

    // Apply bonuses atomically
    referrer.referralCredits = (referrer.referralCredits || 0) + referrerBonusAmount;
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    referrer.totalReferralEarnings = (referrer.totalReferralEarnings || 0) + referrerBonusAmount;
    await referrer.save();

    referee.referredBy = referrer._id;
    referee.referralCredits = (referee.referralCredits || 0) + refereeBonusAmount;
    referee.pendingReferralCode = undefined;
    await referee.save();

    // Log transaction record
    await Referral.create({
      referrerId: referrer._id,
      referredUserId: referee._id,
      referralCode: formattedCode,
      referrerBonus: referrerBonusAmount,
      referredBonus: refereeBonusAmount,
      status: "completed",
    });

    return {
      success: true,
      message: `Referral bonus applied successfully! ₹${referrerBonusAmount} credits awarded to ${referrer.name} and ₹${refereeBonusAmount} off credited for your next ride.`,
      referrerName: referrer.name,
      referrerBonus: referrerBonusAmount,
      refereeBonus: refereeBonusAmount,
    };
  } catch (error: any) {
    console.error("PROCESS REFERRAL ERROR:", error);
    return {
      success: false,
      message: error.message || "Failed to process referral code",
    };
  }
}
