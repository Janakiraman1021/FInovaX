const express = require("express");
const {
  getMSMEProfile,
  createOrUpdateMSMEProfile,
  updateProfileField,
  deleteMSMEProfile,
} = require("../controllers/msmeProfileController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Only MSMEs can access these routes
router.use(authorize(["msme"]));

// GET /api/msme-profile - Get current user's MSME profile
router.get("/", getMSMEProfile);

// POST /api/msme-profile - Create or update MSME profile
router.post("/", createOrUpdateMSMEProfile);

// PATCH /api/msme-profile/field - Update specific field
router.patch("/field", updateProfileField);

// DELETE /api/msme-profile - Delete MSME profile
router.delete("/", deleteMSMEProfile);

module.exports = router;