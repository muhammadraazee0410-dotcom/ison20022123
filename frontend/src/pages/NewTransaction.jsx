import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Send,
  Building2,
  User,
  CreditCard,
  Banknote,
  FileText,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// PACS Message Types
const PACS_TYPES = [
  { value: "pacs.008.001.10", label: "PACS.008 - Customer Credit Transfer", description: "FI to FI Customer Credit Transfer" },
  { value: "pacs.009.001.08", label: "PACS.009 - Financial Institution Credit Transfer", description: "FI to FI Financial Institution Credit Transfer" },
  { value: "pacs.002.001.12", label: "PACS.002 - Payment Status Report", description: "FI to FI Payment Status Report" },
  { value: "pacs.004.001.11", label: "PACS.004 - Payment Return", description: "Payment Return" },
  { value: "pacs.003.001.09", label: "PACS.003 - FI to FI Customer Direct Debit", description: "FI to FI Customer Direct Debit" },
];

// Settlement Methods
const SETTLEMENT_METHODS = [
  { value: "INGA", label: "INGA - Instructed Agent" },
  { value: "INDA", label: "INDA - Instructing Agent" },
  { value: "COVE", label: "COVE - Cover Method" },
  { value: "CLRG", label: "CLRG - Clearing System" },
];

// Priority Options
const PRIORITY_OPTIONS = [
  { value: "HIGH", label: "High Priority" },
  { value: "NORMAL", label: "Normal Priority" },
  { value: "LOW", label: "Low Priority" },
];

// Currency Options
const CURRENCIES = [
  { value: "EUR", label: "EUR - Euro" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "JPY", label: "JPY - Japanese Yen" },
];

