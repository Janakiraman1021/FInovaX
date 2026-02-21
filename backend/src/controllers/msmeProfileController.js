const MSMEProfile = require("../models/MSMEProfile");

const getMSMEProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    const profile = await MSMEProfile.findOne({ userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "MSME profile not found",
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching MSME profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch MSME profile",
    });
  }
};

const createOrUpdateMSMEProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const {
      sellerGSTIN,
      buyerGSTIN,
      invoiceAmount,
      invoiceDate,
      poReference,
      companyName,
      contactPerson,
      email,
      phone,
      address,
    } = req.body;

    // Validation
    if (!sellerGSTIN || !buyerGSTIN) {
      return res.status(400).json({
        success: false,
        message: "Seller GSTIN and Buyer GSTIN are required",
      });
    }

    // GSTIN validation (15 characters alphanumeric)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(sellerGSTIN) || !gstinRegex.test(buyerGSTIN)) {
      return res.status(400).json({
        success: false,
        message: "Invalid GSTIN format",
      });
    }

    let profile = await MSMEProfile.findOne({ userId });

    if (profile) {
      // Update existing profile
      profile.sellerGSTIN = sellerGSTIN;
      profile.buyerGSTIN = buyerGSTIN;
      profile.invoiceAmount = invoiceAmount;
      profile.invoiceDate = invoiceDate;
      profile.poReference = poReference;
      profile.companyName = companyName;
      profile.contactPerson = contactPerson;
      profile.email = email;
      profile.phone = phone;
      profile.address = address;
      profile.updatedAt = new Date();

      await profile.save();

      res.json({
        success: true,
        message: "MSME profile updated successfully",
        data: profile,
      });
    } else {
      // Create new profile
      profile = await MSMEProfile.create({
        userId,
        sellerGSTIN,
        buyerGSTIN,
        invoiceAmount,
        invoiceDate,
        poReference,
        companyName,
        contactPerson,
        email,
        phone,
        address,
      });

      res.status(201).json({
        success: true,
        message: "MSME profile created successfully",
        data: profile,
      });
    }
  } catch (error) {
    console.error("Error creating/updating MSME profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save MSME profile",
    });
  }
};

const updateProfileField = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { field, value } = req.body;

    const allowedFields = [
      "sellerGSTIN",
      "buyerGSTIN",
      "invoiceAmount",
      "invoiceDate",
      "poReference",
      "companyName",
      "contactPerson",
      "email",
      "phone",
      "address",
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field name",
      });
    }

    const profile = await MSMEProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "MSME profile not found",
      });
    }

    profile[field] = value;
    profile.updatedAt = new Date();
    await profile.save();

    res.json({
      success: true,
      message: `${field} updated successfully`,
      data: profile,
    });
  } catch (error) {
    console.error("Error updating profile field:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile field",
    });
  }
};

const deleteMSMEProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const profile = await MSMEProfile.findOneAndDelete({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "MSME profile not found",
      });
    }

    res.json({
      success: true,
      message: "MSME profile deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting MSME profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete MSME profile",
    });
  }
};

module.exports = {
  getMSMEProfile,
  createOrUpdateMSMEProfile,
  updateProfileField,
  deleteMSMEProfile,
};