"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  IdentificationIcon,
  DocumentTextIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import MainLayout from "../MainLayout";

// ========== Data ==========
const currencyOptions = [
  { label: "25,000 IQD - $186 AUD", value: 186 },
  { label: "50,000 IQD - $281 AUD", value: 281 },
  { label: "75,000 IQD - $325 AUD", value: 325 },
  { label: "100,000 IQD - $381 AUD", value: 381 },
  { label: "200,000 IQD - $656 AUD", value: 656 },
  // { label: "500,000 IQD - $1,875 AUD", value: 1875 },
  { label: "1,000,000 IQD - $2,800 AUD", value: 2800 },
];

const bankDetails = {
  accountName: "John Doe",
  accountNumber: "123456789",
  bsb: "062-000",
  bankName: "Dummy Bank Australia",
};

const westernUnionDetails = {
  recipientName: "Jane Smith",
  city: "Sydney",
  country: "Australia",
};

const initialFormData = {
  fullName: "",
  email: "",
  mobile: "",
  country: "",
  address: "",
  city: "",
  state: "",
  postcode: "",
  currency: "",
  quantity: 1,
  idFile: null,
  idFileUrl: "",
  acceptTerms: false,
  paymentMethod: "",
  paymentReceipt: null,
  paymentReceiptUrl: "",
  skipReceipt: false,
  comments: "",
};

export default function BuyDinar() {
  // Stepper and Form
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  // ========== Handlers ==========
  const handleChange = useCallback((e) => {
    const { name, value, type, files, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "file" ? files[0] : type === "checkbox" ? checked : value,
    }));
  }, []);

  const nextStep = useCallback(() => setStep((prev) => prev + 1), []);
  const prevStep = useCallback(() => setStep((prev) => prev - 1), []);

  // ========== Computed ==========
  const getCurrencyValue = useMemo(() => {
    const found = currencyOptions.find((o) => o.label === formData.currency);
    return found ? found.value : 0;
  }, [formData.currency]);
  const shippingFee = 49.99;

  const isStep1Valid = useMemo(() => {
    const f = formData;
    return (
      f.fullName &&
      f.email &&
      f.mobile &&
      f.country &&
      f.address &&
      f.city &&
      f.state &&
      f.postcode &&
      f.currency
    );
  }, [formData]);

  const isStep3Valid = useMemo(() => {
    const { paymentMethod, paymentReceipt, skipReceipt } = formData;
    if (!paymentMethod) return false;
    if (paymentMethod === "bank_transfer" || paymentMethod === "western_union")
      return paymentReceipt || skipReceipt;
    return false;
  }, [formData]);

  // ========== File Upload Helpers ==========
  async function uploadBlobFile(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/user/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url;
  }

  // ========== Submission ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let idFileUrl = formData.idFileUrl;
      let paymentReceiptUrl = formData.paymentReceiptUrl;

      // Step 1: Upload ID file (if any and not already uploaded)
      if (formData.idFile && !idFileUrl) {
        idFileUrl = await uploadBlobFile(formData.idFile);
      }
      // Step 2: Upload payment receipt (if any and not already uploaded)
      if (formData.paymentReceipt && !paymentReceiptUrl) {
        paymentReceiptUrl = await uploadBlobFile(formData.paymentReceipt);
      }

      // Prepare POST body for order (replace file objects with blob URLs)
      const payload = {
        ...formData,
        idFileUrl,
        paymentReceiptUrl,
        idFile: undefined,
        paymentReceipt: undefined,
      };

      const res = await fetch("/user/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowSuccessPopup(true);
        setFormData(initialFormData);
        setStep(1);
      } else {
        const data = await res.json();
        alert(data.error || "Order failed. Try again.");
      }
    } catch (err) {
      alert("Failed to upload files or save order. Please try again.");
    }
    setLoading(false);
  };

  // ========== Render ==========
  return (
    <MainLayout>
      <div className="min-h-screen max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* Stepper */}
        <Stepper step={step} />
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Form Section */}
          <div className="lg:w-2/3">
            {step === 1 && (
              <OrderDetails
                formData={formData}
                handleChange={handleChange}
                isStep1Valid={isStep1Valid}
                nextStep={nextStep}
              />
            )}

            {step === 2 && (
              <IDVerification
                formData={formData}
                handleChange={handleChange}
                prevStep={prevStep}
                nextStep={nextStep}
              />
            )}

            {step === 3 && (
              <PaymentInfo
                formData={formData}
                handleChange={handleChange}
                prevStep={prevStep}
                handleSubmit={handleSubmit}
                isStep3Valid={isStep3Valid}
                loading={loading}
                bankDetails={bankDetails}
                westernUnionDetails={westernUnionDetails}
              />
            )}
          </div>
          {/* Order Summary */}
          <div className="lg:w-1/3">
            <OrderSummary
              formData={formData}
              getCurrencyValue={getCurrencyValue}
              shippingFee={shippingFee}
            />
          </div>
        </div>
        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm text-center">
              <h3 className="text-xl font-bold mb-4">Order Placed Successfully!</h3>
              <p className="mb-6">Thank you for your order.</p>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="px-4 py-2 bg-orange-600 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// ================= Helper Components =================

