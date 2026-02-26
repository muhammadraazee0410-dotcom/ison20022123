import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  Building2,
  Loader2,
  FileText,
  Hexagon,
  Globe,
  Banknote,
  User,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await axios.get(`${API}/transactions/${id}`);
        setTransaction(response.data);
      } catch (error) {
        console.error("Error fetching transaction:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "SUCCESSFUL":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "FAILED":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SUCCESSFUL":
        return "bg-green-50 text-green-700 border-green-200";
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "FAILED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#DB0011]" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6">
        <Card className="border border-gray-200">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Transaction Not Found
            </h2>
            <p className="text-gray-500 mb-6">
              The transaction you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/transactions")} className="bg-[#DB0011] hover:bg-[#B3000E]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="transaction-detail">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
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
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Transaction Receipt
            </h1>
            <p className="text-sm text-gray-500">
              SWIFT MX {transaction.message_type}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="border-gray-300" data-testid="print-button">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Receipt Document */}
      <div className="receipt-container paper-receipt max-w-4xl mx-auto">
        {/* Receipt Header */}
        <div className="receipt-header bg-[#2D2D2D] text-white p-8 rounded-t">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#DB0011] rounded-lg flex items-center justify-center">
                <Hexagon className="w-9 h-9 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">HSBC</h2>
                <p className="text-gray-400 text-sm">Continental Europe</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Document Type</p>
              <p className="font-semibold">Settlement Confirmation</p>
              <Badge className={`mt-2 ${getStatusColor(transaction.tracking_result)}`}>
                {getStatusIcon(transaction.tracking_result)}
                <span className="ml-1">{transaction.tracking_result}</span>
              </Badge>
            </div>
          </div>

          {/* UETR */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Unique End-to-End Transaction Reference (UETR)
            </p>
            <p className="font-mono text-lg tracking-wide text-white" data-testid="uetr-value">
              {transaction.uetr}
            </p>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="receipt-body p-8">
          {/* Amount Highlight */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200 hsbc-red-line">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider">
                  Interbank Settlement Amount
                </p>
                <p className="text-4xl font-semibold text-gray-900 mt-1" data-testid="amount-value">
                  {formatCurrency(transaction.settlement_info.interbank_settlement_amount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Currency</p>
                <p className="text-2xl font-semibold text-[#DB0011]">
                  {transaction.settlement_info.currency}
                </p>
              </div>
            </div>
          </div>

          {/* Settlement Information */}
          <div className="receipt-section">
            <h3 className="receipt-section-title flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              Settlement Information
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="receipt-field">
                <span className="receipt-field-label">Settlement Date</span>
                <span className="receipt-field-value" data-testid="settlement-date">
                  {transaction.settlement_info.settlement_date}
                </span>
              </div>
              <div className="receipt-field">
                <span className="receipt-field-label">Settlement Method</span>
                <span className="receipt-field-value">
                  {transaction.settlement_info.method}
                </span>
              </div>
              <div className="receipt-field">
                <span className="receipt-field-label">Priority</span>
                <Badge variant="outline" className={transaction.settlement_info.priority === "HIGH" ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-600 border-gray-200"}>
                  {transaction.settlement_info.priority}
                </Badge>
              </div>
              <div className="receipt-field">
                <span className="receipt-field-label">Business Service</span>
                <span className="receipt-field-value font-mono text-xs">
                  {transaction.business_service}
                </span>
              </div>
            </div>
          </div>

          {/* Instructing Agent */}
          <div className="receipt-section">
            <h3 className="receipt-section-title flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Instructing Agent (Sender)
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="receipt-field">
                <span className="receipt-field-label">BIC</span>
                <span className="receipt-field-value font-mono" data-testid="instructing-bic">
                  {transaction.instructing_agent.bic}
                </span>
              </div>
              <div className="receipt-field">
                <span className="receipt-field-label">Name</span>
                <span className="receipt-field-value">
                  {transaction.instructing_agent.name}
                </span>
              </div>
              <div className="receipt-field">
                <span className="receipt-field-label">Country</span>
                <span className="receipt-field-value">
                  {transaction.instructing_agent.country}
                </span>
              </div>
            </div>
          </div>

          {/* Instructed Agent */}
          <div className="receipt-section">
            <h3 className="receipt-section-title flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Instructed Agent (Receiver)
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="receipt-field">
                <span className="receipt-field-label">BIC</span>
                <span className="receipt-field-value font-mono" data-testid="instructed-bic">
                  {transaction.instructed_agent.bic}
                </span>
              </div>
              <div className="receipt-field">
                <span className="receipt-field-label">Name</span>
                <span className="receipt-field-value">
                  {transaction.instructed_agent.name}
                </span>
              </div>
              <div className="receipt-field">
                <span className="receipt-field-label">Country</span>
                <span className="receipt-field-value">
                  {transaction.instructed_agent.country}
                </span>
              </div>
            </div>
          </div>

          {/* Debtor Information */}
          <div className="receipt-section">
            <h3 className="receipt-section-title flex items-center gap-2">
              <User className="w-4 h-4" />
              Debtor (Sender Customer)
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="receipt-field">
                <span className="receipt-field-label">Name</span>
                <span className="receipt-field-value font-semibold" data-testid="debtor-name">
                  {transaction.debtor.name}
                </span>
              </div>
              <div className="receipt-field">
                <span className="receipt-field-label">IBAN</span>
                <span className="receipt-field-value font-mono text-xs" data-testid="debtor-iban">
                  {transaction.debtor.iban}
                </span>
              </div>
              <div className="receipt-field">
                <span className="receipt-field-label">Country</span>
                <span className="receipt-field-value">
                  {transaction.debtor.country}
                </span>
              </div>
            </div>
          </div>

          {/* Creditor Information */}
          <div className="receipt-section">
            <h3 className="receipt-section-title flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Creditor (Beneficiary)
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="receipt-field">
                <span className="receipt-field-label">Name</span>
                <span className="receipt-field-value font-semibold" data-testid="creditor-name">
                  {transaction.creditor.name}
                </span>
              </div>
              {transaction.creditor.iban && (
                <div className="receipt-field">
                  <span className="receipt-field-label">IBAN</span>
                  <span className="receipt-field-value font-mono text-xs">
                    {transaction.creditor.iban}
                  </span>
                </div>
              )}
              <div className="receipt-field">
                <span className="receipt-field-label">Country</span>
                <span className="receipt-field-value">
                  {transaction.creditor.country}
                </span>
              </div>
            </div>
          </div>

          {/* Remittance Information */}
          <div className="receipt-section">
            <h3 className="receipt-section-title flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Remittance Information
            </h3>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="text-gray-900" data-testid="remittance-info">{transaction.remittance_info}</p>
            </div>
          </div>

          {/* Status & Compliance */}
          <div className="receipt-section border-b-0 pb-0">
            <h3 className="receipt-section-title flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Status & Compliance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-1">System Status</p>
                <p className="font-semibold text-gray-900">{transaction.status}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-1">Tracking Result</p>
                <Badge className={getStatusColor(transaction.tracking_result)}>
                  {transaction.tracking_result}
                </Badge>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-1">CBPR+ Compliant</p>
                <p className="font-semibold text-green-600">
                  {transaction.cbpr_compliant ? "Yes" : "No"}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-1">Nostro Credited</p>
                <p className={`font-semibold ${transaction.nostro_credited ? "text-green-600" : "text-red-600"}`}>
                  {transaction.nostro_credited ? "Yes" : "No"}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-1">Vostro Debited</p>
                <p className={`font-semibold ${transaction.vostro_debited ? "text-green-600" : "text-red-600"}`}>
                  {transaction.vostro_debited ? "Yes" : "No"}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-1">Network ACK</p>
                <p className={`font-semibold ${transaction.network_ack ? "text-green-600" : "text-red-600"}`}>
                  {transaction.network_ack ? "Received" : "Pending"}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-1">Reversal</p>
                <p className="font-semibold text-gray-900">{transaction.reversal_possibility}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-1">Manual Intervention</p>
                <p className={`font-semibold ${transaction.manual_intervention === "NOT REQUIRED" ? "text-green-600" : "text-red-600"}`}>
                  {transaction.manual_intervention}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 rounded-b">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              <p>Generated: {new Date().toLocaleString("de-DE")}</p>
              <p className="mt-1">Message Type: {transaction.message_type}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-700">HSBC Germany MX Operations</p>
              <p>SWIFT Financial Institution Credit Transfer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
