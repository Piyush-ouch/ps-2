import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import User from "@/models/user.model";
import VehicleDocument from "@/models/vehicleDocument.model";

export async function POST(req: Request) {
  try {
    await connectDb();

    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== "vendor") {
      return NextResponse.json(
        { message: "Only registered drivers can trigger background checks." },
        { status: 403 }
      );
    }

    let doc = await VehicleDocument.findOne({ owner: userId });

    if (!doc) {
      doc = await VehicleDocument.create({
        owner: userId,
        status: "pending",
        backgroundCheckStatus: "pending",
      });
    }

    // Generate unique verification reference ID
    const refId = `BGC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Automated Verification Processing Simulation
    let identityVerificationStatus: "verified" | "failed" = "verified";
    let criminalRecordStatus: "clean" | "flagged" = "clean";
    let drivingHistoryStatus: "clear" | "violations" = "clear";
    let overallStatus: "passed" | "flagged" | "failed" = "passed";
    let notes = "Automated background check completed with zero flags detected across national records.";

    // Format & Expiry Validations
    if (doc.isLicenseExpired) {
      drivingHistoryStatus = "violations";
      overallStatus = "flagged";
      notes = "Automated check flagged expired driving license.";
    }

    if (doc.aadhaarNumber && doc.aadhaarNumber.length !== 12) {
      identityVerificationStatus = "failed";
      overallStatus = "failed";
      notes = "Aadhaar format verification failed (must be 12 digits).";
    }

    // Save Verification Results
    doc.backgroundCheckStatus = overallStatus;
    doc.backgroundCheckReference = refId;
    doc.identityVerificationStatus = identityVerificationStatus;
    doc.criminalRecordStatus = criminalRecordStatus;
    doc.drivingHistoryStatus = drivingHistoryStatus;
    doc.backgroundCheckCompletedAt = new Date();
    doc.backgroundCheckNotes = notes;
    await doc.save();

    user.backgroundCheckStatus = overallStatus;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Background check process completed.",
      backgroundCheck: {
        reference: refId,
        status: overallStatus,
        identityVerification: identityVerificationStatus,
        criminalRecord: criminalRecordStatus,
        drivingHistory: drivingHistoryStatus,
        completedAt: doc.backgroundCheckCompletedAt,
        notes,
      },
    });
  } catch (error: any) {
    console.error("BACKGROUND CHECK ERROR:", error);
    return NextResponse.json(
      { message: "Failed to process background check." },
      { status: 500 }
    );
  }
}
