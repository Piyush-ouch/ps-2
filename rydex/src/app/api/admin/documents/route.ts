import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import VehicleDocument from "@/models/vehicleDocument.model";
import User from "@/models/user.model";

// GET: Fetch pending or flagged driver documents for admin verification
export async function GET() {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const documents = await VehicleDocument.find()
      .populate("owner", "name email mobileNumber vendorStatus vendorOnboardingStep backgroundCheckStatus averageRating")
      .sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error: any) {
    console.error("ADMIN GET DOCUMENTS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch driver documents." },
      { status: 500 }
    );
  }
}

// POST: Granular per-document verification (Approve/Reject Aadhaar, License, RC, Insurance)
export async function POST(req: Request) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const {
      documentId,
      aadhaarStatus,
      licenseStatus,
      rcStatus,
      insuranceStatus,
      rejectionReason,
    } = await req.json();

    if (!documentId) {
      return NextResponse.json({ message: "documentId is required." }, { status: 400 });
    }

    const doc = await VehicleDocument.findById(documentId);
    if (!doc) {
      return NextResponse.json({ message: "Document record not found." }, { status: 404 });
    }

    if (aadhaarStatus) doc.aadhaarStatus = aadhaarStatus;
    if (licenseStatus) doc.licenseStatus = licenseStatus;
    if (rcStatus) doc.rcStatus = rcStatus;
    if (insuranceStatus) doc.insuranceStatus = insuranceStatus;

    // Evaluate overall document status
    const allApproved =
      doc.aadhaarStatus === "approved" &&
      doc.licenseStatus === "approved" &&
      doc.rcStatus === "approved";

    const anyRejected =
      doc.aadhaarStatus === "rejected" ||
      doc.licenseStatus === "rejected" ||
      doc.rcStatus === "rejected";

    if (anyRejected) {
      doc.status = "rejected";
      doc.rejectionReason = rejectionReason || "Document verification rejected by admin.";
    } else if (allApproved) {
      doc.status = "approved";
      doc.rejectionReason = "";
    } else {
      doc.status = "pending";
    }

    await doc.save();

    // Sync with User vendorStatus
    const user = await User.findById(doc.owner);
    if (user) {
      if (doc.status === "approved") {
        user.vendorStatus = "approved";
      } else if (doc.status === "rejected") {
        user.vendorStatus = "rejected";
        user.vendorRejectionReason = doc.rejectionReason;
      }
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Document verification updated successfully.",
      document: doc,
    });
  } catch (error: any) {
    console.error("ADMIN VERIFY DOCUMENT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update document verification." },
      { status: 500 }
    );
  }
}
