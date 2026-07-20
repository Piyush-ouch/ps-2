import { NextResponse } from "next/server";
import { auth } from "@/auth";
import razorpay from "@/lib/razorpay";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";

export async function POST(req: Request) {
  try {
    await connectDb();

    /* ---------- AUTH CHECK ---------- */
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json(
        { message: "bookingId is required" },
        { status: 400 }
      );
    }

    /* ---------- BOOKING & OWNERSHIP CHECK ---------- */
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.user.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden. You do not own this booking." },
        { status: 403 }
      );
    }

    /* ---------- CREATE RAZORPAY ORDER ---------- */
    const order = await razorpay.orders.create({
      amount: booking.fare * 100,
      currency: "INR",
      receipt: booking._id.toString(),
    });

    booking.status = "awaiting_payment";
    await booking.save();

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
    });
  } catch (error: any) {
    console.error("PAYMENT CREATE ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}