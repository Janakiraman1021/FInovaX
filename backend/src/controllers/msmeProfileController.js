const MSMEProfile = require("../models/MSMEProfile");

const getMSMEProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

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
    const userId = req.user?.id;
    const {
      companyName,
      contactPerson,
      email,
      phone,
      address,
    } = req.body;

    // Validation (Identity is already verified by middleware)
    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    let profile = await MSMEProfile.findOne({ userId });

    if (profile) {
      // Update existing profile
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
    const userId = req.user?.id;
    const { field, value } = req.body;

    const allowedFields = [
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
    const userId = req.user?.id;

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

const getMyTrustScore = async (req, res, next) => {
  try {
    const profile = await MSMEProfile.findOne({ userId: req.user.id });
    if (!profile) {
      // Assuming AppError and sendResponse are defined elsewhere or need to be replaced
      // For now, using standard Express response
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Assuming sendResponse is a helper function, replacing with direct res.json
    return res.status(200).json({
      success: true,
      data: {
        trustScore: profile.trustScore || 100,
        status: profile.trustScore >= 80 ? 'EXCELLENT' : (profile.trustScore >= 50 ? 'STABLE' : 'RISKY')
      }
    });
  } catch (error) {
    console.error("Error fetching trust score:", error);
    // If 'next' is available for error handling middleware
    if (next) {
      next(error);
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to fetch trust score",
      });
    }
  }
};

const getMSMETrustScore = async (req, res, next) => {
  try {
    const { msmeId } = req.params;
    const profile = await MSMEProfile.findOne({ userId: msmeId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        trustScore: profile.trustScore || 100,
        status: profile.trustScore >= 80 ? 'EXCELLENT' : (profile.trustScore >= 50 ? 'STABLE' : 'RISKY')
      }
    });
  } catch (error) {
    console.error("Error fetching MSME trust score:", error);
    if (next) {
      next(error);
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to fetch trust score",
      });
    }
  }
};

module.exports = {
  getMSMEProfile,
  createOrUpdateMSMEProfile,
  updateProfileField,
  deleteMSMEProfile,
  getMyTrustScore,
  getMSMETrustScore,
};