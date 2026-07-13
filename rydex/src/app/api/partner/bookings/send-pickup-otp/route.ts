import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.model";
import { sendMail } from "@/lib/mailer";


export async function POST(req: Request) {

  await connectDB();

  try {

    const { bookingId } = await req.json();

    const booking = await Booking
      .findById(bookingId)
      .populate("user");

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    /* Generate OTP */
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    booking.pickupOtp = otp;
    booking.pickupOtpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await booking.save();

    /* Send Mail */
    console.log(`Pickup OTP for Booking ${bookingId}: ${otp}`);
    try {
      if (booking.user?.email && process.env.PASS) {
        await sendMail(
          booking.user.email,
          "Your Pickup OTP - RYDEX",
          `
          <div style="font-family:sans-serif;padding:20px">
            <h2>Ride OTP</h2>
  
            <p>Your pickup OTP is:</p>
  
            <h1 style="letter-spacing:6px">${otp}</h1>
  
            <p>This OTP is valid for 5 minutes.</p>
  
            <p>Share this OTP with your driver to start the ride.</p>
  
            <br/>
  
            <b>RYDEX</b>
          </div>
          `
        );
      } else if (!process.env.PASS) {
        console.warn("Skipping pickup OTP email send: PASS is empty. OTP is printed in the terminal above.");
      }
    } catch (mailError) {
      console.error("Failed to send pickup OTP email:", mailError);
      console.warn("You can use the console-logged OTP above to proceed with local verification.");
    }

    return NextResponse.json({
      success: true,
      message: "Pickup OTP sent",
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { message: "OTP send failed" },
      { status: 500 }
    );

  }

}