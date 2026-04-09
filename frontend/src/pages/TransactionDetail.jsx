import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Printer, Download, Loader2, AlertTriangle,
  CheckCircle, Mail, Send,
} from "lucide-react";
import {
  SettlementLetter, SwiftConfirmation, GlobalStatus, AllianceReport,
  PaymentTracer, MT202COV, AFTValidation, MT103AnswerBack, PACS008XML,
  M1Fund, ServerReport, FundsTracer, FundLocation, BeneficiaryCredit,
  DocClearance, SMTPMail, OnLedger, OfficerComm, MT900Debit, MT910Credit,
  MT940Statement, DebitNote, BalanceSheet, RemittanceReport,
  CreditNotification, IntermediaryBank, NostroAccountDetail,
} from "@/components/documents";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("settlement");
  const docRef = useRef(null);

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

  useEffect(() => { fetchTransaction(); }, [id]);

  const handlePrint = () => {
    const fixedElements = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
    const hidden = [];
    fixedElements.forEach(el => {
      if (el.style.display !== 'none') {
        hidden.push({ el, prev: el.style.display });
        el.style.display = 'none';
      }
    });
    window.print();
    hidden.forEach(({ el, prev }) => { el.style.display = prev; });
  };

  const handleCompleteTransaction = async () => {
    setCompleting(true);
    try {
      await axios.patch(`${API}/transactions/${id}/complete`);
      toast.success("Transaction completed successfully");
      await fetchTransaction();
    } catch (error) {
      toast.error("Failed to complete transaction");
    } finally {
      setCompleting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) { toast.error("Please enter recipient email"); return; }
    setSendingEmail(true);
    try {
      await axios.post(`${API}/transactions/${id}/send-notification`, {
        transaction_id: id, recipient_email: recipientEmail, notification_type: "confirmation"
      });
      toast.success(`Email notification sent to ${recipientEmail}`);
      setEmailDialogOpen(false);
      setRecipientEmail("");
    } catch (error) {
      toast.error("Failed to send email notification");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = docRef.current;
      if (!element) { toast.error("No document to export"); setExporting(false); return; }
      const tabNames = { settlement: "Settlement_Letter", confirmation: "SWIFT_Confirmation", status: "Global_Status", alliance: "Alliance_Report", tracer: "Payment_Tracer", mt202: "MT202_COV", aft: "AFT_Validation", mt103: "MT103_Answer_Back", pacs008: "PACS008_XML", m1fund: "M1_Fund", server: "Server_Report", fundstracer: "Funds_Tracer", fundlocation: "Fund_Location", bencredit: "Beneficiary_Credit", docclearance: "Doc_Clearance", smtp: "SMTP_Mail", onledger: "On_Ledger", officercomm: "Officer_Comm", mt900: "MT900_Debit", mt910: "MT910_Credit", mt940: "MT940_Statement", debitnote: "Debit_Note", balancesheet: "Balance_Sheet", remittance: "Remittance_Report", creditnotif: "Credit_Notification", intermediary: "Intermediary_Bank", nostro: "Nostro_Account" };
      const filename = `${tabNames[activeTab] || activeTab}_${transaction.uetr.slice(0, 8)}.pdf`;
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }).from(element).save();
      toast.success(`PDF exported: ${filename}`);
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
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
        <div className="bg-white border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Transaction Not Found</h2>
          <Button onClick={() => navigate("/transactions")} className="bg-[#DB0011] hover:bg-[#B3000E]">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Transactions
          </Button>
        </div>
      </div>
    );
  }

  const formatAmount = (a) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(a);

  return (
    <div className="p-6 space-y-4" data-testid="transaction-detail">
      {/* Header Actions */}
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => navigate("/transactions")} className="text-gray-600 hover:text-gray-900" data-testid="back-button">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <div className="flex gap-2">
          {transaction.status !== 'FINALIZED' && (
            <Button onClick={handleCompleteTransaction} disabled={completing} className="bg-green-600 hover:bg-green-700" data-testid="complete-transaction-button">
              {completing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Complete Transaction
            </Button>
          )}
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-gray-300" data-testid="send-email-button">
                <Mail className="w-4 h-4 mr-2" />Send Email
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Send Email Notification</DialogTitle>
                <DialogDescription>Send transaction confirmation to recipient email address.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Recipient Email</label>
                  <Input id="email" type="email" placeholder="recipient@bank.com" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} data-testid="recipient-email-input" />
                </div>
                <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                  <div><strong>Transaction:</strong> {transaction.uetr}</div>
                  <div><strong>Amount:</strong> {transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)}</div>
                  <div><strong>Status:</strong> {transaction.tracking_result}</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSendEmail} disabled={sendingEmail} className="bg-[#DB0011] hover:bg-[#B3000E]">
                  {sendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Notification
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handlePrint} className="border-gray-300" data-testid="print-button">
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={exporting} className="border-gray-300" data-testid="export-pdf-button">
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Document Tabs */}
      <Tabs defaultValue="settlement" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 no-print" data-testid="document-tabs">
          <TabsTrigger value="settlement" className="text-xs" data-testid="tab-settlement">Settlement Letter</TabsTrigger>
          <TabsTrigger value="confirmation" className="text-xs" data-testid="tab-confirmation">SWIFT Confirmation</TabsTrigger>
          <TabsTrigger value="status" className="text-xs" data-testid="tab-status">Global Status</TabsTrigger>
          <TabsTrigger value="alliance" className="text-xs" data-testid="tab-alliance">Alliance Report</TabsTrigger>
          <TabsTrigger value="tracer" className="text-xs" data-testid="tab-tracer">Payment Tracer</TabsTrigger>
          <TabsTrigger value="mt202" className="text-xs" data-testid="tab-mt202">MT202 COV</TabsTrigger>
          <TabsTrigger value="aft" className="text-xs" data-testid="tab-aft">AFT Validation</TabsTrigger>
          <TabsTrigger value="mt103" className="text-xs" data-testid="tab-mt103">MT103 Answer Back</TabsTrigger>
          <TabsTrigger value="pacs008" className="text-xs" data-testid="tab-pacs008">PACS.008 XML</TabsTrigger>
          <TabsTrigger value="m1fund" className="text-xs" data-testid="tab-m1fund">M1 Fund</TabsTrigger>
          <TabsTrigger value="server" className="text-xs" data-testid="tab-server">Server Report</TabsTrigger>
          <TabsTrigger value="fundstracer" className="text-xs" data-testid="tab-fundstracer">Funds Tracer</TabsTrigger>
          <TabsTrigger value="fundlocation" className="text-xs" data-testid="tab-fundlocation">Fund Location</TabsTrigger>
          <TabsTrigger value="bencredit" className="text-xs" data-testid="tab-bencredit">Beneficiary Credit</TabsTrigger>
          <TabsTrigger value="docclearance" className="text-xs" data-testid="tab-docclearance">Doc Clearance</TabsTrigger>
          <TabsTrigger value="smtp" className="text-xs" data-testid="tab-smtp">SMTP Mail</TabsTrigger>
          <TabsTrigger value="onledger" className="text-xs" data-testid="tab-onledger">On Ledger</TabsTrigger>
          <TabsTrigger value="officercomm" className="text-xs" data-testid="tab-officercomm">Officer Comm</TabsTrigger>
          <TabsTrigger value="mt900" className="text-xs" data-testid="tab-mt900">MT900 Debit</TabsTrigger>
          <TabsTrigger value="mt910" className="text-xs" data-testid="tab-mt910">MT910 Credit</TabsTrigger>
          <TabsTrigger value="mt940" className="text-xs" data-testid="tab-mt940">MT940 Statement</TabsTrigger>
          <TabsTrigger value="debitnote" className="text-xs" data-testid="tab-debitnote">Debit Note</TabsTrigger>
          <TabsTrigger value="balancesheet" className="text-xs" data-testid="tab-balancesheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="remittance" className="text-xs" data-testid="tab-remittance">Remittance Report</TabsTrigger>
          <TabsTrigger value="creditnotif" className="text-xs" data-testid="tab-creditnotif">Credit Notification</TabsTrigger>
          <TabsTrigger value="intermediary" className="text-xs" data-testid="tab-intermediary">Intermediary Bank</TabsTrigger>
          <TabsTrigger value="nostro" className="text-xs" data-testid="tab-nostro">Nostro Account Detail</TabsTrigger>
        </TabsList>

        {/* 4 Main PDF-matching Tabs */}
        <div ref={docRef}>
        <TabsContent value="settlement" className="mt-4"><SettlementLetter transaction={transaction} /></TabsContent>
        <TabsContent value="confirmation" className="mt-4"><SwiftConfirmation transaction={transaction} /></TabsContent>
        <TabsContent value="status" className="mt-4"><GlobalStatus transaction={transaction} /></TabsContent>
        <TabsContent value="alliance" className="mt-4"><AllianceReport transaction={transaction} /></TabsContent>

        {/* 23 Brief Document Tabs - Complete Transaction Details */}
        <TabsContent value="tracer" className="mt-4"><PaymentTracer transaction={transaction} /></TabsContent>
        <TabsContent value="mt202" className="mt-4"><MT202COV transaction={transaction} /></TabsContent>
        <TabsContent value="aft" className="mt-4"><AFTValidation transaction={transaction} /></TabsContent>
        <TabsContent value="mt103" className="mt-4"><MT103AnswerBack transaction={transaction} /></TabsContent>
        <TabsContent value="pacs008" className="mt-4"><PACS008XML transaction={transaction} /></TabsContent>
        <TabsContent value="m1fund" className="mt-4"><M1Fund transaction={transaction} /></TabsContent>
        <TabsContent value="server" className="mt-4"><ServerReport transaction={transaction} /></TabsContent>
        <TabsContent value="fundstracer" className="mt-4"><FundsTracer transaction={transaction} /></TabsContent>
        <TabsContent value="fundlocation" className="mt-4"><FundLocation transaction={transaction} /></TabsContent>
        <TabsContent value="bencredit" className="mt-4"><BeneficiaryCredit transaction={transaction} /></TabsContent>
        <TabsContent value="docclearance" className="mt-4"><DocClearance transaction={transaction} /></TabsContent>
        <TabsContent value="smtp" className="mt-4"><SMTPMail transaction={transaction} /></TabsContent>
        <TabsContent value="onledger" className="mt-4"><OnLedger transaction={transaction} /></TabsContent>
        <TabsContent value="officercomm" className="mt-4"><OfficerComm transaction={transaction} /></TabsContent>
        <TabsContent value="mt900" className="mt-4"><MT900Debit transaction={transaction} /></TabsContent>
        <TabsContent value="mt910" className="mt-4"><MT910Credit transaction={transaction} /></TabsContent>
        <TabsContent value="mt940" className="mt-4"><MT940Statement transaction={transaction} /></TabsContent>
        <TabsContent value="debitnote" className="mt-4"><DebitNote transaction={transaction} /></TabsContent>
        <TabsContent value="balancesheet" className="mt-4"><BalanceSheet transaction={transaction} /></TabsContent>
        <TabsContent value="remittance" className="mt-4"><RemittanceReport transaction={transaction} /></TabsContent>
        <TabsContent value="creditnotif" className="mt-4"><CreditNotification transaction={transaction} /></TabsContent>
        <TabsContent value="intermediary" className="mt-4"><IntermediaryBank transaction={transaction} /></TabsContent>
        <TabsContent value="nostro" className="mt-4"><NostroAccountDetail transaction={transaction} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
