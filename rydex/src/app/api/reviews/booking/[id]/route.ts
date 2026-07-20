import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Booking from "@/models/booking.model";
import Review from "@/models/review.model";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: bookingId } = await params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    const userId = session.user.id;
    const isParticipant =
      booking.user.toString() === userId || booking.driver.toString() === userId;

    if (!isParticipant) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const reviews = await Review.find({ booking: bookingId })
      .populate("reviewer", "name role")
      .populate("reviewee", "name role");

    const userReview = reviews.find((r) => r.reviewerRole === "user") || null;
    const driverReview = reviews.find((r) => r.reviewerRole === "vendor") || null;

    return NextResponse.json({
      bookingId,
      status: booking.status,
      userRated: booking.userRated || false,
      driverRated: booking.driverRated || false,
      userReview,
      driverReview,
      reviews,
    });
  } catch (error: any) {
    console.error("Error fetching booking review status:", error);
    return NextResponse.json(
      { message: "Failed to fetch review details." },
      { status: 500 }
    );
  }
}
