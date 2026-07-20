import mongoose, { Schema, Types } from "mongoose";

export type DocumentStatus = "pending" | "approved" | "rejected";
export type BackgroundCheckStatus =
  | "not_started"
  | "pending"
  | "passed"
  | "failed"
  | "flagged";

export interface IVehicleDocument {
  owner: Types.ObjectId;

  // Document URLs
  aadhaarUrl?: string;
  licenseUrl?: string;
  rcUrl?: string;
  insuranceUrl?: string;

  // Document Numbers
  aadhaarNumber?: string;
  licenseNumber?: string;
  rcNumber?: string;

  // Expiry Dates
  licenseExpiryDate?: Date;
  rcExpiryDate?: Date;
  insuranceExpiryDate?: Date;
  permitExpiryDate?: Date;

  // Per-Document Statuses
  aadhaarStatus?: DocumentStatus;
  licenseStatus?: DocumentStatus;
  rcStatus?: DocumentStatus;
  insuranceStatus?: DocumentStatus;

  // Overall Document Status
  status: DocumentStatus;
  rejectionReason?: string;

  // Expiry Flags
  isLicenseExpired?: boolean;
  isRcExpired?: boolean;
  isInsuranceExpired?: boolean;

  // Background Check Fields
  backgroundCheckStatus: BackgroundCheckStatus;
  backgroundCheckReference?: string;
  criminalRecordStatus?: "clean" | "pending" | "flagged";
  drivingHistoryStatus?: "clear" | "pending" | "violations";
  identityVerificationStatus?: "verified" | "failed" | "pending";
  backgroundCheckCompletedAt?: Date;
  backgroundCheckNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IVehicleDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    aadhaarUrl: String,
    licenseUrl: String,
    rcUrl: String,
    insuranceUrl: String,

    aadhaarNumber: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    rcNumber: { type: String, trim: true },

    licenseExpiryDate: Date,
    rcExpiryDate: Date,
    insuranceExpiryDate: Date,
    permitExpiryDate: Date,

    aadhaarStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    licenseStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rcStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    insuranceStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: String,

    isLicenseExpired: { type: Boolean, default: false },
    isRcExpired: { type: Boolean, default: false },
    isInsuranceExpired: { type: Boolean, default: false },

    backgroundCheckStatus: {
      type: String,
      enum: ["not_started", "pending", "passed", "failed", "flagged"],
      default: "not_started",
    },
    backgroundCheckReference: String,
    criminalRecordStatus: {
      type: String,
      enum: ["clean", "pending", "flagged"],
      default: "pending",
    },
    drivingHistoryStatus: {
      type: String,
      enum: ["clear", "pending", "violations"],
      default: "pending",
    },
    identityVerificationStatus: {
      type: String,
      enum: ["verified", "failed", "pending"],
      default: "pending",
    },
    backgroundCheckCompletedAt: Date,
    backgroundCheckNotes: String,
  },
  { timestamps: true }
);

const VehicleDocument =
  mongoose.models.VehicleDocument ||
  mongoose.model("VehicleDocument", DocumentSchema);

export default VehicleDocument;
