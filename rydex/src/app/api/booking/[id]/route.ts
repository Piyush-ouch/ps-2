import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Explicitly import referenced models to prevent "MissingSchemaError" in Next.js serverless functions
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();

    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const currentUserRole = session.user.role;
    const id = (await context.params).id;

    // 2. Fetch the Booking
    const booking = await Booking.findById(id).populate("driver vehicle");
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // 3. Authorization Check: Only allow Rider, Assigned Driver, or Admin
    const isRider = booking.user.toString() === currentUserId;
    const isDriver = booking.driver.toString() === currentUserId;
    const isAdmin = currentUserRole === "admin";

    if (!isRider && !isDriver && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Convert mongoose document to plain JS object to delete properties
    const bookingData = booking.toObject();

    // 4. Secure Sensitive Fields (OTPs)
    // Driver must not see the OTPs beforehand (prevents bypass verification)
    if (isDriver) {
      delete bookingData.pickupOtp;
      delete bookingData.dropOtp;
    }

    // Rider only needs pickupOtp to share with the driver, never dropOtp
    if (isRider) {
      delete bookingData.dropOtp;
    }

    return NextResponse.json(bookingData);
  } catch (error: any) {
    console.error("GET BOOKING BY ID ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}