function Stepper({ step }) {
  return (
    <div className="flex justify-center gap-10 lg:gap-20 mb-4 relative">
      {[
        {
          icon: DocumentTextIcon,
          label: "Order Details",
        },
        {
          icon: IdentificationIcon,
          label: "ID Verification",
        },
        {
          icon: CreditCardIcon,
          label: "Payment",
        },
      ].map((item, idx) => {
        const current = idx + 1 <= step;
        return (
          <div
            key={item.label}
            className={`flex flex-col items-center ${
              current ? "text-orange-500" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                current
                  ? "bg-orange-100 border-2 border-orange-500"
                  : "bg-gray-100"
              }`}
            >
              <item.icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        );
      })}
      <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 -z-10">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{
            width: step === 1 ? "16%" : step === 2 ? "50%" : "84%",
          }}
        ></div>
      </div>
    </div>
  );
}

function OrderDetails({ formData, handleChange, isStep1Valid, nextStep }) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-3">Step 1: Order Details</h2>
      <div className="mb-3">
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
          Select Currency Amount *
        </label>
        <select
          id="currency"
          name="currency"
          value={formData.currency}
          onChange={handleChange}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
          required
        >
          <option value="">Select an amount</option>
          {currencyOptions.map((option) => (
            <option key={option.label} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Full Name *" id="fullName" value={formData.fullName} onChange={handleChange} required />
          <InputField label="Email Address *" id="email" value={formData.email} onChange={handleChange} type="email" required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Mobile Number *" id="mobile" value={formData.mobile} onChange={handleChange} required />
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="">Select a country</option>
              <option value="New Zealand">New Zealand</option>
              <option value="Australia">Australia</option>
            </select>
          </div>
        </div>
        <InputField label="Street Address *" id="address" value={formData.address} onChange={handleChange} required />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField label="City *" id="city" value={formData.city} onChange={handleChange} required />
          <InputField label="State *" id="state" value={formData.state} onChange={handleChange} required />
          <InputField label="Postcode *" id="postcode" value={formData.postcode} onChange={handleChange} required />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={nextStep}
          disabled={!isStep1Valid}
          className={`flex items-center gap-2 text-white text-sm font-medium py-2 px-5 rounded-md transition-colors ${
            !isStep1Valid ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          Continue to ID Verification
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function IDVerification({ formData, handleChange, prevStep, nextStep }) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 2: Photo ID Upload</h2>
      <p className="text-gray-600 mb-6">
        To complete your order, please upload a valid photo ID for verification purposes.
      </p>
      <div className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <IdentificationIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-500 mb-2">
            Accepted: Driver&apos;s License, Passport + Utility Bill
          </p>
          <p className="text-xs text-gray-400 mb-4">
            File types: JPG, PNG, PDF (Max 10MB)
          </p>
          <label className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors cursor-pointer">
            <input
              type="file"
              name="idFile"
              onChange={handleChange}
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf"
              required
            />
            Choose File
          </label>
          {formData.idFile && (
            <div className="mt-4 text-sm text-green-600">
              {formData.idFile.name} uploaded successfully
            </div>
          )}
        </div>
        <div className="flex items-start">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleChange}
            id="acceptTerms"
            className="mt-1 mr-2"
            required
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-600">
            I accept the Terms and Conditions and Privacy Policy. I understand that ID verification is required for delivery.
          </label>
        </div>
      </div>
      <div className="mt-8 flex justify-between">
        <button
          onClick={prevStep}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium py-2.5 px-6 rounded-md transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>
        <button
          onClick={nextStep}
          disabled={!formData.idFile || !formData.acceptTerms}
          className={`flex items-center gap-2 text-white font-medium py-2.5 px-6 rounded-md transition-colors ${
            !formData.idFile || !formData.acceptTerms ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          Continue to Payment <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PaymentInfo({
  formData,
  handleChange,
  prevStep,
  handleSubmit,
  isStep3Valid,
  loading,
  bankDetails,
  westernUnionDetails,
}) {
  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 3: Payment Information</h2>
      <p className="text-gray-600 mb-6">Please choose your payment method:</p>
      <div className="space-y-6">
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
            Select your Payment Option *
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">-- Choose --</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="western_union">Western Union Money Transfer</option>
          </select>
        </div>
        {formData.paymentMethod === "bank_transfer" && (
          <PaymentDetails details={bankDetails} title="Bank Transfer Details" />
        )}
        {formData.paymentMethod === "western_union" && (
          <PaymentDetails details={westernUnionDetails} title="Western Union Details" />
        )}
        <div>
          <label htmlFor="paymentReceipt" className="block text-sm font-medium text-gray-700 mb-1">
            Upload Payment Receipt *
          </label>
          <input
            type="file"
            id="paymentReceipt"
            name="paymentReceipt"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleChange}
            disabled={formData.skipReceipt}
            className="w-full px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {formData.paymentReceipt && !formData.skipReceipt && (
            <p className="text-green-600 text-sm mt-2">{formData.paymentReceipt.name} uploaded successfully</p>
          )}
          <div className="mt-2 flex items-center">
            <input
              type="checkbox"
              id="skipReceipt"
              name="skipReceipt"
              checked={formData.skipReceipt}
              onChange={handleChange}
              className="mr-2"
            />
            <label htmlFor="skipReceipt" className="text-sm text-gray-600">
              Not now
            </label>
          </div>
        </div>
        <div>
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
            Comments (Optional)
          </label>
          <textarea
            id="comments"
            name="comments"
            rows={3}
            value={formData.comments}
            onChange={handleChange}
            placeholder="Write any additional notes or instructions here..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>
      <div className="mt-8 flex justify-between">
        <button
          onClick={prevStep}
          type="button"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium py-2.5 px-6 rounded-md transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>
        <button
          type="submit"
          disabled={!isStep3Valid || loading}
          className={`flex items-center gap-2 text-white font-medium py-2.5 px-6 rounded-md transition-colors ${
            !isStep3Valid || loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          {loading ? "Submitting..." : <>Complete Order <ArrowRightIcon className="w-4 h-4" /></>}
        </button>
      </div>
    </form>
  );
}

function OrderSummary({ formData, getCurrencyValue, shippingFee }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h3>
      <div className="space-y-3">
        <SummaryRow label="Currency:" value={formData.currency || "Not selected"} />
        <SummaryRow label="Unit Price:" value={`$${getCurrencyValue.toFixed(2)} AUD`} />
        <SummaryRow label="Shipping:" value={`$${shippingFee} AUD`} />
        <hr className="my-3" />
        <SummaryRow
          label={<span className="font-bold">Total:</span>}
          value={
            <span className="text-orange-600 font-bold">
              ${getCurrencyValue + shippingFee} AUD
            </span>
          }
        />
      </div>
      <div className="mt-6 p-4 bg-orange-50 rounded-lg">
        <p className="text-sm text-orange-600">
          <strong>Note:</strong> Your order will be processed within 24–48 hours after payment verification.
        </p>
      </div>
    </div>
  );
}

function PaymentDetails({ details, title }) {
  return (
    <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
      <h3 className="text-md font-semibold mb-2 text-gray-800">{title}</h3>
      {Object.entries(details).map(([key, value]) => (
        <p key={key}>
          <strong>{key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}:</strong> {value}
        </p>
      ))}
    </div>
  );
}

function InputField({ label, id, value, onChange, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={props.type || "text"}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
        {...props}
      />
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium ml-12">{value}</span>
    </div>
  );
}
