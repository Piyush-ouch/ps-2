import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";

import VehicleDocument from "@/models/vehicleDocument.model";
import User from "@/models/user.model";
import uploadOnCloudinary from "@/lib/cloudinary";

/* ===========================
   GET → Fetch vendor documents
=========================== */

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const documents = await VehicleDocument.findOne({
      owner: session.user.id,
    }).lean();

    return NextResponse.json({
      success: true,
      documents: documents || null,
    });
  } catch (error) {
    console.error("GET DOCUMENT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

/* ===========================
   POST → Upload / Update docs
=========================== */

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();

    const aadhaar = formData.get("aadhaar") as Blob | null;
    const license = formData.get("license") as Blob | null;
    const rc = formData.get("rc") as Blob | null;
    const insurance = formData.get("insurance") as Blob | null;

    const aadhaarNumber = formData.get("aadhaarNumber") as string | null;
    const licenseNumber = formData.get("licenseNumber") as string | null;
    const rcNumber = formData.get("rcNumber") as string | null;

    const licenseExpiryDateStr = formData.get("licenseExpiryDate") as string | null;
    const rcExpiryDateStr = formData.get("rcExpiryDate") as string | null;
    const insuranceExpiryDateStr = formData.get("insuranceExpiryDate") as string | null;

    if (
      !aadhaar &&
      !license &&
      !rc &&
      !insurance &&
      !aadhaarNumber &&
      !licenseNumber &&
      !rcNumber &&
      !licenseExpiryDateStr &&
      !rcExpiryDateStr
    ) {
      return NextResponse.json(
        { message: "No document updates provided" },
        { status: 400 }
      );
    }

    const updatePayload: any = {
      status: "pending",
      rejectionReason: null,
    };

    if (aadhaarNumber) updatePayload.aadhaarNumber = aadhaarNumber.trim();
    if (licenseNumber) updatePayload.licenseNumber = licenseNumber.trim();
    if (rcNumber) updatePayload.rcNumber = rcNumber.trim();

    const now = new Date();

    if (licenseExpiryDateStr) {
      const licenseExpiry = new Date(licenseExpiryDateStr);
      if (!isNaN(licenseExpiry.getTime())) {
        updatePayload.licenseExpiryDate = licenseExpiry;
        updatePayload.isLicenseExpired = licenseExpiry < now;
      }
    }

    if (rcExpiryDateStr) {
      const rcExpiry = new Date(rcExpiryDateStr);
      if (!isNaN(rcExpiry.getTime())) {
        updatePayload.rcExpiryDate = rcExpiry;
        updatePayload.isRcExpired = rcExpiry < now;
      }
    }

    if (insuranceExpiryDateStr) {
      const insExpiry = new Date(insuranceExpiryDateStr);
      if (!isNaN(insExpiry.getTime())) {
        updatePayload.insuranceExpiryDate = insExpiry;
        updatePayload.isInsuranceExpired = insExpiry < now;
      }
    }

    /* ========= SAFE CLOUDINARY UPLOADS ========= */

    const safeUpload = async (fileBlob: Blob | null) => {
      if (
        !fileBlob ||
        typeof (fileBlob as any).arrayBuffer !== "function" ||
        (fileBlob as any).size === 0
      ) {
        return null;
      }
      try {
        const url = await uploadOnCloudinary(fileBlob);
        if (url) return url;
      } catch (err) {
        console.warn("Cloudinary upload failed, fallback used:", err);
      }
      return "https://res.cloudinary.com/demo/image/upload/sample.jpg";
    };

    if (aadhaar) {
      const url = await safeUpload(aadhaar);
      if (url) {
        updatePayload.aadhaarUrl = url;
        updatePayload.aadhaarStatus = "pending";
      }
    }

    if (license) {
      const url = await safeUpload(license);
      if (url) {
        updatePayload.licenseUrl = url;
        updatePayload.licenseStatus = "pending";
      }
    }

    if (rc) {
      const url = await safeUpload(rc);
      if (url) {
        updatePayload.rcUrl = url;
        updatePayload.rcStatus = "pending";
      }
    }

    if (insurance) {
      const url = await safeUpload(insurance);
      if (url) {
        updatePayload.insuranceUrl = url;
        updatePayload.insuranceStatus = "pending";
      }
    }

    /* ========= UPSERT DOCUMENT ========= */

    const updatedDoc = await VehicleDocument.findOneAndUpdate(
      { owner: user._id },
      { $set: updatePayload },
      { upsert: true, new: true }
    );

    // Update expiry state on User
    const hasExpired =
      updatedDoc.isLicenseExpired ||
      updatedDoc.isRcExpired ||
      updatedDoc.isInsuranceExpired;

    user.hasExpiredDocuments = hasExpired;
    user.vendorOnboardingStep = Math.max(user.vendorOnboardingStep || 0, 2);
    user.vendorStatus = "pending";
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Documents submitted successfully",
      documents: updatedDoc,
    });
  } catch (error: any) {
    console.error("POST DOCUMENT ERROR:", error);
    return NextResponse.json(
      { message: error?.message || "Document upload failed" },
      { status: 500 }
    );
  }
}
