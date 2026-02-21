"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, Building2, Mail, Phone, MapPin, FileText, 
  Calendar, DollarSign, Save, RefreshCw, AlertCircle,
  CheckCircle2, Edit2, X
} from "lucide-react";
import { toast } from "sonner";
import { msmeProfileAPI, MSMEProfile, MSMEProfilePayload } from "@/lib/api";

export default function MSMEProfilePage() {
  const [profile, setProfile] = useState<MSMEProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    sellerGSTIN: "",
    buyerGSTIN: "",
    invoiceAmount: "",
    invoiceDate: "",
    poReference: "",
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("finovax-token");
      if (!token) throw new Error("No authentication token found");
      
      const result = await msmeProfileAPI.getProfile(token);
      
      if (result.success && result.data) {
        setProfile(result.data);
        setFormData({
          sellerGSTIN: result.data.sellerGSTIN || "",
          buyerGSTIN: result.data.buyerGSTIN || "",
          invoiceAmount: result.data.invoiceAmount?.toString() || "",
          invoiceDate: result.data.invoiceDate ? result.data.invoiceDate.split("T")[0] : "",
          poReference: result.data.poReference || "",
          companyName: result.data.companyName || "",
          contactPerson: result.data.contactPerson || "",
          email: result.data.email || "",
          phone: result.data.phone || "",
          address: {
            street: result.data.address?.street || "",
            city: result.data.address?.city || "",
            state: result.data.address?.state || "",
            pincode: result.data.address?.pincode || "",
            country: result.data.address?.country || "India",
          },
        });
        setEditing(false);
      }
    } catch (err: any) {
      if (err.message?.includes("404") || err.message?.includes("not found")) {
        // Profile doesn't exist yet
        setEditing(true);
      } else {
        setError(err.message || "Failed to load profile");
        toast.error(err.message || "Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("finovax-token");
      if (!token) throw new Error("No authentication token found");

      const payload: MSMEProfilePayload = {
        ...formData,
        invoiceAmount: formData.invoiceAmount ? parseFloat(formData.invoiceAmount) : undefined,
        invoiceDate: formData.invoiceDate || undefined,
      };

      const result = await msmeProfileAPI.createOrUpdate(token, payload);

      if (result.success) {
        setProfile(result.data);
        setEditing(false);
        toast.success(profile ? "Profile updated successfully" : "Profile created successfully");
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to save profile";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        sellerGSTIN: profile.sellerGSTIN || "",
        buyerGSTIN: profile.buyerGSTIN || "",
        invoiceAmount: profile.invoiceAmount?.toString() || "",
        invoiceDate: profile.invoiceDate ? profile.invoiceDate.split("T")[0] : "",
        poReference: profile.poReference || "",
        companyName: profile.companyName || "",
        contactPerson: profile.contactPerson || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: {
          street: profile.address?.street || "",
          city: profile.address?.city || "",
          state: profile.address?.state || "",
          pincode: profile.address?.pincode || "",
          country: profile.address?.country || "India",
        },
      });
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-mg-lavender" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="mg-label mb-1.5">MSME Dashboard</p>
          <h1 className="text-3xl font-bold text-mg-silver tracking-tight">
            Company <span className="mg-accent-text">Profile</span>
          </h1>
          <p className="text-sm text-mg-muted mt-1">
            {profile ? "Manage your business information" : "Create your business profile"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && profile && (
            <button
              onClick={() => setEditing(true)}
              className="mg-btn-ghost border border-mg-lavender/20 px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
          <button
            onClick={fetchProfile}
            disabled={loading}
            className="mg-btn-ghost border border-mg-lavender/20 px-3 py-2 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl text-sm text-status-danger bg-status-danger/5 border border-status-danger/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mg-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-mg-lavender" />
            <h2 className="text-lg font-semibold text-mg-silver">Company Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mg-label">Company Name *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                disabled={!editing}
                className="mg-input"
                required
              />
            </div>

            <div>
              <label className="mg-label">Contact Person *</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                disabled={!editing}
                className="mg-input"
                required
              />
            </div>

            <div>
              <label className="mg-label">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-muted" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editing}
                  className="mg-input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mg-label">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-muted" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editing}
                  className="mg-input pl-10"
                  required
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* GSTIN Information */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mg-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-mg-lavender" />
            <h2 className="text-lg font-semibold text-mg-silver">GSTIN Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mg-label">Seller GSTIN *</label>
              <input
                type="text"
                value={formData.sellerGSTIN}
                onChange={(e) => setFormData({ ...formData, sellerGSTIN: e.target.value.toUpperCase() })}
                disabled={!editing}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className="mg-input font-mono"
                required
              />
              <p className="text-xs text-mg-muted mt-1">15-digit GSTIN format</p>
            </div>

            <div>
              <label className="mg-label">Buyer GSTIN *</label>
              <input
                type="text"
                value={formData.buyerGSTIN}
                onChange={(e) => setFormData({ ...formData, buyerGSTIN: e.target.value.toUpperCase() })}
                disabled={!editing}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className="mg-input font-mono"
                required
              />
              <p className="text-xs text-mg-muted mt-1">15-digit GSTIN format</p>
            </div>
          </div>
        </motion.div>

        {/* Invoice Information */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mg-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-mg-lavender" />
            <h2 className="text-lg font-semibold text-mg-silver">Invoice Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="mg-label">Invoice Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.invoiceAmount}
                onChange={(e) => setFormData({ ...formData, invoiceAmount: e.target.value })}
                disabled={!editing}
                placeholder="1000000.00"
                className="mg-input"
              />
            </div>

            <div>
              <label className="mg-label">Invoice Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mg-muted" />
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  disabled={!editing}
                  className="mg-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="mg-label">PO Reference</label>
              <input
                type="text"
                value={formData.poReference}
                onChange={(e) => setFormData({ ...formData, poReference: e.target.value })}
                disabled={!editing}
                placeholder="PO-2024-001"
                className="mg-input"
              />
            </div>
          </div>
        </motion.div>

        {/* Address Information */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mg-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-mg-lavender" />
            <h2 className="text-lg font-semibold text-mg-silver">Address</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mg-label">Street Address</label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                disabled={!editing}
                className="mg-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="mg-label">City</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                  disabled={!editing}
                  className="mg-input"
                />
              </div>

              <div>
                <label className="mg-label">State</label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                  disabled={!editing}
                  className="mg-input"
                />
              </div>

              <div>
                <label className="mg-label">Pincode</label>
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
                  disabled={!editing}
                  maxLength={6}
                  className="mg-input"
                />
              </div>

              <div>
                <label className="mg-label">Country</label>
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                  disabled={!editing}
                  className="mg-input"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-end gap-3"
          >
            {profile && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="mg-btn-ghost border border-mg-lavender/20 px-6 py-2.5 rounded-xl flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="mg-btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {profile ? "Update Profile" : "Create Profile"}
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Profile Status */}
        {profile && !editing && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 p-4 rounded-xl bg-status-success/5 border border-status-success/20"
          >
            <CheckCircle2 className="w-5 h-5 text-status-success" />
            <div>
              <p className="text-sm font-medium text-status-success">Profile Active</p>
              <p className="text-xs text-mg-muted mt-0.5">
                Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
