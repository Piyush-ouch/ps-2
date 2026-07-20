import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import crypto from "crypto";
import axios from "axios";

export async function POST(req: Request) {
  try {
    await connectDb();

    /* ---------- AUTH CHECK ---------- */
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing required payment verification parameters" },
        { status: 400 }
      );
    }

    /* ---------- BOOKING & OWNERSHIP CHECK ---------- */
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden. You do not own this booking." },
        { status: 403 }
      );
    }

    /* ---------- SIGNATURE VERIFICATION ---------- */
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    /* ---------- SPLIT CALCULATION & BOOKING UPDATE ---------- */
    const adminCommission = Number((booking.fare * 0.10).toFixed(2));
    const partnerAmount = Number((booking.fare - adminCommission).toFixed(2));

    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    booking.adminCommission = adminCommission;
    booking.partnerAmount = partnerAmount;

    await booking.save();

    /* ---------- REALTIME NOTIFICATION TO DRIVER ---------- */
    try {
      if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
        await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
          userId: booking.driver.toString(),
          event: "booking-updated",
          data: {
            _id: booking._id,
            status: "confirmed",
            paymentStatus: "paid",
          },
        });
      }
    } catch (socketErr) {
      console.warn("Failed to send real-time payment notification:", socketErr);
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      adminCommission,
      partnerAmount,
    });
  } catch (error: any) {
    console.error("PAYMENT VERIFY ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}