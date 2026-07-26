import mongoose, { Schema, Document } from "mongoose";

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  referralCode: string;
  referrerBonus: number;
  referredBonus: number;
  status: "completed" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    referrerBonus: {
      type: Number,
      default: 200,
    },
    referredBonus: {
      type: Number,
      default: 100,
    },
    status: {
      type: String,
      enum: ["completed", "pending"],
      default: "completed",
    },
  },
  { timestamps: true }
);

ReferralSchema.index({ referrerId: 1, referredUserId: 1 }, { unique: true });

const Referral =
  mongoose.models.Referral || mongoose.model<IReferral>("Referral", ReferralSchema);

export default Referral;
