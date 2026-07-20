import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import Booking from "@/models/booking.model";

export async function GET() {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const isVendor = session.user.role === "vendor";

    let filter: any;
    if (isVendor) {
      filter = {
        driver: userId,
        status: "completed",
        driverRated: { $ne: true },
      };
    } else {
      filter = {
        user: userId,
        status: "completed",
        userRated: { $ne: true },
      };
    }

    const pendingBookings = await Booking.find(filter)
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("user", "name email mobileNumber")
      .populate("driver", "name email mobileNumber")
      .populate("vehicle", "vehicleModel number imageUrl");

    return NextResponse.json({
      count: pendingBookings.length,
      bookings: pendingBookings,
    });
  } catch (error: any) {
    console.error("Error fetching pending ratings:", error);
    return NextResponse.json(
      { message: "Failed to fetch pending ratings." },
      { status: 500 }
    );
  }
}
