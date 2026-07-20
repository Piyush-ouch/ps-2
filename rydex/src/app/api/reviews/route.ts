import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Review from "@/models/review.model";

export async function POST(req: Request) {
  try {
    await connectDb();

    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const reviewerId = session.user.id;
    const { bookingId, rating, feedbackTags = [], comment = "" } = await req.json();

    if (!bookingId || !rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Invalid payload. Rating must be a number between 1 and 5." },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "completed") {
      return NextResponse.json(
        { message: "Only completed rides can be rated and reviewed." },
        { status: 400 }
      );
    }

    let reviewerRole: "user" | "vendor";
    let revieweeId: string;

    const isRider = booking.user.toString() === reviewerId;
    const isDriver = booking.driver.toString() === reviewerId;

    if (isRider) {
      reviewerRole = "user";
      revieweeId = booking.driver.toString();
      if (booking.userRated) {
        return NextResponse.json(
          { message: "You have already rated this ride." },
          { status: 400 }
        );
      }
    } else if (isDriver) {
      reviewerRole = "vendor";
      revieweeId = booking.user.toString();
      if (booking.driverRated) {
        return NextResponse.json(
          { message: "You have already rated this ride." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { message: "Forbidden. You were not a participant in this ride." },
        { status: 403 }
      );
    }

    // Double check if review record already exists in database
    const existingReview = await Review.findOne({
      booking: bookingId,
      reviewer: reviewerId,
    });

    if (existingReview) {
      return NextResponse.json(
        { message: "You have already submitted a rating for this ride." },
        { status: 400 }
      );
    }

    // 1. Create Review
    const review = await Review.create({
      booking: bookingId,
      reviewer: reviewerId,
      reviewee: revieweeId,
      reviewerRole,
      rating,
      feedbackTags: Array.isArray(feedbackTags) ? feedbackTags : [],
      comment: typeof comment === "string" ? comment.slice(0, 500) : "",
    });

    // 2. Mark Booking flag
    if (isRider) {
      booking.userRated = true;
    } else {
      booking.driverRated = true;
    }
    await booking.save();

    // 3. Update Reviewee Reputation & Booking Eligibility
    const reviewee = await User.findById(revieweeId);
    let newAverageRating = 5.0;

    if (reviewee) {
      const currentTotal = reviewee.totalRatings || 0;
      const currentSum = reviewee.ratingSum || (currentTotal * (reviewee.averageRating || 5.0));

      const newTotal = currentTotal + 1;
      const newSum = currentSum + rating;
      const rawAverage = newSum / newTotal;
      newAverageRating = Number((Math.round(rawAverage * 10) / 10).toFixed(1));

      reviewee.totalRatings = newTotal;
      reviewee.ratingSum = newSum;
      reviewee.averageRating = newAverageRating;

      // Trust & Safety Rule: if average rating drops below 2.0 with at least 3 ratings, mark account blocked for rating eligibility
      if (newAverageRating < 2.0 && newTotal >= 3) {
        reviewee.isRatingBlocked = true;
      }

      await reviewee.save();
    }

    return NextResponse.json({
      success: true,
      message: "Rating and review submitted successfully.",
      review,
      updatedAverageRating: newAverageRating,
    });
  } catch (error: any) {
    console.error("Error submitting rating:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "You have already rated this ride." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message || "Failed to submit rating." },
      { status: 500 }
    );
  }
}
