import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import VehicleDocument from "@/models/vehicleDocument.model";
import User from "@/models/user.model";

export async function POST() {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const documents = await VehicleDocument.find().populate("owner", "name email mobileNumber vendorStatus");

    let expiredCount = 0;
    let expiringSoonCount = 0;
    const expiredList: any[] = [];
    const expiringSoonList: any[] = [];

    for (const doc of documents) {
      let isLicenseExpired = false;
      let isRcExpired = false;
      let isInsuranceExpired = false;

      let isLicenseExpiringSoon = false;
      let isRcExpiringSoon = false;

      if (doc.licenseExpiryDate) {
        if (doc.licenseExpiryDate < now) {
          isLicenseExpired = true;
        } else if (doc.licenseExpiryDate <= thirtyDaysFromNow) {
          isLicenseExpiringSoon = true;
        }
      }

      if (doc.rcExpiryDate) {
        if (doc.rcExpiryDate < now) {
          isRcExpired = true;
        } else if (doc.rcExpiryDate <= thirtyDaysFromNow) {
          isRcExpiringSoon = true;
        }
      }

      if (doc.insuranceExpiryDate && doc.insuranceExpiryDate < now) {
        isInsuranceExpired = true;
      }

      doc.isLicenseExpired = isLicenseExpired;
      doc.isRcExpired = isRcExpired;
      doc.isInsuranceExpired = isInsuranceExpired;

      const hasExpired = isLicenseExpired || isRcExpired || isInsuranceExpired;
      const isExpiringSoon = isLicenseExpiringSoon || isRcExpiringSoon;

      await doc.save();

      if (doc.owner) {
        const user = await User.findById(doc.owner._id);
        if (user) {
          user.hasExpiredDocuments = hasExpired;
          if (hasExpired && user.vendorStatus === "approved") {
            user.isVendorBlocked = true;
            user.vendorRejectionReason = "Vendor suspended due to expired license/RC documents.";
          }
          await user.save();
        }
      }

      if (hasExpired) {
        expiredCount++;
        expiredList.push({
          documentId: doc._id,
          driver: doc.owner,
          isLicenseExpired,
          isRcExpired,
          isInsuranceExpired,
        });
      } else if (isExpiringSoon) {
        expiringSoonCount++;
        expiringSoonList.push({
          documentId: doc._id,
          driver: doc.owner,
          licenseExpiryDate: doc.licenseExpiryDate,
          rcExpiryDate: doc.rcExpiryDate,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now,
      summary: {
        scanned: documents.length,
        expiredCount,
        expiringSoonCount,
      },
      expiredList,
      expiringSoonList,
    });
  } catch (error: any) {
    console.error("EXPIRY SCANNER ERROR:", error);
    return NextResponse.json(
      { message: "Failed to execute document expiry scan." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
