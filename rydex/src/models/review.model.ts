import mongoose, { Schema, Document, Types } from "mongoose";

export type ReviewerRole = "user" | "vendor";

export interface IReview extends Document {
  booking: Types.ObjectId;
  reviewer: Types.ObjectId;
  reviewee: Types.ObjectId;
  reviewerRole: ReviewerRole;
  rating: number;
  feedbackTags: string[];
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewerRole: {
      type: String,
      enum: ["user", "vendor"],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedbackTags: {
      type: [String],
      default: [],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Compound index to ensure a reviewer can rate a booking only once
ReviewSchema.index({ booking: 1, reviewer: 1 }, { unique: true });

const Review =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