export default function NewTransaction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState([]);

  // Fetch registered accounts
  useEffect(() => {
    axios.get(`${API}/accounts`).then(res => setAccounts(res.data || [])).catch(() => {});
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    // Message Info
    messageType: "pacs.009.001.08",
    businessService: "swift.finplus",
    
    // Instructing Agent (Sender Bank)
    instructingAgentBic: "TUBDDEDDXXX",
    instructingAgentName: "",
    instructingAgentCountry: "DE",
    
    // Instructed Agent (Receiver Bank)
    instructedAgentBic: "",
    instructedAgentName: "",
    instructedAgentCountry: "",
    
    // Settlement Info
    settlementMethod: "INGA",
    settlementPriority: "NORMAL",
    settlementDate: new Date().toISOString().split('T')[0],
    settlementAmount: "",
    currency: "EUR",
    
    // Debtor (Sender Customer)
    debtorName: "",
    debtorIban: "",
    debtorCountry: "DE",
    
    // Creditor (Receiver Customer)
    creditorName: "",
    creditorIban: "",
    creditorCountry: "",
    
    // Remittance
    remittanceInfo: "",
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateUETR = () => {
    return uuidv4();
  };

  const validateStep1 = () => {
    if (!formData.messageType) {
      toast.error("Please select a message type");
      return false;
    }
    if (!formData.instructedAgentBic || !formData.instructedAgentName) {
      toast.error("Please fill in receiver bank details");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.settlementAmount || parseFloat(formData.settlementAmount) <= 0) {
      toast.error("Please enter a valid settlement amount");
      return false;
    }
    if (!formData.debtorName || !formData.debtorIban) {
      toast.error("Please fill in sender customer details");
      return false;
    }
    if (!formData.creditorName) {
      toast.error("Please fill in receiver customer details");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    
    try {
      const transactionData = {
        message_type: formData.messageType,
        uetr: generateUETR(),
        business_service: formData.businessService,
        instructing_agent: {
          bic: formData.instructingAgentBic,
          name: formData.instructingAgentName,
          country: formData.instructingAgentCountry,
        },
        instructed_agent: {
          bic: formData.instructedAgentBic,
          name: formData.instructedAgentName,
          country: formData.instructedAgentCountry,
        },
        settlement_info: {
          method: formData.settlementMethod,
          priority: formData.settlementPriority,
          settlement_date: formData.settlementDate,
          interbank_settlement_amount: parseFloat(formData.settlementAmount),
          currency: formData.currency,
        },
        debtor: {
          name: formData.debtorName,
          iban: formData.debtorIban,
          country: formData.debtorCountry,
        },
        creditor: {
          name: formData.creditorName,
          iban: formData.creditorIban || null,
          country: formData.creditorCountry,
        },
        remittance_info: formData.remittanceInfo || "PAYMENT",
        status: "PENDING",
        tracking_result: "PENDING",
        cbpr_compliant: true,
        nostro_credited: false,
        vostro_debited: false,
        network_ack: false,
        reversal_possibility: "POSSIBLE",
        manual_intervention: "NOT REQUIRED",
      };

      const response = await axios.post(`${API}/transactions`, transactionData);
      toast.success("Transaction created successfully");
      navigate(`/transactions/${response.data.id}`);
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error(error.response?.data?.detail || "Failed to create transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="new-transaction-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/transactions")}
            className="text-gray-600 hover:text-gray-900"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">New Transaction</h1>
            <p className="text-sm text-gray-500">Create a new SWIFT MX payment instruction</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#DB0011]' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1 ? 'bg-[#DB0011] text-white' : 'bg-gray-200 text-gray-500'}`}>
            1
          </div>
          <span className="font-medium">Message & Banks</span>
        </div>
        <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-[#DB0011]' : 'bg-gray-200'}`} />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#DB0011]' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2 ? 'bg-[#DB0011] text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
          <span className="font-medium">Amount & Parties</span>
        </div>
      </div>

      {/* Step 1: Message Type & Bank Details */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          {/* Message Type Selection */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
              <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#DB0011]" />
                Message Type
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="messageType" className="text-sm font-medium text-gray-700">
                    PACS Message Type *
                  </Label>
                  <Select
                    value={formData.messageType}
                    onValueChange={(value) => handleChange("messageType", value)}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="message-type-select">
                      <SelectValue placeholder="Select message type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PACS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="businessService" className="text-sm font-medium text-gray-700">
                    Business Service
                  </Label>
                  <Input
                    id="businessService"
                    value={formData.businessService}
                    onChange={(e) => handleChange("businessService", e.target.value)}
                    className="mt-1.5"
                    placeholder="swift.finplus"
                    data-testid="business-service-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sender Bank (Instructing Agent) */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
              <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#DB0011]" />
                Sender Bank (Instructing Agent)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="instructingAgentBic" className="text-sm font-medium text-gray-700">
                    BIC Code *
                  </Label>
                  <Input
                    id="instructingAgentBic"
                    value={formData.instructingAgentBic}
                    onChange={(e) => handleChange("instructingAgentBic", e.target.value.toUpperCase())}
                    className="mt-1.5 font-mono"
                    placeholder="TUBDDEDDXXX"
                    maxLength={11}
                    data-testid="sender-bic-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="instructingAgentName" className="text-sm font-medium text-gray-700">
                    Bank Name *
                  </Label>
                  <Input
                    id="instructingAgentName"
                    value={formData.instructingAgentName}
                    onChange={(e) => handleChange("instructingAgentName", e.target.value)}
                    className="mt-1.5"
                    placeholder="Bank Name"
                    data-testid="sender-bank-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="instructingAgentCountry" className="text-sm font-medium text-gray-700">
                    Country
                  </Label>
                  <Input
                    id="instructingAgentCountry"
                    value={formData.instructingAgentCountry}
                    onChange={(e) => handleChange("instructingAgentCountry", e.target.value.toUpperCase())}
                    className="mt-1.5"
                    placeholder="DE"
                    maxLength={2}
                    data-testid="sender-country-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receiver Bank (Instructed Agent) */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
              <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-green-600" />
                Receiver Bank (Instructed Agent)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="instructedAgentBic" className="text-sm font-medium text-gray-700">
                    BIC Code *
                  </Label>
                  <Input
                    id="instructedAgentBic"
                    value={formData.instructedAgentBic}
                    onChange={(e) => handleChange("instructedAgentBic", e.target.value.toUpperCase())}
                    className="mt-1.5 font-mono"
                    placeholder="BSCHESMMXXX"
                    maxLength={11}
                    data-testid="receiver-bic-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="instructedAgentName" className="text-sm font-medium text-gray-700">
                    Bank Name *
                  </Label>
                  <Input
                    id="instructedAgentName"
                    value={formData.instructedAgentName}
                    onChange={(e) => handleChange("instructedAgentName", e.target.value)}
                    className="mt-1.5"
                    placeholder="BANCO SANTANDER S.A."
                    data-testid="receiver-bank-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="instructedAgentCountry" className="text-sm font-medium text-gray-700">
                    Country
                  </Label>
                  <Input
                    id="instructedAgentCountry"
                    value={formData.instructedAgentCountry}
                    onChange={(e) => handleChange("instructedAgentCountry", e.target.value.toUpperCase())}
                    className="mt-1.5"
                    placeholder="ES"
                    maxLength={2}
                    data-testid="receiver-country-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className="bg-[#DB0011] hover:bg-[#B3000E]"
              data-testid="next-step-button"
            >
              Next: Amount & Parties
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Settlement & Party Details */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          {/* Settlement Information */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
              <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-[#DB0011]" />
                Settlement Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="settlementAmount" className="text-sm font-medium text-gray-700">
                    Amount *
                  </Label>
                  <Input
                    id="settlementAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.settlementAmount}
                    onChange={(e) => handleChange("settlementAmount", e.target.value)}
                    className="mt-1.5 font-mono"
                    placeholder="1000000.00"
                    data-testid="amount-input"
                  />
                </div>
                <div>
                  <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                    Currency *
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleChange("currency", value)}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="currency-select">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="settlementDate" className="text-sm font-medium text-gray-700">
                    Settlement Date *
                  </Label>
                  <Input
                    id="settlementDate"
                    type="date"
                    value={formData.settlementDate}
                    onChange={(e) => handleChange("settlementDate", e.target.value)}
                    className="mt-1.5"
                    data-testid="settlement-date-input"
                  />
                </div>
                <div>
                  <Label htmlFor="settlementPriority" className="text-sm font-medium text-gray-700">
                    Priority
                  </Label>
                  <Select
                    value={formData.settlementPriority}
                    onValueChange={(value) => handleChange("settlementPriority", value)}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="priority-select">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="settlementMethod" className="text-sm font-medium text-gray-700">
                    Settlement Method
                  </Label>
                  <Select
                    value={formData.settlementMethod}
                    onValueChange={(value) => handleChange("settlementMethod", value)}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="method-select">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {SETTLEMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debtor (Sender) */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
              <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#DB0011]" />
                Debtor (Sender)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Registered Account *
                  </Label>
                  <Select
                    value={formData.debtorName ? `${formData.debtorName}||${formData.debtorIban}` : ""}
                    onValueChange={(val) => {
                      if (val === "_manual_") {
                        handleChange("debtorName", "");
                        handleChange("debtorIban", "");
                        handleChange("debtorCountry", "");
                        return;
                      }
                      const acc = accounts.find(a => `${a.company_name}||${a.iban}` === val);
                      if (acc) {
                        handleChange("debtorName", acc.company_name);
                        handleChange("debtorIban", acc.iban);
                        const country = acc.iban ? acc.iban.substring(0, 2) : "DE";
                        handleChange("debtorCountry", country);
                        // Also set sender bank info from account
                        handleChange("instructingAgentBic", acc.swift_code || "TUBDDEDDXXX");
                        handleChange("instructingAgentName", acc.bank_name || "");
                        handleChange("instructingAgentCountry", country);
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="debtor-select">
                      <SelectValue placeholder="Select sender account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={`${acc.company_name}||${acc.iban}`}>
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">{acc.company_name}</div>
                              <div className="text-xs text-gray-500 font-mono">{acc.iban} &mdash; {acc.swift_code}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="_manual_">
                        <div className="text-gray-500">Enter manually...</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="debtorCountry" className="text-sm font-medium text-gray-700">
                    Country
                  </Label>
                  <Input
                    id="debtorCountry"
                    value={formData.debtorCountry}
                    onChange={(e) => handleChange("debtorCountry", e.target.value.toUpperCase())}
                    className="mt-1.5"
                    placeholder="DE"
                    maxLength={2}
                    data-testid="debtor-country-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="debtorName" className="text-sm font-medium text-gray-700">
                    Name *
                  </Label>
                  <Input
                    id="debtorName"
                    value={formData.debtorName}
                    onChange={(e) => handleChange("debtorName", e.target.value)}
                    className="mt-1.5"
                    placeholder="GOLD TRADING LIMITED"
                    data-testid="debtor-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="debtorIban" className="text-sm font-medium text-gray-700">
                    IBAN *
                  </Label>
                  <Input
                    id="debtorIban"
                    value={formData.debtorIban}
                    onChange={(e) => handleChange("debtorIban", e.target.value.toUpperCase().replace(/\s/g, ''))}
                    className="mt-1.5 font-mono"
                    placeholder="DE59300308800000499005"
                    data-testid="debtor-iban-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creditor (Receiver Customer) */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
              <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-green-600" />
                Creditor (Receiver)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="creditorName" className="text-sm font-medium text-gray-700">
                    Name *
                  </Label>
                  <Input
                    id="creditorName"
                    value={formData.creditorName}
                    onChange={(e) => handleChange("creditorName", e.target.value)}
                    className="mt-1.5"
                    placeholder="INVESTMENT FUND MANAGEMENT"
                    data-testid="creditor-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="creditorCountry" className="text-sm font-medium text-gray-700">
                    Country
                  </Label>
                  <Input
                    id="creditorCountry"
                    value={formData.creditorCountry}
                    onChange={(e) => handleChange("creditorCountry", e.target.value.toUpperCase())}
                    className="mt-1.5"
                    placeholder="ES"
                    maxLength={2}
                    data-testid="creditor-country-input"
                  />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="creditorIban" className="text-sm font-medium text-gray-700">
                    IBAN (Optional)
                  </Label>
                  <Input
                    id="creditorIban"
                    value={formData.creditorIban}
                    onChange={(e) => handleChange("creditorIban", e.target.value.toUpperCase().replace(/\s/g, ''))}
                    className="mt-1.5 font-mono"
                    placeholder="ES9121000418450200051332"
                    data-testid="creditor-iban-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remittance Information */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
              <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                Remittance Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div>
                <Label htmlFor="remittanceInfo" className="text-sm font-medium text-gray-700">
                  Payment Reference / Description
                </Label>
                <Textarea
                  id="remittanceInfo"
                  value={formData.remittanceInfo}
                  onChange={(e) => handleChange("remittanceInfo", e.target.value)}
                  className="mt-1.5"
                  placeholder="INVESTMENT PURPOSES"
                  rows={3}
                  data-testid="remittance-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="border-gray-300"
              data-testid="prev-step-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back: Message & Banks
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#DB0011] hover:bg-[#B3000E]"
              data-testid="submit-transaction-button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Create Transaction
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
