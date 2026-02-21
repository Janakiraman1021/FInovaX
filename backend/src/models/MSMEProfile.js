const mongoose = require("mongoose");
const { Schema } = mongoose;

const MSMEProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    sellerGSTIN: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    },
    buyerGSTIN: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    },
    invoiceAmount: {
      type: Number,
      min: 0,
    },
    invoiceDate: {
      type: Date,
    },
    poReference: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
MSMEProfileSchema.index({ userId: 1 });
MSMEProfileSchema.index({ sellerGSTIN: 1 });
MSMEProfileSchema.index({ buyerGSTIN: 1 });

module.exports = mongoose.model("MSMEProfile", MSMEProfileSchema);