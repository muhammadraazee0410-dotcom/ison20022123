import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Printer,
  Download,
  Loader2,
  AlertTriangle,
  Check,
  CheckCircle,
  Mail,
  Send,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Barcode Component
const Barcode = ({ value }) => {
  const generateBars = () => {
    const bars = [];
    const pattern = value.split('').map((c, i) => {
      const code = c.charCodeAt(0);
      return [(code % 4) + 1, ((code * 2) % 3) + 1, ((code * 3) % 4) + 1];
    }).flat();
    
    for (let i = 0; i < Math.min(pattern.length, 80); i++) {
      const width = pattern[i];
      const isBar = i % 2 === 0;
      bars.push(
        <div
          key={i}
          className={`h-12 ${isBar ? 'bg-black' : 'bg-white'}`}
          style={{ width: `${width}px` }}
        />
      );
    }
    return bars;
  };

  return (
    <div className="flex justify-center items-center py-4 bg-white">
      <div className="flex h-12">
        {generateBars()}
      </div>
    </div>
  );
};

// Real Scannable QR Code Component using qrcode.react
const QRCode = ({ value, size = 100 }) => {
  // Create a URL or data string that can be scanned
  const qrData = `SWIFT-TXN:${value}`;
  
  return (
    <div className="bg-white p-2 border border-gray-300" style={{ width: size + 16, height: size + 16 }}>
      <QRCodeSVG
        value={qrData}
        size={size}
        level="H"
        includeMargin={false}
        bgColor="#FFFFFF"
        fgColor="#000000"
      />
    </div>
  );
};

// Document Header with MX branding
const DocumentHeader = ({ title, subtitle }) => (
  <div className="border-b-2 border-gray-300 pb-4 mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="/iso-logo.png" alt="ISO 20022" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-bold text-[#DB0011]">ISO 20022</span>
        </div>
        <div className="h-8 w-px bg-gray-300" />
        <span className="text-sm text-gray-600">Germany</span>
      </div>
      <div className="text-center flex-1">
        <h1 className="text-lg font-bold tracking-wider">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <img src="/swift-logo.png" alt="SWIFT" className="h-8 w-auto object-contain" />
      </div>
    </div>
  </div>
);

// Field Row Component
const FieldRow = ({ label, value, mono = false, labelWidth = "w-56", dark = false }) => (
  <div className="flex py-0.5">
    <span className={`${dark ? 'text-gray-500' : 'text-gray-600'} ${labelWidth} flex-shrink-0`}>{label}:</span>
    <span className={`${dark ? 'text-gray-200' : 'text-gray-900'} ${mono ? 'font-mono' : ''}`}>{value || '-'}</span>
  </div>
);

// Section Header
const SectionHeader = ({ title, dark = false }) => (
  <div className={`border-t border-b py-1 px-2 my-4 text-center ${dark ? 'border-red-600 bg-transparent' : 'border-gray-300 bg-gray-100'}`}>
    <span className={`text-xs font-semibold tracking-wider ${dark ? 'text-red-500' : 'text-gray-700'}`}>{title}</span>
  </div>
);

// Checkmark Item
const CheckItem = ({ children, color = "black" }) => (
  <div className="flex items-start gap-2 py-0.5">
    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color === "green" ? "text-green-600" : "text-gray-700"}`} strokeWidth={2} />
    <span className={color === "green" ? "text-green-600" : "text-gray-900"}>{children}</span>
  </div>
);

// SWIFT Field Block
const SwiftField = ({ tag, label, children }) => (
  <div className="py-1">
    <div className="flex gap-4">
      <span className="text-gray-500 w-8 flex-shrink-0 font-mono">{tag}:</span>
      <div className="flex-1">
        <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="font-mono text-sm mt-0.5 whitespace-pre-wrap">{children}</div>
      </div>
    </div>
  </div>
);

// Validation Row
const ValidationRow = ({ code, description, status, detail }) => (
  <div className="flex text-xs font-mono py-0.5">
    <span className="w-16 text-gray-500">{code}</span>
    <span className="flex-1 text-gray-700">{description}</span>
    <span className="w-32 text-right">
      <span className="text-green-600">{status}</span>
      <span className="text-gray-400 ml-1">[{detail}]</span>
    </span>
  </div>
);

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const printRef = useRef();

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

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const handlePrint = () => {
    // Hide any fixed-position badges/overlays before printing
    const fixedElements = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
    const hidden = [];
    fixedElements.forEach(el => {
      if (el.style.display !== 'none') {
        hidden.push({ el, prev: el.style.display });
        el.style.display = 'none';
      }
    });
    window.print();
    // Restore after print dialog closes
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
    if (!recipientEmail) {
      toast.error("Please enter recipient email");
      return;
    }
    setSendingEmail(true);
    try {
      await axios.post(`${API}/transactions/${id}/send-notification`, {
        transaction_id: id,
        recipient_email: recipientEmail,
        notification_type: "confirmation"
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

  const formatAmount = (amount) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('de-DE') : '-';
  const formatDateLong = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };
  const formatDateTime = (dateStr) => dateStr ? `${new Date(dateStr).toISOString().replace('T', ' ').slice(0, -5)}Z` : '-';

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

  const trn = `MX${transaction.uetr.replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  const messageId = `MX${Date.now().toString().slice(-10)}`;

  return (
    <div className="p-6 space-y-4" data-testid="transaction-detail">
      {/* Header Actions */}
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => navigate("/transactions")} className="text-gray-600 hover:text-gray-900" data-testid="back-button">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <div className="flex gap-2">
          {transaction.status !== 'FINALIZED' && (
            <Button 
              onClick={handleCompleteTransaction}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700"
              data-testid="complete-transaction-button"
            >
              {completing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
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
                <DialogDescription>
                  Send transaction confirmation to recipient email address.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Recipient Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="recipient@bank.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    data-testid="recipient-email-input"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                  <div><strong>Transaction:</strong> {transaction.uetr}</div>
                  <div><strong>Amount:</strong> {transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)}</div>
                  <div><strong>Status:</strong> {transaction.tracking_result}</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="bg-[#DB0011] hover:bg-[#B3000E]"
                >
                  {sendingEmail ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Notification
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handlePrint} className="border-gray-300" data-testid="print-button">
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          <Button variant="outline" className="border-gray-300">
            <Download className="w-4 h-4 mr-2" />Export PDF
          </Button>
        </div>
      </div>

      {/* Document Tabs */}
      <Tabs defaultValue="settlement" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 no-print">
          <TabsTrigger value="settlement" className="text-xs">Settlement Letter</TabsTrigger>
          <TabsTrigger value="confirmation" className="text-xs">SWIFT Confirmation</TabsTrigger>
          <TabsTrigger value="status" className="text-xs">Global Status</TabsTrigger>
          <TabsTrigger value="alliance" className="text-xs">Alliance Report</TabsTrigger>
          <TabsTrigger value="tracer" className="text-xs">Payment Tracer</TabsTrigger>
          <TabsTrigger value="mt202" className="text-xs">MT202 COV</TabsTrigger>
          <TabsTrigger value="aft" className="text-xs">AFT Validation</TabsTrigger>
          <TabsTrigger value="mt103" className="text-xs">MT103 Answer Back</TabsTrigger>
          <TabsTrigger value="pacs008" className="text-xs">PACS.008 XML</TabsTrigger>
          <TabsTrigger value="m1fund" className="text-xs">M1 Fund</TabsTrigger>
          <TabsTrigger value="server" className="text-xs">Server Report</TabsTrigger>
          <TabsTrigger value="fundstracer" className="text-xs">Funds Tracer</TabsTrigger>
          <TabsTrigger value="fundlocation" className="text-xs">Fund Location</TabsTrigger>
          <TabsTrigger value="bencredit" className="text-xs">Beneficiary Credit</TabsTrigger>
          <TabsTrigger value="docclearance" className="text-xs">Doc Clearance</TabsTrigger>
          <TabsTrigger value="smtp" className="text-xs">SMTP Mail</TabsTrigger>
          <TabsTrigger value="onledger" className="text-xs">On Ledger</TabsTrigger>
          <TabsTrigger value="officercomm" className="text-xs">Officer Comm</TabsTrigger>
          <TabsTrigger value="mt900" className="text-xs">MT900 Debit</TabsTrigger>
          <TabsTrigger value="mt910" className="text-xs">MT910 Credit</TabsTrigger>
          <TabsTrigger value="mt940" className="text-xs">MT940 Statement</TabsTrigger>
          <TabsTrigger value="debitnote" className="text-xs">Debit Note</TabsTrigger>
          <TabsTrigger value="balancesheet" className="text-xs">Balance Sheet</TabsTrigger>
          <TabsTrigger value="remittance" className="text-xs">Remittance Report</TabsTrigger>
          <TabsTrigger value="creditnotif" className="text-xs">Credit Notification</TabsTrigger>
          <TabsTrigger value="intermediary" className="text-xs">Intermediary Bank</TabsTrigger>
          <TabsTrigger value="nostro" className="text-xs">Nostro Account Detail</TabsTrigger>
        </TabsList>

        {/* Payment Settlement Confirmation Letter */}
        <TabsContent value="settlement" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <div className="flex items-center gap-2 mb-4"><img src="/iso-logo.png" alt="ISO 20022" className="w-8 h-8 object-contain" /><span className="font-bold text-[#DB0011]">ISO 20022</span></div>
            <div className="border-2 border-gray-800 p-4 mb-6 text-center">
              <div className="border border-gray-400 inline-block px-8 py-2">
                <div className="font-bold text-sm">PAYMENT SETTLEMENT CONFIRMATION LETTER</div>
                <div className="text-gray-600">(FOR CORRESPONDENT / BENEFICIARY BANK USE)</div>
              </div>
            </div>

            {/* Letter Header */}
            <div className="mb-6">
              <FieldRow label="To" value="Correspondent / Beneficiary Bank" labelWidth="w-24" />
              <FieldRow label="Attention" value="Operations / Payments Department" labelWidth="w-24" />
              <div className="mt-4" />
              <FieldRow label="From" value="Operations & Settlement Desk" labelWidth="w-24" />
              <FieldRow label="Via" value="SWIFT Network (CBPR+)" labelWidth="w-24" />
              <FieldRow label="Date" value={formatDateLong(transaction.settlement_info.settlement_date)} labelWidth="w-24" />
            </div>

            {/* Subject */}
            <div className="mb-6">
              <div className="font-bold">SUBJECT: CONFIRMATION OF SUCCESSFUL SETTLEMENT</div>
              <div className="ml-16">SWIFT MX {transaction.message_type} - NOSTRO / VOSTRO MOVEMENT</div>
            </div>

            {/* Body */}
            <div className="mb-6 leading-relaxed">
              <p className="mb-4">
                We hereby confirm that the below-referenced financial institution credit
                transfer has been successfully processed, acknowledged, and settled through
                the SWIFT Global Network in accordance with CBPR+ standards.
              </p>
              <p>
                The transaction was active on the SWIFT Global Server and has now been
                successfully moved into the respective Nostro/Vostro accounts without any
                exception, rejection, or compliance hold.
              </p>
            </div>

            {/* Transaction References */}
            <div className="mb-6">
              <div className="font-bold border-b border-gray-400 pb-1 mb-2">TRANSACTION REFERENCES</div>
              <FieldRow label="Message Type" value={transaction.message_type} />
              <FieldRow label="Business Service" value={transaction.business_service} />
              <FieldRow label="Message Identification" value={messageId} mono />
              <FieldRow label="Instruction Identification" value={`INST${trn}`} mono />
              <FieldRow label="End-To-End Identification" value={transaction.uetr.toUpperCase().replace(/-/g, '')} mono />
              <FieldRow label="MUR" value={`MUR${Date.now().toString().slice(-8)}`} mono />
              <FieldRow label="UETR" value={transaction.uetr} mono />
              <div className="mt-2" />
              <FieldRow label="SWIFT Reference" value={`SWIFT${trn.slice(-10)}`} mono />
              <FieldRow label="SWIFT Request Reference" value={`REQ${trn.slice(-12)}`} mono />
            </div>

            {/* Participating Institutions */}
            <div className="mb-6">
              <div className="font-bold border-b border-gray-400 pb-1 mb-2">PARTICIPATING INSTITUTIONS</div>
              <FieldRow label="Instructing Agent (Sender)" value={transaction.instructing_agent.bic} mono />
              <FieldRow label="Instructed Agent (Receiver)" value={transaction.instructed_agent.bic} mono />
            </div>

            {/* Settlement Confirmation */}
            <div className="mb-6">
              <div className="font-bold border-b border-gray-400 pb-1 mb-2">SETTLEMENT CONFIRMATION</div>
              <FieldRow label="Settlement Method" value={transaction.settlement_info.method} />
              <FieldRow label="Settlement Priority" value={transaction.settlement_info.priority} />
              <FieldRow label="Interbank Settlement Date" value={formatDateLong(transaction.settlement_info.settlement_date)} />
              <FieldRow label="Settlement Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
            </div>

            {/* Checkmarks */}
            <div className="mb-6">
              <CheckItem>Amount debited from sender Vostro account</CheckItem>
              <CheckItem>Amount credited to receiver Nostro account</CheckItem>
              <CheckItem>Network Acknowledgement received (ACK)</CheckItem>
              <CheckItem>Settlement completed at correspondent level</CheckItem>
            </div>

            {/* Underlying Customer Details */}
            <div className="mb-6">
              <div className="font-bold border-b border-gray-400 pb-1 mb-2">UNDERLYING CUSTOMER DETAILS</div>
              <FieldRow label="Debtor" value={transaction.debtor.name} />
              <FieldRow label="Debtor Account (IBAN)" value={transaction.debtor.iban} mono />
              <FieldRow label="Creditor" value={transaction.creditor.name} />
              <FieldRow label="Creditor Account (IBAN)" value={transaction.creditor.iban || 'N/A'} mono />
              <FieldRow label="Remittance Information" value={transaction.remittance_info} />
            </div>

            {/* Final Confirmation */}
            <div className="mb-6">
              <div className="font-bold border-b border-gray-400 pb-1 mb-2">FINAL CONFIRMATION</div>
              <p className="leading-relaxed">
                We confirm that this transaction is FINAL and SETTLED. No further action is
                required from your side. The payment is fully reflected in the Nostro/Vostro
                ledger positions of the respective correspondent banks.
              </p>
            </div>

            {/* Signature */}
            <div className="mt-8">
              <div className="font-bold">AUTHORIZED SIGN-OFF</div>
              <div>Operations & Settlement Desk</div>
              <div>SWIFT Alliance Environment</div>
              <div className="text-gray-600">(Computer Generated - No Manual Signature Required)</div>
            </div>

            <div className="mt-8 pt-4 border-t-2 border-gray-800 text-center font-bold">
              END OF CONFIRMATION LETTER
            </div>
          </div>
        </TabsContent>

        {/* SWIFT Payment Confirmation Copy */}
        <TabsContent value="confirmation" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <div className="flex items-center gap-2 mb-4"><img src="/iso-logo.png" alt="ISO 20022" className="w-8 h-8 object-contain" /><span className="font-bold text-[#DB0011]">ISO 20022</span></div>
            <div className="border-2 border-gray-800 p-4 mb-6 text-center">
              <div className="font-bold text-sm">SWIFT PAYMENT CONFIRMATION COPY</div>
              <div className="text-gray-600">(CORRESPONDENT / NOSTRO SETTLEMENT CONFIRMATION)</div>
            </div>

            {/* Message Type */}
            <div className="text-gray-600 mb-4 border-b border-gray-300 pb-2">
              [ MESSAGE TYPE ] {formatDateLong(transaction.created_at)} {formatDateTime(transaction.created_at).split(' ')[1]} CET
            </div>

            {/* Basic Info */}
            <div className="mb-6 border-b border-gray-300 pb-4">
              <FieldRow label="SWIFT MX" value={transaction.message_type} />
              <FieldRow label="Business Service" value={transaction.business_service} />
              <FieldRow label="CBPR+ Compliance" value="CONFIRMED" />
            </div>

            {/* Transaction References */}
            <div className="mb-6">
              <div className="text-gray-500 mb-2">[ TRANSACTION REFERENCES ]</div>
              <div className="border-t border-b border-gray-300 py-2">
                <FieldRow label="Message Identification" value={messageId} mono />
                <FieldRow label="Instruction ID" value={`INST${trn}`} mono />
                <FieldRow label="End-To-End ID" value={transaction.uetr.toUpperCase().replace(/-/g, '')} mono />
                <FieldRow label="MUR" value={`MUR${Date.now().toString().slice(-8)}`} mono />
                <FieldRow label="UETR" value={transaction.uetr} mono />
                <FieldRow label="SWIFT Reference" value={`SWIFT${trn.slice(-10)}`} mono />
                <FieldRow label="SWIFT Request Reference" value={`REQ${trn.slice(-12)}`} mono />
              </div>
            </div>

            {/* Participating Banks */}
            <div className="mb-6">
              <div className="text-gray-500 mb-2">[ PARTICIPATING BANKS ]</div>
              <div className="border-t border-b border-gray-300 py-2">
                <FieldRow label="Sender Bank" value={transaction.instructing_agent.name} />
                <FieldRow label="Sender BIC" value={transaction.instructing_agent.bic} mono />
                <div className="mt-2" />
                <FieldRow label="Receiver / Beneficiary" value={transaction.instructed_agent.name} />
                <FieldRow label="Beneficiary Bank BIC" value={transaction.instructed_agent.bic} mono />
                <div className="mt-2" />
                <FieldRow label="Correspondent Network" value="SWIFT GLOBAL SERVER" />
              </div>
            </div>

            {/* Settlement Details */}
            <div className="mb-6">
              <div className="text-gray-500 mb-2">[ SETTLEMENT DETAILS ]</div>
              <div className="border-t border-b border-gray-300 py-2">
                <FieldRow label="Settlement Method" value={transaction.settlement_info.method} />
                <FieldRow label="Settlement Priority" value={transaction.settlement_info.priority} />
                <FieldRow label="Interbank Settle Date" value={formatDateLong(transaction.settlement_info.settlement_date).toUpperCase().replace(/ /g, '-')} />
                <FieldRow label="Settlement Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
              </div>
            </div>

            {/* Nostro/Vostro Status */}
            <div className="mb-6">
              <div className="text-gray-500 mb-2">[ NOSTRO / VOSTRO STATUS ]</div>
              <div className="border-t border-b border-gray-300 py-2">
                <FieldRow label="CURRENT STATUS" value="CREDITED TO RECEIVER NOSTRO ACCOUNT" />
              </div>
            </div>

            {/* Green Checkmarks */}
            <div className="mb-6">
              <CheckItem color="green">Funds are CONFIRMED in the NOSTRO account of the BENEFICIARY BANK</CheckItem>
              <CheckItem color="green">Payment is READY FOR FINAL SETTLEMENT</CheckItem>
              <CheckItem color="green">Funds AVAILABLE FOR CREDIT to BENEFICIARY CUSTOMER ACCOUNT</CheckItem>
              <CheckItem color="green">No HOLD / NO RETURN / NO RECALL FLAGGED</CheckItem>
            </div>

            {/* Multi-Level Confirmations */}
            <div className="mb-6">
              <div className="text-gray-500 mb-2">[ MULTI-LEVEL CONFIRMATIONS ]</div>
              <div className="border-t border-b border-gray-300 py-2">
                <div className="flex items-center gap-2 py-0.5">
                  <Check className="w-4 h-4 text-gray-700" />
                  <span className="w-56">Sender Bank Confirmation</span>
                  <span>: MX PLATFORM - CONFIRMED</span>
                </div>
                <div className="flex items-center gap-2 py-0.5">
                  <Check className="w-4 h-4 text-gray-700" />
                  <span className="w-56">SWIFT Network ACK</span>
                  <span>: CONFIRMED</span>
                </div>
                <div className="flex items-center gap-2 py-0.5">
                  <Check className="w-4 h-4 text-gray-700" />
                  <span className="w-56">Correspondent Bank Confirmation</span>
                  <span>: CONFIRMED</span>
                </div>
                <div className="flex items-center gap-2 py-0.5">
                  <Check className="w-4 h-4 text-gray-700" />
                  <span className="w-56">Global SWIFT Server Status</span>
                  <span>: ACTIVE & CONFIRMED</span>
                </div>
              </div>
              <p className="mt-2 text-gray-700">
                The SWIFT Global Server confirms that the transaction is currently positioned
                in the NOSTRO account of the beneficiary bank and is fully cleared at the
                correspondent level.
              </p>
            </div>

            {/* Global Tracking */}
            <div className="mb-6">
              <div className="text-gray-500 mb-2">[ GLOBAL TRACKING & IP VERIFICATION ]</div>
              <div className="border-t border-gray-300 pt-2">
                <FieldRow label="Tracking Purpose" value="Settlement & Ledger Confirmation" />
                <FieldRow label="Tracking Result" value="SUCCESSFUL" />
                <FieldRow label="Country Used" value={transaction.debtor.country} />
              </div>
              
              {/* IP Table */}
              <table className="w-full border border-gray-400 mt-4 text-center">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="border-r border-gray-400 p-2">#</th>
                    <th className="border-r border-gray-400 p-2">IP ADDRESS</th>
                    <th className="border-r border-gray-400 p-2">LOCATION</th>
                    <th className="p-2">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td className="border-r border-gray-400 p-2">01</td>
                    <td className="border-r border-gray-400 p-2">192.168.xxx.xxx</td>
                    <td className="border-r border-gray-400 p-2">Frankfurt, DE</td>
                    <td className="p-2">SUCCESS</td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="border-r border-gray-400 p-2">02</td>
                    <td className="border-r border-gray-400 p-2">10.0.xxx.xxx</td>
                    <td className="border-r border-gray-400 p-2">SWIFT Server</td>
                    <td className="p-2">SUCCESS</td>
                  </tr>
                  <tr>
                    <td className="border-r border-gray-400 p-2">03</td>
                    <td className="border-r border-gray-400 p-2">172.16.xxx.xxx</td>
                    <td className="border-r border-gray-400 p-2">{transaction.creditor.country}</td>
                    <td className="p-2">SUCCESS</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Final Confirmation */}
            <div className="mb-6">
              <div className="text-gray-500 mb-2">[ FINAL SWIFT CONFIRMATION ]</div>
              <div className="border-t border-gray-300 pt-2">
                <p className="leading-relaxed mb-4">
                  This SWIFT payment has been fully PROCESSED, ACKNOWLEDGED, and SETTLED at the
                  correspondent banking level. Funds are CONFIRMED in the NOSTRO account of the
                  beneficiary bank and are READY FOR IMMEDIATE CREDIT to the beneficiary customer
                  account without restriction.
                </p>
                <FieldRow label="SYSTEM STATUS" value="FINALIZED" />
                <FieldRow label="REVERSAL POSSIBILITY" value="NONE" />
                <FieldRow label="MANUAL INTERVENTION" value="NOT REQUIRED" />
              </div>
            </div>

            {/* Stamp */}
            <div className="flex justify-end mt-8">
              <div className="border-2 border-green-600 text-green-600 px-6 py-3 transform rotate-[-5deg]">
                <div className="font-bold text-center">PAYMENT APPROVED</div>
                <div className="text-xs text-center mt-1">{formatDate(new Date().toISOString())}</div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t-2 border-gray-800 text-center font-bold">
              END OF SWIFT CONFIRMATION COPY
            </div>
          </div>
        </TabsContent>

        {/* MT910 Credit Confirmation */}
        <TabsContent value="mt910" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            {/* Barcode */}
            <Barcode value={`MT910-${transaction.uetr}`} />
            
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-gray-300 pb-4 mb-6">
              <div className="flex items-center gap-4">
                <img src="/iso-logo.png" alt="ISO 20022" className="w-10 h-10 object-contain" />
                <div>
                  <span className="text-2xl font-bold text-[#DB0011]">ISO 20022</span>
                  <span className="text-gray-500 ml-2">SWIFT Platform</span>
                </div>
              </div>
              <div className="text-center flex-1">
                <h1 className="text-lg font-bold tracking-wider">MT910 - CONFIRMATION OF CREDIT</h1>
                <p className="text-xs text-gray-500 mt-1">Nostro Account Credit Notification</p>
              </div>
              <img src="/swift-logo.png" alt="SWIFT" className="h-8 w-auto object-contain" />
            </div>

            {/* Credit Summary */}
            <div className="bg-green-50 border-2 border-green-600 p-6 mb-6 text-center">
              <div className="text-sm text-green-700 font-medium">CREDIT CONFIRMED</div>
              <div className="text-4xl font-bold text-green-800 mt-2">
                {transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)}
              </div>
              <div className="text-sm text-green-600 mt-2">
                Credited to Nostro Account on {formatDateLong(transaction.settlement_info.settlement_date)}
              </div>
            </div>

            {/* Message Details */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <FieldRow label="Message Type" value="MT910 - CONFIRMATION OF CREDIT" />
                <FieldRow label="Sender" value={transaction.instructed_agent.bic} mono />
                <FieldRow label="Receiver" value={transaction.instructing_agent.bic} mono />
                <FieldRow label="Message Reference" value={`MT910${trn.slice(-8)}`} mono />
                <FieldRow label="Related Reference" value={trn} mono />
                <FieldRow label="UETR" value={transaction.uetr} mono />
              </div>
              <div className="ml-8">
                <QRCode value={`MT910-${transaction.uetr}`} size={90} />
              </div>
            </div>

            <SectionHeader title="SWIFT MT910 MESSAGE FIELDS" />

            {/* MT910 Fields */}
            <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
              <SwiftField tag="20" label="TRANSACTION REFERENCE NUMBER">
                {`MT910${trn.slice(-8)}`}
              </SwiftField>
              <SwiftField tag="21" label="RELATED REFERENCE">
                {trn}
              </SwiftField>
              <SwiftField tag="25" label="ACCOUNT IDENTIFICATION">
                {transaction.debtor.iban}
              </SwiftField>
              <SwiftField tag="32A" label="VALUE DATE, CURRENCY CODE, AMOUNT">
{`${transaction.settlement_info.settlement_date.replace(/-/g, '')}
${transaction.settlement_info.currency}${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`}
              </SwiftField>
              <SwiftField tag="52A" label="ORDERING INSTITUTION">
{`${transaction.instructed_agent.bic}
${transaction.instructed_agent.name}`}
              </SwiftField>
              <SwiftField tag="56A" label="INTERMEDIARY">
                COBADEFFXXX
              </SwiftField>
              <SwiftField tag="72" label="SENDER TO RECEIVER INFORMATION">
{`/REC/NOSTRO CREDIT CONFIRMATION
/REF/${transaction.uetr}
/INF/CREDIT APPLIED TO YOUR ACCOUNT`}
              </SwiftField>
            </div>

            {/* Account Details */}
            <SectionHeader title="ACCOUNT DETAILS" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 border border-gray-200 p-4">
                <div className="font-bold text-gray-700 mb-2">NOSTRO ACCOUNT</div>
                <FieldRow label="Account Holder" value={transaction.instructing_agent.name} />
                <FieldRow label="Account Number" value={transaction.debtor.iban} mono />
                <FieldRow label="Currency" value={transaction.settlement_info.currency} />
              </div>
              <div className="bg-green-50 border border-green-200 p-4">
                <div className="font-bold text-green-700 mb-2">CREDIT DETAILS</div>
                <FieldRow label="Credit Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
                <FieldRow label="Value Date" value={formatDateLong(transaction.settlement_info.settlement_date)} />
                <FieldRow label="Status" value="CREDITED" />
              </div>
            </div>

            {/* Ordering Customer */}
            <SectionHeader title="ORDERING PARTY DETAILS" />
            <div className="mb-6">
              <FieldRow label="Ordering Institution" value={transaction.instructed_agent.name} />
              <FieldRow label="BIC" value={transaction.instructed_agent.bic} mono />
              <FieldRow label="Original Debtor" value={transaction.debtor.name} />
              <FieldRow label="Remittance Info" value={transaction.remittance_info} />
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center">
              <div className="font-bold">MT910 - CONFIRMATION OF CREDIT</div>
              <div className="text-gray-500 text-xs mt-1">
                Generated: {formatDateTime(new Date().toISOString())} | Reference: MT910{trn.slice(-8)}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* MT900 Debit Confirmation */}
        <TabsContent value="mt900" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            {/* Barcode */}
            <Barcode value={`MT900-${transaction.uetr}`} />
            
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-gray-300 pb-4 mb-6">
              <div className="flex items-center gap-4">
                <img src="/iso-logo.png" alt="ISO 20022" className="w-10 h-10 object-contain" />
                <div>
                  <span className="text-2xl font-bold text-[#DB0011]">ISO 20022</span>
                  <span className="text-gray-500 ml-2">SWIFT Platform</span>
                </div>
              </div>
              <div className="text-center flex-1">
                <h1 className="text-lg font-bold tracking-wider">MT900 - CONFIRMATION OF DEBIT</h1>
                <p className="text-xs text-gray-500 mt-1">Vostro Account Debit Notification</p>
              </div>
              <img src="/swift-logo.png" alt="SWIFT" className="h-8 w-auto object-contain" />
            </div>

            {/* Debit Summary */}
            <div className="bg-red-50 border-2 border-red-600 p-6 mb-6 text-center">
              <div className="text-sm text-red-700 font-medium">DEBIT CONFIRMED</div>
              <div className="text-4xl font-bold text-red-800 mt-2">
                {transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)}
              </div>
              <div className="text-sm text-red-600 mt-2">
                Debited from Vostro Account on {formatDateLong(transaction.settlement_info.settlement_date)}
              </div>
            </div>

            {/* Message Details */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <FieldRow label="Message Type" value="MT900 - CONFIRMATION OF DEBIT" />
                <FieldRow label="Sender" value={transaction.instructing_agent.bic} mono />
                <FieldRow label="Receiver" value={transaction.instructed_agent.bic} mono />
                <FieldRow label="Message Reference" value={`MT900${trn.slice(-8)}`} mono />
                <FieldRow label="Related Reference" value={trn} mono />
                <FieldRow label="UETR" value={transaction.uetr} mono />
              </div>
              <div className="ml-8">
                <QRCode value={`MT900-${transaction.uetr}`} size={90} />
              </div>
            </div>

            <SectionHeader title="SWIFT MT900 MESSAGE FIELDS" />

            {/* MT900 Fields */}
            <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
              <SwiftField tag="20" label="TRANSACTION REFERENCE NUMBER">
                {`MT900${trn.slice(-8)}`}
              </SwiftField>
              <SwiftField tag="21" label="RELATED REFERENCE">
                {trn}
              </SwiftField>
              <SwiftField tag="25" label="ACCOUNT IDENTIFICATION">
                {transaction.debtor.iban}
              </SwiftField>
              <SwiftField tag="32A" label="VALUE DATE, CURRENCY CODE, AMOUNT">
{`${transaction.settlement_info.settlement_date.replace(/-/g, '')}
${transaction.settlement_info.currency}${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`}
              </SwiftField>
              <SwiftField tag="52A" label="ORDERING INSTITUTION">
{`${transaction.instructing_agent.bic}
${transaction.instructing_agent.name}`}
              </SwiftField>
              <SwiftField tag="72" label="SENDER TO RECEIVER INFORMATION">
{`/REC/VOSTRO DEBIT CONFIRMATION
/REF/${transaction.uetr}
/INF/YOUR ACCOUNT HAS BEEN DEBITED`}
              </SwiftField>
            </div>

            {/* Account Details */}
            <SectionHeader title="ACCOUNT DETAILS" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 border border-gray-200 p-4">
                <div className="font-bold text-gray-700 mb-2">VOSTRO ACCOUNT</div>
                <FieldRow label="Account Holder" value={transaction.instructed_agent.name} />
                <FieldRow label="Account Number" value={transaction.debtor.iban} mono />
                <FieldRow label="Currency" value={transaction.settlement_info.currency} />
              </div>
              <div className="bg-red-50 border border-red-200 p-4">
                <div className="font-bold text-red-700 mb-2">DEBIT DETAILS</div>
                <FieldRow label="Debit Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
                <FieldRow label="Value Date" value={formatDateLong(transaction.settlement_info.settlement_date)} />
                <FieldRow label="Status" value="DEBITED" />
              </div>
            </div>

            {/* Beneficiary Details */}
            <SectionHeader title="BENEFICIARY DETAILS" />
            <div className="mb-6">
              <FieldRow label="Beneficiary Bank" value={transaction.instructed_agent.name} />
              <FieldRow label="BIC" value={transaction.instructed_agent.bic} mono />
              <FieldRow label="Ultimate Beneficiary" value={transaction.creditor.name} />
              <FieldRow label="Remittance Info" value={transaction.remittance_info} />
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center">
              <div className="font-bold">MT900 - CONFIRMATION OF DEBIT</div>
              <div className="text-gray-500 text-xs mt-1">
                Generated: {formatDateTime(new Date().toISOString())} | Reference: MT900{trn.slice(-8)}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* MT945 Customer Statement Message */}
        <TabsContent value="mt940" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            {/* Barcode */}
            <Barcode value={`MT945-${transaction.uetr}`} />
            
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-gray-300 pb-4 mb-6">
              <div className="flex items-center gap-4">
                <img src="/iso-logo.png" alt="ISO 20022" className="w-10 h-10 object-contain" />
                <div>
                  <span className="text-2xl font-bold text-[#DB0011]">ISO 20022</span>
                  <span className="text-gray-500 ml-2">SWIFT Platform</span>
                </div>
              </div>
              <div className="text-center flex-1">
                <h1 className="text-lg font-bold tracking-wider">MT945 - CUSTOMER STATEMENT MESSAGE</h1>
                <p className="text-xs text-gray-500 mt-1">Statement for Customer Advice</p>
              </div>
              <img src="/swift-logo.png" alt="SWIFT" className="h-8 w-auto object-contain" />
            </div>

            {/* Statement Header */}
            <div className="bg-gray-100 border border-gray-300 p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldRow label="Statement Number" value={`STM${Date.now().toString().slice(-8)}/1`} mono />
                  <FieldRow label="Statement Date" value={formatDateLong(new Date().toISOString())} />
                  <FieldRow label="Account" value={transaction.debtor.iban} mono />
                </div>
                <div className="flex justify-end">
                  <QRCode value={`MT945-${transaction.uetr}`} size={80} />
                </div>
              </div>
            </div>

            <SectionHeader title="ACCOUNT IDENTIFICATION" />
            <div className="mb-6">
              <FieldRow label="Account Owner" value={transaction.debtor.name} />
              <FieldRow label="Account Number" value={transaction.debtor.iban} mono />
              <FieldRow label="Currency" value={transaction.settlement_info.currency} />
              <FieldRow label="Account Type" value="CURRENT ACCOUNT" />
            </div>

            <SectionHeader title="STATEMENT LINES" />
            {/* Transaction Entry */}
            <div className="border border-gray-300 mb-6">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left border-b border-gray-300">Value Date</th>
                    <th className="p-2 text-left border-b border-gray-300">Entry Date</th>
                    <th className="p-2 text-left border-b border-gray-300">D/C</th>
                    <th className="p-2 text-right border-b border-gray-300">Amount</th>
                    <th className="p-2 text-left border-b border-gray-300">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border-b border-gray-200">{formatDate(transaction.settlement_info.settlement_date)}</td>
                    <td className="p-2 border-b border-gray-200">{formatDate(transaction.created_at)}</td>
                    <td className="p-2 border-b border-gray-200">
                      <span className="text-red-600 font-bold">D</span>
                    </td>
                    <td className="p-2 border-b border-gray-200 text-right font-mono">
                      {transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)}
                    </td>
                    <td className="p-2 border-b border-gray-200 font-mono text-xs">{trn}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Transaction Details */}
            <SectionHeader title="TRANSACTION INFORMATION" />
            <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
              <SwiftField tag="61" label="STATEMENT LINE">
{`${transaction.settlement_info.settlement_date.replace(/-/g, '').slice(2)}${transaction.settlement_info.settlement_date.replace(/-/g, '').slice(2)}D${transaction.settlement_info.currency}${formatAmount(transaction.settlement_info.interbank_settlement_amount)}NTRF${trn}
//${transaction.uetr}`}
              </SwiftField>
              <SwiftField tag="86" label="INFORMATION TO ACCOUNT OWNER">
{`TRANSFER TO ${transaction.creditor.name}
IBAN: ${transaction.creditor.iban || 'N/A'}
REF: ${transaction.remittance_info}
UETR: ${transaction.uetr}`}
              </SwiftField>
            </div>

            {/* Balance Information */}
            <SectionHeader title="BALANCE INFORMATION" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 border border-gray-200 p-4">
                <div className="font-bold text-gray-700 mb-2">OPENING BALANCE</div>
                <SwiftField tag="60F" label="FIRST OPENING BALANCE">
{`C${transaction.settlement_info.settlement_date.replace(/-/g, '').slice(2)}${transaction.settlement_info.currency}${formatAmount(456889621000.94 + transaction.settlement_info.interbank_settlement_amount)}`}
                </SwiftField>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4">
                <div className="font-bold text-blue-700 mb-2">CLOSING BALANCE</div>
                <SwiftField tag="62F" label="FINAL CLOSING BALANCE">
{`C${transaction.settlement_info.settlement_date.replace(/-/g, '').slice(2)}${transaction.settlement_info.currency}${formatAmount(456889621000.94)}`}
                </SwiftField>
              </div>
            </div>

            {/* Available Balance */}
            <div className="bg-green-50 border border-green-300 p-4 mb-6">
              <div className="font-bold text-green-700 mb-2">AVAILABLE BALANCE</div>
              <SwiftField tag="64" label="CLOSING AVAILABLE BALANCE">
{`C${transaction.settlement_info.settlement_date.replace(/-/g, '').slice(2)}${transaction.settlement_info.currency}${formatAmount(456889621000.94)}`}
              </SwiftField>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center">
              <div className="font-bold">MT945 - CUSTOMER STATEMENT MESSAGE</div>
              <div className="text-gray-500 text-xs mt-1">
                Generated: {formatDateTime(new Date().toISOString())} | Statement: STM{Date.now().toString().slice(-8)}/1
              </div>
              <div className="text-gray-400 text-xs mt-2">
                This statement is for customer advice only.
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Global Payment Status Statement - Dark Theme */}
        <TabsContent value="status" className="mt-4">
          <div className="bg-gray-900 border border-gray-700 shadow-lg font-mono text-xs text-gray-300 p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            {/* Header Box */}
            <div className="border-2 border-red-600 p-4 mb-6 text-center">
              <div className="font-bold text-sm text-red-500">GLOBAL PAYMENT STATUS STATEMENT</div>
              <div className="text-red-400">(SWIFT MX - {transaction.message_type} CONFIRMATION)</div>
            </div>

            {/* System Info */}
            <div className="mb-6">
              <FieldRow label="SYSTEM SOURCE" value="SWIFT ALLIANCE MESSAGE MANAGEMENT (SAAPROD)" dark />
              <FieldRow label="APPLICATION" value="Alliance Message Management" dark />
              <FieldRow label="REPORT TYPE" value="Instance Search - Detailed Report" dark />
              <FieldRow label="REPORT STATUS" value="VERIFIED" dark />
              <FieldRow label="NETWORK STATUS" value="NETWORK ACK (SUCCESSFUL)" dark />
            </div>

            {/* Global Server Status */}
            <SectionHeader title="GLOBAL SERVER STATUS" dark />
            <div className="mb-6">
              <p className="mb-4 leading-relaxed">
                The referenced transaction was successfully processed on the SWIFT Global
                Server. The message was acknowledged by SWIFTNet and cleared under standard
                CBPR+ settlement routing.
              </p>
              <div className="mb-2">Current Status:</div>
              <CheckItem color="green">ACTIVE ON GLOBAL SWIFT SERVER</CheckItem>
              <CheckItem color="green">SUCCESSFULLY MOVED INTO NOSTRO / VOSTRO ACCOUNT</CheckItem>
              <CheckItem color="green">SETTLEMENT FLOW COMPLETED AT CORRESPONDENT LEVEL</CheckItem>
            </div>

            {/* Message Identification Details */}
            <SectionHeader title="MESSAGE IDENTIFICATION DETAILS" dark />
            <div className="mb-6">
              <FieldRow label="Message Type" value={transaction.message_type} dark />
              <FieldRow label="Business Service" value={transaction.business_service} dark />
              <FieldRow label="Message Input Reference" value={`REF${trn.slice(-10)}`} mono dark />
              <FieldRow label="Message Identification" value={messageId} mono dark />
              <FieldRow label="Instruction Identification" value={`INST${trn}`} mono dark />
              <FieldRow label="End-To-End Identification" value={transaction.uetr.toUpperCase().replace(/-/g, '').slice(0, 20)} mono dark />
              <div className="mt-2" />
              <FieldRow label="SWIFT Reference" value={`SWIFT${trn.slice(-10)}`} mono dark />
              <FieldRow label="SWIFT Request Reference" value={`REQ${trn.slice(-12)}`} mono dark />
              <FieldRow label="MUR" value={`MUR${Date.now().toString().slice(-8)}`} mono dark />
              <FieldRow label="UETR" value={transaction.uetr} mono dark />
              <div className="mt-2" />
              <FieldRow label="Store & Forward Input Time" value={formatDateTime(transaction.created_at).replace('Z', '')} mono dark />
              <FieldRow label="Creation Date & Time" value={`${transaction.created_at}`} mono dark />
            </div>

            {/* Participating Financial Institutions */}
            <SectionHeader title="PARTICIPATING FINANCIAL INSTITUTIONS" dark />
            <div className="mb-6">
              <div className="mb-2 text-gray-400">Instructing Agent (Sender)</div>
              <FieldRow label="Bank BIC" value={transaction.instructing_agent.bic} mono dark />
              <div className="mt-4 mb-2 text-gray-400">Instructed Agent (Receiver)</div>
              <FieldRow label="Bank BIC" value={transaction.instructed_agent.bic} mono dark />
            </div>

            {/* Nostro/Vostro Movement Confirmation */}
            <SectionHeader title="NOSTRO / VOSTRO MOVEMENT CONFIRMATION" dark />
            <div className="mb-6">
              <FieldRow label="Settlement Method" value={transaction.settlement_info.method} dark />
              <FieldRow label="Settlement Priority" value={transaction.settlement_info.priority} dark />
              <FieldRow label="Interbank Settlement Date" value={transaction.settlement_info.settlement_date} dark />
              <FieldRow label="Interbank Settlement Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono dark />
              <div className="mt-4 mb-2 text-gray-400">The above amount has been:</div>
              <CheckItem color="green">DEBITED from the Sender's VOSTRO account</CheckItem>
              <CheckItem color="green">CREDITED into the Receiver's NOSTRO account</CheckItem>
              <CheckItem color="green">CONFIRMED under SWIFT Network Acknowledgement</CheckItem>
            </div>

            {/* Underlying Transaction Details */}
            <SectionHeader title="UNDERLYING TRANSACTION DETAILS" dark />
            <div className="mb-6">
              <FieldRow label="Debtor Name" value={transaction.debtor.name} dark />
              <FieldRow label="Debtor Account (IBAN)" value={transaction.debtor.iban} mono dark />
              <div className="mt-2" />
              <FieldRow label="Creditor Name" value={transaction.creditor.name} dark />
              <FieldRow label="Creditor Account (IBAN)" value={transaction.creditor.iban || 'N/A'} mono dark />
              <div className="mt-2" />
              <FieldRow label="Remittance Information" value={transaction.remittance_info} dark />
            </div>

            {/* Final System Confirmation */}
            <SectionHeader title="FINAL SYSTEM CONFIRMATION" dark />
            <div className="mb-6">
              <p className="mb-4 leading-relaxed">
                This payment is CURRENT on the SWIFT Global Server and has been successfully
                routed, acknowledged, and settled. The transaction is fully reflected within
                the Nostro/Vostro ledger positions of the respective correspondent banks.
              </p>
              <p className="mb-4">
                No rejection, repair, or compliance hold is recorded against this message.
              </p>
            </div>

            {/* System Footer */}
            <SectionHeader title="SYSTEM FOOTER" dark />
            <div className="mb-6">
              <FieldRow label="Alliance Server Instance" value="SAAPROD" dark />
              <FieldRow label="Operator" value="SYSTEM" dark />
              <FieldRow label="Report Generated" value={`${formatDate(new Date().toISOString())} - ${new Date().toLocaleTimeString()}`} dark />
              <FieldRow label="CONFIDENTIAL" value="© SWIFT - Alliance Access System v2.5.4" dark />
            </div>

            <div className="mt-8 pt-4 border-t-2 border-red-600 text-center font-bold text-red-500">
              END OF STATEMENT
            </div>
          </div>
        </TabsContent>

        {/* Server Report Tab */}
        <TabsContent value="server" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-gray-300 pb-4 mb-6">
              <div className="flex items-center gap-4">
                <img src="/iso-logo.png" alt="ISO 20022" className="w-10 h-10 object-contain" />
                <div>
                  <span className="text-2xl font-bold text-[#DB0011]">ISO 20022</span>
                  <span className="text-gray-500 ml-2">SWIFT Platform</span>
                </div>
              </div>
              <div className="text-center flex-1">
                <h1 className="text-lg font-bold tracking-wider">SWIFT SERVER PROCESSING REPORT</h1>
                <p className="text-xs text-gray-500 mt-1">Transaction Audit & Validation Report</p>
              </div>
              <img src="/swift-logo.png" alt="SWIFT" className="h-8 w-auto object-contain" />
            </div>

            {/* Report Header */}
            <div className="bg-gray-100 border border-gray-300 p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldRow label="Report ID" value={`RPT-${transaction.id.slice(0, 8).toUpperCase()}`} mono />
                  <FieldRow label="Report Type" value="SWIFT_SERVER_PROCESSING_REPORT" />
                  <FieldRow label="Generated" value={formatDateTime(new Date().toISOString())} mono />
                </div>
                <div className="flex justify-end">
                  <QRCode value={`RPT-${transaction.uetr}`} size={80} />
                </div>
              </div>
            </div>

            {/* Transaction Summary */}
            <SectionHeader title="TRANSACTION SUMMARY" />
            <div className="mb-6">
              <FieldRow label="Transaction ID" value={transaction.id} mono />
              <FieldRow label="UETR" value={transaction.uetr} mono />
              <FieldRow label="Message Type" value={transaction.message_type} />
              <FieldRow label="Status" value={transaction.status} />
              <FieldRow label="Tracking Result" value={transaction.tracking_result} />
            </div>

            {/* Server Details */}
            <SectionHeader title="SERVER DETAILS" />
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <FieldRow label="Server Name" value="SWIFT_GLOBAL_SERVER_EU" />
                <FieldRow label="Server Location" value="Frankfurt, Germany" />
              </div>
              <div>
                <FieldRow label="Server Instance" value="SAAPROD" />
                <FieldRow label="Alliance Version" value="7.5.4" />
              </div>
            </div>

            {/* Processing Timeline */}
            <SectionHeader title="PROCESSING TIMELINE" />
            <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 w-1/3">Event</th>
                    <th className="text-left py-2">Timestamp</th>
                    <th className="text-center py-2 w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2">MESSAGE_RECEIVED</td>
                    <td className="py-2 font-mono">{transaction.created_at}</td>
                    <td className="py-2 text-center"><span className="text-green-600 font-bold">✓ SUCCESS</span></td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2">VALIDATION_STARTED</td>
                    <td className="py-2 font-mono">{transaction.created_at}</td>
                    <td className="py-2 text-center"><span className="text-green-600 font-bold">✓ SUCCESS</span></td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2">VALIDATION_COMPLETED</td>
                    <td className="py-2 font-mono">{transaction.created_at}</td>
                    <td className="py-2 text-center"><span className="text-green-600 font-bold">✓ SUCCESS</span></td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2">ROUTING_INITIATED</td>
                    <td className="py-2 font-mono">{transaction.created_at}</td>
                    <td className="py-2 text-center"><span className="text-green-600 font-bold">✓ SUCCESS</span></td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2">SETTLEMENT_INITIATED</td>
                    <td className="py-2 font-mono">{transaction.created_at}</td>
                    <td className="py-2 text-center"><span className="text-green-600 font-bold">✓ SUCCESS</span></td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2">SETTLEMENT_COMPLETED</td>
                    <td className="py-2 font-mono">{transaction.updated_at}</td>
                    <td className="py-2 text-center"><span className="text-green-600 font-bold">✓ SUCCESS</span></td>
                  </tr>
                  <tr>
                    <td className="py-2">ACK_GENERATED</td>
                    <td className="py-2 font-mono">{transaction.updated_at}</td>
                    <td className="py-2 text-center"><span className="text-green-600 font-bold">✓ SUCCESS</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Validation Results */}
            <SectionHeader title="VALIDATION RESULTS" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 p-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">Syntax Validation</span>
                </div>
                <span className="text-green-600 ml-6">PASSED</span>
              </div>
              <div className="bg-green-50 border border-green-200 p-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">Semantic Validation</span>
                </div>
                <span className="text-green-600 ml-6">PASSED</span>
              </div>
              <div className="bg-green-50 border border-green-200 p-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">Business Validation</span>
                </div>
                <span className="text-green-600 ml-6">PASSED</span>
              </div>
              <div className="bg-green-50 border border-green-200 p-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">Compliance Check</span>
                </div>
                <span className="text-green-600 ml-6">PASSED</span>
              </div>
              <div className="bg-green-50 border border-green-200 p-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">Sanctions Screening</span>
                </div>
                <span className="text-green-600 ml-6">CLEARED</span>
              </div>
              <div className="bg-green-50 border border-green-200 p-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">Duplicate Check</span>
                </div>
                <span className="text-green-600 ml-6">NO_DUPLICATE</span>
              </div>
            </div>

            {/* Network Status */}
            <SectionHeader title="NETWORK STATUS" />
            <div className="mb-6">
              <FieldRow label="SWIFT Network ACK" value={transaction.network_ack ? "RECEIVED" : "PENDING"} />
              <FieldRow label="Correspondent ACK" value="RECEIVED" />
              <FieldRow label="Beneficiary ACK" value={transaction.tracking_result === 'SUCCESSFUL' ? "RECEIVED" : "PENDING"} />
            </div>

            {/* Settlement Confirmation */}
            <SectionHeader title="SETTLEMENT CONFIRMATION" />
            <div className="bg-gray-100 border border-gray-300 p-4 mb-6">
              <FieldRow label="Nostro Credited" value={transaction.nostro_credited ? "YES" : "NO"} />
              <FieldRow label="Vostro Debited" value={transaction.vostro_debited ? "YES" : "NO"} />
              <FieldRow label="Settlement Method" value={transaction.settlement_info.method} />
              <FieldRow label="Settlement Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center">
              <div className="font-bold">SWIFT SERVER PROCESSING REPORT</div>
              <div className="text-gray-500 text-xs mt-1">
                Report ID: RPT-{transaction.id.slice(0, 8).toUpperCase()} | Generated: {formatDateTime(new Date().toISOString())}
              </div>
              <div className="text-gray-400 text-xs mt-2">
                © ISO 20022 - SWIFT Alliance Access System v7.5.4
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Alliance Message Management Tab */}
        <TabsContent value="alliance" className="mt-4">
          <div className="bg-gray-900 border border-gray-700 shadow-lg font-mono text-xs text-gray-300 p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                <img src="/iso-logo.png" alt="ISO 20022" className="w-10 h-10 object-contain" />
                  <span className="text-xl font-bold text-[#DB0011]">ISO 20022</span>
                </div>
                <span className="text-gray-500">|</span>
                <span className="text-gray-400">Germany</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-gray-500">Alliance Message Management</div>
                  <div className="text-sm text-gray-300">Instance Search - Detailed Report</div>
                </div>
                <img src="/swift-logo.png" alt="SWIFT" className="h-10 w-auto object-contain" />
              </div>
            </div>

            {/* System Banner */}
            <div className="bg-gray-800 border border-gray-600 p-4 mb-6 text-center">
              <div className="text-lg font-bold text-white">SWIFT ALLIANCE MESSAGE MANAGEMENT</div>
              <div className="text-sm text-gray-400">SAAPROD - Production Instance</div>
            </div>

            {/* Report Info */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <div className="text-gray-500 mb-2">SYSTEM INFORMATION</div>
                <FieldRow label="System Source" value="SWIFT ALLIANCE MESSAGE MANAGEMENT (SAAPROD)" dark />
                <FieldRow label="Application" value="Alliance Message Management" dark />
                <FieldRow label="Report Type" value="Instance Search - Detailed Report" dark />
                <FieldRow label="Report Status" value="VERIFIED" dark />
                <FieldRow label="Network Status" value="NETWORK ACK (SUCCESSFUL)" dark />
              </div>
              <div className="flex justify-end">
                <QRCode value={`AMM-${transaction.uetr}`} size={100} />
              </div>
            </div>

            {/* Message Details Table */}
            <SectionHeader title="MESSAGE IDENTIFICATION" dark />
            <div className="bg-gray-800 border border-gray-600 mb-6">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="p-2 text-gray-500 w-48">Message Type</td>
                    <td className="p-2 text-gray-200">{transaction.message_type}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="p-2 text-gray-500">Business Service</td>
                    <td className="p-2 text-gray-200">{transaction.business_service}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="p-2 text-gray-500">Message Input Reference</td>
                    <td className="p-2 text-gray-200 font-mono">{`REF${trn.slice(-10)}`}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="p-2 text-gray-500">Message Identification</td>
                    <td className="p-2 text-gray-200 font-mono">{messageId}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="p-2 text-gray-500">Instruction Identification</td>
                    <td className="p-2 text-gray-200 font-mono">{`INST${trn}`}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="p-2 text-gray-500">End-To-End Identification</td>
                    <td className="p-2 text-gray-200 font-mono">{transaction.uetr.toUpperCase().replace(/-/g, '').slice(0, 20)}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="p-2 text-gray-500">UETR</td>
                    <td className="p-2 text-green-400 font-mono">{transaction.uetr}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="p-2 text-gray-500">MUR</td>
                    <td className="p-2 text-gray-200 font-mono">{`MUR${Date.now().toString().slice(-8)}`}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="p-2 text-gray-500">SWIFT Reference</td>
                    <td className="p-2 text-gray-200 font-mono">{`SWIFT${trn.slice(-10)}`}</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-gray-500">Creation Date/Time</td>
                    <td className="p-2 text-gray-200 font-mono">{transaction.created_at}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Institution Details */}
            <SectionHeader title="PARTICIPATING FINANCIAL INSTITUTIONS" dark />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 border border-gray-600 p-4">
                <div className="text-red-400 font-bold mb-2">INSTRUCTING AGENT (SENDER)</div>
                <FieldRow label="BIC" value={transaction.instructing_agent.bic} mono dark />
                <FieldRow label="Name" value={transaction.instructing_agent.name} dark />
                <FieldRow label="Country" value={transaction.instructing_agent.country} dark />
              </div>
              <div className="bg-gray-800 border border-gray-600 p-4">
                <div className="text-red-400 font-bold mb-2">INSTRUCTED AGENT (RECEIVER)</div>
                <FieldRow label="BIC" value={transaction.instructed_agent.bic} mono dark />
                <FieldRow label="Name" value={transaction.instructed_agent.name} dark />
                <FieldRow label="Country" value={transaction.instructed_agent.country} dark />
              </div>
            </div>

            {/* Settlement Info */}
            <SectionHeader title="SETTLEMENT INFORMATION" dark />
            <div className="bg-gray-800 border border-gray-600 p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldRow label="Settlement Method" value={transaction.settlement_info.method} dark />
                  <FieldRow label="Settlement Priority" value={transaction.settlement_info.priority} dark />
                  <FieldRow label="Settlement Date" value={transaction.settlement_info.settlement_date} dark />
                </div>
                <div>
                  <FieldRow label="Currency" value={transaction.settlement_info.currency} dark />
                  <FieldRow label="Amount" value={formatAmount(transaction.settlement_info.interbank_settlement_amount)} mono dark />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-2xl font-bold text-green-400">
                  {transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)}
                </div>
              </div>
            </div>

            {/* Account Movement */}
            <SectionHeader title="NOSTRO / VOSTRO ACCOUNT MOVEMENT" dark />
            <div className="mb-6">
              <div className="flex items-center gap-2 py-1">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-400">DEBITED from Sender's VOSTRO account</span>
              </div>
              <div className="flex items-center gap-2 py-1">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-400">CREDITED into Receiver's NOSTRO account</span>
              </div>
              <div className="flex items-center gap-2 py-1">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-400">Network Acknowledgement (ACK) RECEIVED</span>
              </div>
              <div className="flex items-center gap-2 py-1">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-400">Settlement COMPLETED at correspondent level</span>
              </div>
            </div>

            {/* Underlying Transaction */}
            <SectionHeader title="UNDERLYING TRANSACTION DETAILS" dark />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 border border-gray-600 p-4">
                <div className="text-red-400 font-bold mb-2">DEBTOR</div>
                <FieldRow label="Name" value={transaction.debtor.name} dark />
                <FieldRow label="IBAN" value={transaction.debtor.iban} mono dark />
                <FieldRow label="Country" value={transaction.debtor.country} dark />
              </div>
              <div className="bg-gray-800 border border-gray-600 p-4">
                <div className="text-red-400 font-bold mb-2">CREDITOR</div>
                <FieldRow label="Name" value={transaction.creditor.name} dark />
                <FieldRow label="IBAN" value={transaction.creditor.iban || 'N/A'} mono dark />
                <FieldRow label="Country" value={transaction.creditor.country} dark />
              </div>
            </div>

            {/* Remittance */}
            <div className="bg-gray-800 border border-gray-600 p-4 mb-6">
              <div className="text-gray-500 mb-1">REMITTANCE INFORMATION</div>
              <div className="text-gray-200">{transaction.remittance_info}</div>
            </div>

            {/* System Confirmation */}
            <SectionHeader title="SYSTEM CONFIRMATION" dark />
            <div className="bg-gray-800 border border-green-600 p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldRow label="System Status" value="FINALIZED" dark />
                  <FieldRow label="Tracking Result" value={transaction.tracking_result} dark />
                  <FieldRow label="CBPR+ Compliant" value={transaction.cbpr_compliant ? "YES" : "NO"} dark />
                </div>
                <div>
                  <FieldRow label="Reversal Possibility" value={transaction.reversal_possibility} dark />
                  <FieldRow label="Manual Intervention" value={transaction.manual_intervention} dark />
                  <FieldRow label="Network ACK" value={transaction.network_ack ? "RECEIVED" : "PENDING"} dark />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 pt-4 border-t border-gray-700">
              <div>Alliance Server Instance: SAAPROD | Operator: SYSTEM</div>
              <div>Report Generated: {formatDate(new Date().toISOString())} - {new Date().toLocaleTimeString()}</div>
              <div className="mt-2 text-xs">CONFIDENTIAL - © SWIFT Alliance Access System v2.5.4</div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-red-600 text-center font-bold text-red-500">
              END OF ALLIANCE MESSAGE REPORT
            </div>
          </div>
        </TabsContent>

        {/* MT202 COV Tab */}
        <TabsContent value="mt202" className="mt-4">
          <div ref={printRef} className="bg-white border border-gray-200 shadow-lg font-mono text-xs leading-relaxed" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <Barcode value={transaction.uetr} />
            <div className="px-8 pt-4">
              <DocumentHeader title="MT202 COV - COVER PAYMENT" subtitle="SWIFT FINANCIAL INSTITUTION TRANSFER" />
            </div>
            <div className="px-8 pb-8 text-xs" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <FieldRow label="TRN" value={trn} mono />
                  <FieldRow label="UETR" value={transaction.uetr} mono />
                  <FieldRow label="MESSAGE TYPE" value="MT202 COV - COVER PAYMENT" />
                  <FieldRow label="RELATED MT103" value={trn} mono />
                  <FieldRow label="SENDER'S SENDING TIME" value={formatDateTime(transaction.created_at)} mono />
                  <FieldRow label="VALUE DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
                  <FieldRow label="SETTLEMENT AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
                  <FieldRow label="CURRENCY" value={transaction.settlement_info.currency} />
                  <FieldRow label="STATUS" value={`${transaction.status} - COVER PAYMENT SENT`} />
                  <FieldRow label="CLEARING MECHANISM" value="CORRESPONDENT BANKING - NOSTRO/VOSTRO" />
                  <FieldRow label="SERVICE TYPE" value="SWIFT GPI COV" />
                </div>
                <div className="ml-8"><QRCode value={transaction.uetr} size={90} /></div>
              </div>

              <SectionHeader title="MESSAGE TEXT - SEQUENCE A: GENERAL INFORMATION" />
              <SwiftField tag="20" label="TRANSACTION REFERENCE NUMBER">{trn}</SwiftField>
              <SwiftField tag="21" label="RELATED REFERENCE">{trn}</SwiftField>
              <SwiftField tag="32A" label="VALUE DATE, CURRENCY, AMOUNT">{`DATE:     ${formatDate(transaction.settlement_info.settlement_date)}\nCURRENCY: ${transaction.settlement_info.currency}\nAMOUNT:   ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`}</SwiftField>
              <SwiftField tag="52A" label="ORDERING INSTITUTION">{transaction.instructing_agent.bic}</SwiftField>
              <SwiftField tag="56A" label="INTERMEDIARY INSTITUTION">{`COBADEFF\nCOMMERZBANK AG`}</SwiftField>
              <SwiftField tag="57A" label="BENEFICIARY BANK">{`${transaction.instructed_agent.bic}\n${transaction.instructed_agent.name}`}</SwiftField>
              <SwiftField tag="72" label="SENDER TO RECEIVER INFORMATION">{`//INS/${transaction.instructing_agent.bic}\n//COVER PAYMENT FOR MT103\n//REF: ${trn}`}</SwiftField>

              <SectionHeader title="MESSAGE TEXT - SEQUENCE B: UNDERLYING CUSTOMER CREDIT TRANSFER DETAILS" />
              <SwiftField tag="50K" label="ORDERING CUSTOMER">{`${transaction.debtor.iban}\n${transaction.debtor.name}`}</SwiftField>
              <SwiftField tag="59" label="BENEFICIARY CUSTOMER">{`${transaction.creditor.iban || '//ACCOUNT'}\n${transaction.creditor.name}`}</SwiftField>
              <SwiftField tag="70" label="REMITTANCE INFORMATION">{transaction.remittance_info}</SwiftField>
              <SwiftField tag="72" label="SENDER TO RECEIVER INFORMATION">{`//UETR/${transaction.uetr}\n//MT103 SENT DIRECTLY TO BENEFICIARY BANK`}</SwiftField>

              <div className="mt-6 pt-4 border-t border-gray-300 text-gray-500">
                <div>MT202 COV | GENERATED: {formatDateTime(new Date().toISOString())}</div>
                <div>REFERENCE: {trn} | UETR: {transaction.uetr}</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* PACS.008 Tab */}
        <TabsContent value="pacs008" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <Barcode value={`PACS008${transaction.uetr}`} />
            <div className="px-8 pt-4">
              <DocumentHeader title="ISO 20022 PACS.008 CUSTOMER CREDIT TRANSFER" />
            </div>
            <div className="px-8 pb-8">
              <SectionHeader title="MESSAGE HEADER" />
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <FieldRow label="MESSAGE TYPE" value="PACS.008.001.10" />
                  <FieldRow label="MESSAGE IDENTIFIER" value={messageId} mono />
                  <FieldRow label="CREATION DATE TIME" value={formatDateTime(transaction.created_at)} mono />
                  <FieldRow label="UETR" value={transaction.uetr} mono />
                  <FieldRow label="SETTLEMENT METHOD" value={transaction.settlement_info.method} />
                  <FieldRow label="CLEARING SYSTEM" value="TARGET2 CLEARING / SWIFT CROSS-BORDER" />
                </div>
                <div className="ml-8"><QRCode value={`PACS008${transaction.uetr}`} size={90} /></div>
              </div>

              <SectionHeader title="PACS.008 MESSAGE STRUCTURE" />
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap">{`<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${messageId}</MsgId>
      <CreDtTm>${transaction.created_at}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <TtlIntrBkSttlmAmt Ccy="${transaction.settlement_info.currency}">${formatAmount(transaction.settlement_info.interbank_settlement_amount)}</TtlIntrBkSttlmAmt>
      <IntrBkSttlmDt>${transaction.settlement_info.settlement_date}</IntrBkSttlmDt>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <UETR>${transaction.uetr}</UETR>
      </PmtId>
      <Dbtr><Nm>${transaction.debtor.name}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${transaction.debtor.iban}</IBAN></Id></DbtrAcct>
      <Cdtr><Nm>${transaction.creditor.name}</Nm></Cdtr>
      <RmtInf><Ustrd>${transaction.remittance_info}</Ustrd></RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`}</pre>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-300 text-gray-500">
                <div>ISO 20022 PACS.008 | GENERATED: {formatDateTime(new Date().toISOString())}</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Payment Tracer */}
        <TabsContent value="tracer" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <DocumentHeader title="PAYMENT TRACER REPORT" />
            <SectionHeader title="TRACER DETAILS" />
            <FieldRow label="TRACER REFERENCE" value={`TRC-${trn}`} mono />
            <FieldRow label="ORIGINAL UETR" value={transaction.uetr} mono />
            <FieldRow label="TRACER TYPE" value="PAYMENT STATUS INQUIRY" />
            <FieldRow label="REQUEST DATE" value={formatDate(new Date().toISOString())} />
            <FieldRow label="PRIORITY" value="URGENT" />

            <SectionHeader title="ORIGINAL TRANSACTION" />
            <FieldRow label="MESSAGE TYPE" value={transaction.message_type} />
            <FieldRow label="SETTLEMENT AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
            <FieldRow label="SETTLEMENT DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
            <FieldRow label="DEBTOR" value={transaction.debtor.name} />
            <FieldRow label="CREDITOR" value={transaction.creditor.name} />

            <SectionHeader title="TRACER ROUTE" />
            <FieldRow label="SENDER BIC" value={transaction.instructing_agent.bic} mono />
            <FieldRow label="RECEIVER BIC" value={transaction.instructed_agent.bic} mono />
            <FieldRow label="INTERMEDIARY" value="SWIFT GPI NETWORK" />
            <FieldRow label="gpi STATUS" value={transaction.tracking_result} />

            <SectionHeader title="RESPONSE" />
            <div className="bg-green-50 p-4 border border-green-200 mb-4">
              <div>STATUS: {transaction.tracking_result}</div>
              <div>LAST UPDATE: {formatDate(transaction.updated_at || transaction.created_at)}</div>
              <div>CONFIRMATION: Payment has been {transaction.tracking_result === "SUCCESSFUL" ? "credited to beneficiary account" : "traced through network"}</div>
            </div>
            <div className="mt-4 text-center text-gray-500">End of Payment Tracer Report | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* AFT Validation */}
        <TabsContent value="aft" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <DocumentHeader title="AFT VALIDATION REPORT" />
            <SectionHeader title="AUTOMATED FILE TRANSFER VALIDATION" />
            <FieldRow label="AFT SESSION ID" value={`AFT-${Date.now().toString(36).toUpperCase()}`} mono />
            <FieldRow label="VALIDATION DATE" value={formatDate(new Date().toISOString())} />
            <FieldRow label="FILE REFERENCE" value={`FILE-${trn}`} mono />
            <FieldRow label="PROTOCOL" value="SWIFTNet FileAct / MQSA" />

            <SectionHeader title="VALIDATION CHECKS" />
            <div className="space-y-2 mb-4">
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Schema Validation (ISO 20022 XML)</span><span className="text-green-700 font-bold">PASSED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Digital Signature Verification</span><span className="text-green-700 font-bold">PASSED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>BIC Validation (Sender/Receiver)</span><span className="text-green-700 font-bold">PASSED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>UETR Format Check</span><span className="text-green-700 font-bold">PASSED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Amount / Currency Validation</span><span className="text-green-700 font-bold">PASSED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Sanctions Screening (OFAC/EU)</span><span className="text-green-700 font-bold">CLEARED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Duplicate Detection</span><span className="text-green-700 font-bold">NO DUPLICATE</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>CBPR+ Compliance</span><span className="text-green-700 font-bold">COMPLIANT</span></div>
            </div>

            <SectionHeader title="TRANSACTION REFERENCE" />
            <FieldRow label="UETR" value={transaction.uetr} mono />
            <FieldRow label="AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
            <FieldRow label="OVERALL RESULT" value="ALL VALIDATIONS PASSED" />
            <div className="mt-4 text-center text-gray-500">AFT Validation Complete | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* MT103 Answer Back */}
        <TabsContent value="mt103" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <Barcode value={`MT103-${transaction.uetr}`} />
            <div className="mt-2"><DocumentHeader title="MT103 SINGLE CUSTOMER CREDIT TRANSFER - ANSWER BACK" /></div>
            <SectionHeader title="MESSAGE HEADER" />
            <FieldRow label="MESSAGE TYPE" value="MT103 (Single Customer Credit Transfer)" />
            <FieldRow label="SENDER" value={`${transaction.instructing_agent.bic} ${transaction.instructing_agent.name}`} mono />
            <FieldRow label="RECEIVER" value={`${transaction.instructed_agent.bic} ${transaction.instructed_agent.name}`} mono />
            <FieldRow label="MESSAGE REF" value={messageId} mono />
            <FieldRow label="ANSWER BACK REF" value={`ACK-${trn}`} mono />

            <SectionHeader title="FIELD 20: TRANSACTION REFERENCE" />
            <div className="bg-gray-50 p-3 border border-gray-200 mb-3 font-mono">:20:{trn}</div>
            <SectionHeader title="FIELD 23B: BANK OPERATION CODE" />
            <div className="bg-gray-50 p-3 border border-gray-200 mb-3 font-mono">:23B:CRED</div>
            <SectionHeader title="FIELD 32A: VALUE DATE/CURRENCY/AMOUNT" />
            <div className="bg-gray-50 p-3 border border-gray-200 mb-3 font-mono">:32A:{transaction.settlement_info.settlement_date?.replace(/-/g, '').slice(2)}{transaction.settlement_info.currency}{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</div>
            <SectionHeader title="FIELD 50K: ORDERING CUSTOMER" />
            <div className="bg-gray-50 p-3 border border-gray-200 mb-3 font-mono">:50K:/{transaction.debtor.iban}<br/>{transaction.debtor.name}</div>
            <SectionHeader title="FIELD 59: BENEFICIARY CUSTOMER" />
            <div className="bg-gray-50 p-3 border border-gray-200 mb-3 font-mono">:59:/{transaction.creditor.iban}<br/>{transaction.creditor.name}</div>
            <SectionHeader title="FIELD 71A: DETAILS OF CHARGES" />
            <div className="bg-gray-50 p-3 border border-gray-200 mb-3 font-mono">:71A:SHA</div>

            <SectionHeader title="ANSWER BACK STATUS" />
            <div className="bg-green-50 p-4 border border-green-200 mb-4">
              <div>NETWORK ACK: RECEIVED | DELIVERY STATUS: DELIVERED | UETR: {transaction.uetr}</div>
            </div>
            <div className="mt-4 text-center text-gray-500">MT103 Answer Back | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* M1 Fund */}
        <TabsContent value="m1fund" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <DocumentHeader title="M1 FUND ALLOCATION REPORT" />
            <SectionHeader title="FUND DETAILS" />
            <FieldRow label="FUND REFERENCE" value={`M1-${trn}`} mono />
            <FieldRow label="ALLOCATION DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
            <FieldRow label="FUND TYPE" value="M1 - IMMEDIATE SETTLEMENT FUND" />
            <FieldRow label="CURRENCY" value={transaction.settlement_info.currency} />
            <FieldRow label="AMOUNT" value={formatAmount(transaction.settlement_info.interbank_settlement_amount)} mono />

            <SectionHeader title="ORIGINATOR" />
            <FieldRow label="NAME" value={transaction.debtor.name} />
            <FieldRow label="ACCOUNT" value={transaction.debtor.iban} mono />
            <FieldRow label="BANK BIC" value={transaction.instructing_agent.bic} mono />

            <SectionHeader title="BENEFICIARY" />
            <FieldRow label="NAME" value={transaction.creditor.name} />
            <FieldRow label="ACCOUNT" value={transaction.creditor.iban} mono />
            <FieldRow label="BANK BIC" value={transaction.instructed_agent.bic} mono />

            <SectionHeader title="FUND MOVEMENT" />
            <div className="space-y-2 mb-4">
              <div className="flex justify-between bg-blue-50 p-2 border border-blue-200"><span>Nostro Account Debit</span><span className="font-bold">CONFIRMED</span></div>
              <div className="flex justify-between bg-blue-50 p-2 border border-blue-200"><span>Vostro Account Credit</span><span className="font-bold">CONFIRMED</span></div>
              <div className="flex justify-between bg-blue-50 p-2 border border-blue-200"><span>Interbank Settlement</span><span className="font-bold">COMPLETED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>M1 Fund Status</span><span className="text-green-700 font-bold">ALLOCATED</span></div>
            </div>
            <div className="mt-4 text-center text-gray-500">M1 Fund Allocation Report | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* Funds Tracer */}
        <TabsContent value="fundstracer" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <DocumentHeader title="FUNDS TRACER REPORT" />
            <SectionHeader title="TRACE INFORMATION" />
            <FieldRow label="TRACE ID" value={`FTR-${Date.now().toString(36).toUpperCase()}`} mono />
            <FieldRow label="UETR" value={transaction.uetr} mono />
            <FieldRow label="TRACE INITIATED" value={formatDate(new Date().toISOString())} />
            <FieldRow label="AMOUNT TRACED" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />

            <SectionHeader title="FUND FLOW CHAIN" />
            <div className="space-y-1 mb-4 border border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 rounded-full inline-block" /><span className="font-bold">STEP 1:</span> {transaction.debtor.name} (Debtor) — DEBITED</div>
              <div className="text-gray-400 ml-2">|</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 rounded-full inline-block" /><span className="font-bold">STEP 2:</span> {transaction.instructing_agent.bic} (Sender Bank) — FORWARDED</div>
              <div className="text-gray-400 ml-2">|</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 rounded-full inline-block" /><span className="font-bold">STEP 3:</span> SWIFT NETWORK (gpi) — TRANSMITTED</div>
              <div className="text-gray-400 ml-2">|</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 rounded-full inline-block" /><span className="font-bold">STEP 4:</span> {transaction.instructed_agent.bic} (Receiver Bank) — RECEIVED</div>
              <div className="text-gray-400 ml-2">|</div>
              <div className="flex items-center gap-2"><span className={`w-4 h-4 rounded-full inline-block ${transaction.tracking_result === "SUCCESSFUL" ? "bg-green-500" : "bg-yellow-500"}`} /><span className="font-bold">STEP 5:</span> {transaction.creditor.name} (Creditor) — {transaction.tracking_result === "SUCCESSFUL" ? "CREDITED" : "PENDING"}</div>
            </div>

            <SectionHeader title="TRACE RESULT" />
            <FieldRow label="FINAL STATUS" value={transaction.tracking_result} />
            <FieldRow label="FUNDS LOCATION" value={transaction.tracking_result === "SUCCESSFUL" ? "BENEFICIARY ACCOUNT" : "IN TRANSIT"} />
            <div className="mt-4 text-center text-gray-500">Funds Tracer Report | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* Fund Location */}
        <TabsContent value="fundlocation" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <DocumentHeader title="FUND LOCATION REPORT" />
            <SectionHeader title="FUND IDENTIFICATION" />
            <FieldRow label="UETR" value={transaction.uetr} mono />
            <FieldRow label="AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
            <FieldRow label="REPORT DATE" value={formatDate(new Date().toISOString())} />

            <SectionHeader title="CURRENT LOCATION" />
            <div className="bg-blue-50 p-4 border border-blue-200 mb-4">
              <div className="font-bold mb-2">FUND STATUS: {transaction.tracking_result === "SUCCESSFUL" ? "DELIVERED TO BENEFICIARY" : "IN TRANSIT"}</div>
              <div>INSTITUTION: {transaction.tracking_result === "SUCCESSFUL" ? transaction.instructed_agent.name : "SWIFT NETWORK"}</div>
              <div>BIC: {transaction.tracking_result === "SUCCESSFUL" ? transaction.instructed_agent.bic : "SWIFT gpi TRACKER"}</div>
              <div>ACCOUNT: {transaction.tracking_result === "SUCCESSFUL" ? transaction.creditor.iban : "INTERMEDIARY NOSTRO"}</div>
              <div>TIMESTAMP: {formatDate(transaction.updated_at || transaction.created_at)}</div>
            </div>

            <SectionHeader title="LOCATION HISTORY" />
            <div className="space-y-2 mb-4">
              <div className="flex justify-between p-2 border-b"><span>Debtor Account ({transaction.debtor.iban?.slice(0, 10)}...)</span><span>DEBITED</span><span className="text-gray-500">{formatDate(transaction.settlement_info.settlement_date)}</span></div>
              <div className="flex justify-between p-2 border-b"><span>Sender Nostro ({transaction.instructing_agent.bic})</span><span>TRANSFERRED</span><span className="text-gray-500">{formatDate(transaction.settlement_info.settlement_date)}</span></div>
              <div className="flex justify-between p-2 border-b"><span>Receiver Vostro ({transaction.instructed_agent.bic})</span><span>RECEIVED</span><span className="text-gray-500">{formatDate(transaction.updated_at || transaction.settlement_info.settlement_date)}</span></div>
              <div className="flex justify-between p-2 border-b"><span>Beneficiary ({transaction.creditor.iban?.slice(0, 10)}...)</span><span className="text-green-700 font-bold">{transaction.tracking_result === "SUCCESSFUL" ? "CREDITED" : "PENDING"}</span><span className="text-gray-500">{formatDate(transaction.updated_at || new Date().toISOString())}</span></div>
            </div>
            <div className="mt-4 text-center text-gray-500">Fund Location Report | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* Beneficiary Credit */}
        <TabsContent value="bencredit" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <Barcode value={`BENCR-${transaction.uetr}`} />
            <div className="mt-2"><DocumentHeader title="BENEFICIARY CREDIT ADVICE" /></div>
            <SectionHeader title="CREDIT DETAILS" />
            <FieldRow label="CREDIT REF" value={`CR-${trn}`} mono />
            <FieldRow label="CREDIT DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
            <FieldRow label="VALUE DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
            <FieldRow label="AMOUNT CREDITED" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />

            <SectionHeader title="BENEFICIARY" />
            <FieldRow label="NAME" value={transaction.creditor.name} />
            <FieldRow label="ACCOUNT / IBAN" value={transaction.creditor.iban} mono />
            <FieldRow label="BANK" value={transaction.instructed_agent.name} />
            <FieldRow label="BANK BIC" value={transaction.instructed_agent.bic} mono />

            <SectionHeader title="ORDERING PARTY" />
            <FieldRow label="NAME" value={transaction.debtor.name} />
            <FieldRow label="ACCOUNT / IBAN" value={transaction.debtor.iban} mono />
            <FieldRow label="BANK" value={transaction.instructing_agent.name} />
            <FieldRow label="BANK BIC" value={transaction.instructing_agent.bic} mono />

            <SectionHeader title="REMITTANCE" />
            <div className="bg-gray-50 p-4 border border-gray-200 mb-4">{transaction.remittance_info}</div>

            <div className="bg-green-50 p-4 border border-green-200 text-center font-bold text-green-800">
              CREDIT CONFIRMED — FUNDS AVAILABLE IN BENEFICIARY ACCOUNT
            </div>
            <div className="mt-4 text-center text-gray-500">Beneficiary Credit Advice | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* Doc Clearance */}
        <TabsContent value="docclearance" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <DocumentHeader title="DOCUMENT CLEARANCE CERTIFICATE" />
            <SectionHeader title="CLEARANCE DETAILS" />
            <FieldRow label="CLEARANCE REF" value={`CLR-${trn}`} mono />
            <FieldRow label="CLEARANCE DATE" value={formatDate(new Date().toISOString())} />
            <FieldRow label="UETR" value={transaction.uetr} mono />

            <SectionHeader title="COMPLIANCE CHECKS" />
            <div className="space-y-2 mb-4">
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>AML (Anti-Money Laundering)</span><span className="text-green-700 font-bold">CLEARED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>KYC (Know Your Customer)</span><span className="text-green-700 font-bold">VERIFIED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>OFAC Sanctions List</span><span className="text-green-700 font-bold">NO MATCH</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>EU Sanctions List</span><span className="text-green-700 font-bold">NO MATCH</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>PEP (Politically Exposed Persons)</span><span className="text-green-700 font-bold">NO MATCH</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Transaction Limit Check</span><span className="text-green-700 font-bold">WITHIN LIMITS</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Document Authentication</span><span className="text-green-700 font-bold">AUTHENTICATED</span></div>
            </div>

            <SectionHeader title="TRANSACTION SUMMARY" />
            <FieldRow label="DEBTOR" value={transaction.debtor.name} />
            <FieldRow label="CREDITOR" value={transaction.creditor.name} />
            <FieldRow label="AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
            <FieldRow label="CLEARANCE STATUS" value="FULLY CLEARED FOR PROCESSING" />
            <div className="mt-4 text-center text-gray-500">Document Clearance Certificate | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* SMTP Mail */}
        <TabsContent value="smtp" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <DocumentHeader title="SMTP MAIL NOTIFICATION LOG" />
            <SectionHeader title="EMAIL HEADER" />
            <FieldRow label="FROM" value="noreply@swift-iso20022-platform.com" mono />
            <FieldRow label="TO" value="operations@correspondent-bank.com" mono />
            <FieldRow label="CC" value="compliance@correspondent-bank.com" mono />
            <FieldRow label="SUBJECT" value={`Payment Confirmation - UETR: ${transaction.uetr.slice(0, 18)}...`} />
            <FieldRow label="DATE" value={new Date().toUTCString()} />
            <FieldRow label="SMTP SERVER" value="smtp.swiftnet.sipn.swift.com:587" mono />
            <FieldRow label="TLS" value="TLS 1.3 / AES-256-GCM" />
            <FieldRow label="STATUS" value="DELIVERED" />

            <SectionHeader title="EMAIL BODY" />
            <div className="bg-gray-50 p-4 border border-gray-200 mb-4 whitespace-pre-line">
{`Dear Operations Team,

This is to confirm the following SWIFT payment has been processed:

Transaction Reference: ${trn}
UETR: ${transaction.uetr}
Amount: ${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}
Debtor: ${transaction.debtor.name}
Creditor: ${transaction.creditor.name}
Settlement Date: ${formatDate(transaction.settlement_info.settlement_date)}
Status: ${transaction.tracking_result}

Please verify and reconcile accordingly.

Best regards,
ISO 20022 SWIFT Transfer Platform
Automated Notification System`}
            </div>
            <FieldRow label="DELIVERY STATUS" value="250 OK - Message accepted for delivery" mono />
            <div className="mt-4 text-center text-gray-500">SMTP Mail Notification | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* On Ledger */}
        <TabsContent value="onledger" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <DocumentHeader title="ON LEDGER ENTRY RECORD" />
            <SectionHeader title="LEDGER ENTRY" />
            <FieldRow label="LEDGER REF" value={`LED-${trn}`} mono />
            <FieldRow label="ENTRY DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
            <FieldRow label="POSTING DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
            <FieldRow label="UETR" value={transaction.uetr} mono />

            <SectionHeader title="DEBIT SIDE" />
            <div className="bg-red-50 p-4 border border-red-200 mb-4">
              <FieldRow label="ACCOUNT" value={transaction.debtor.iban} mono />
              <FieldRow label="ACCOUNT HOLDER" value={transaction.debtor.name} />
              <FieldRow label="DEBIT AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
              <FieldRow label="BALANCE TYPE" value="AVAILABLE" />
            </div>

            <SectionHeader title="CREDIT SIDE" />
            <div className="bg-green-50 p-4 border border-green-200 mb-4">
              <FieldRow label="ACCOUNT" value={transaction.creditor.iban} mono />
              <FieldRow label="ACCOUNT HOLDER" value={transaction.creditor.name} />
              <FieldRow label="CREDIT AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
              <FieldRow label="BALANCE TYPE" value="AVAILABLE" />
            </div>

            <SectionHeader title="LEDGER STATUS" />
            <FieldRow label="ENTRY STATUS" value="POSTED" />
            <FieldRow label="RECONCILIATION" value="MATCHED" />
            <FieldRow label="AUDIT TRAIL" value={`AUDIT-${trn.slice(-8)}`} mono />
            <div className="mt-4 text-center text-gray-500">On Ledger Entry | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* Officer Comm */}
        <TabsContent value="officercomm" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <DocumentHeader title="OFFICER COMMUNICATION RECORD" />
            <SectionHeader title="COMMUNICATION DETAILS" />
            <FieldRow label="COMM REF" value={`OFC-${trn}`} mono />
            <FieldRow label="DATE" value={formatDate(new Date().toISOString())} />
            <FieldRow label="CHANNEL" value="INTERNAL SECURE MESSAGING" />
            <FieldRow label="PRIORITY" value={transaction.settlement_info.settlement_priority || "NORMAL"} />

            <SectionHeader title="FROM" />
            <FieldRow label="OFFICER" value="Operations Department" />
            <FieldRow label="INSTITUTION" value={transaction.instructing_agent.name} />
            <FieldRow label="BIC" value={transaction.instructing_agent.bic} mono />

            <SectionHeader title="TO" />
            <FieldRow label="OFFICER" value="Correspondent Banking Desk" />
            <FieldRow label="INSTITUTION" value={transaction.instructed_agent.name} />
            <FieldRow label="BIC" value={transaction.instructed_agent.bic} mono />

            <SectionHeader title="MESSAGE" />
            <div className="bg-yellow-50 p-4 border border-yellow-200 mb-4 whitespace-pre-line">
{`RE: Transaction ${trn} | UETR: ${transaction.uetr}

Dear Correspondent,

Please be advised that the following payment instruction has been processed through our ISO 20022 SWIFT platform:

Amount: ${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}
Debtor: ${transaction.debtor.name}
Creditor: ${transaction.creditor.name}
Value Date: ${formatDate(transaction.settlement_info.settlement_date)}

Kindly confirm receipt and credit to the beneficiary at your earliest convenience.

Remittance Info: ${transaction.remittance_info}

Regards,
Operations & Settlement Desk`}
            </div>

            <SectionHeader title="ACKNOWLEDGMENT" />
            <FieldRow label="STATUS" value="READ & ACKNOWLEDGED" />
            <FieldRow label="RESPONSE TIME" value="Within SLA" />
            <div className="mt-4 text-center text-gray-500">Officer Communication Record | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* Debit Note */}
        <TabsContent value="debitnote" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <Barcode value={`DN-${transaction.uetr}`} />
            <div className="mt-2"><DocumentHeader title="OFFICIAL DEBIT NOTE" /></div>
            <div className="text-center mb-6 border-b border-gray-300 pb-4">
              <div className="font-bold">DEBIT NOTE NO: DN-{new Date().toISOString().slice(0, 10)}-{trn.slice(-4)}</div>
              <div>DATE OF ISSUE: {formatDate(new Date().toISOString())}</div>
              <div>EFFECTIVE DATE: {formatDate(transaction.settlement_info.settlement_date)}</div>
            </div>

            <SectionHeader title="ISSUING INSTITUTION" />
            <FieldRow label="BANK NAME" value={transaction.instructing_agent.name} />
            <FieldRow label="SWIFT/BIC" value={transaction.instructing_agent.bic} mono />
            <FieldRow label="BRANCH" value="INTERNATIONAL PAYMENTS DIVISION" />
            <FieldRow label="ADDRESS" value="HANSAALLEE 3, 40549 DUSSELDORF, GERMANY" />

            <SectionHeader title="ACCOUNT HOLDER (DEBTOR)" />
            <FieldRow label="NAME" value={transaction.debtor.name} />
            <FieldRow label="ACCOUNT / IBAN" value={transaction.debtor.iban} mono />
            <FieldRow label="COUNTRY" value={transaction.debtor.country || "DE"} />
            <FieldRow label="CUSTOMER REF" value={trn} mono />

            <SectionHeader title="DEBIT DETAILS" />
            <div className="bg-red-50 border border-red-200 p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldRow label="DEBIT AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
                  <FieldRow label="VALUE DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
                  <FieldRow label="TRANSACTION TYPE" value="INTERNATIONAL WIRE TRANSFER" />
                </div>
                <div>
                  <FieldRow label="EXCHANGE RATE" value={transaction.settlement_info.currency === "EUR" ? "1.0000 (BASE)" : "1.0800 EUR/USD"} mono />
                  <FieldRow label="CHARGES" value={`${transaction.settlement_info.currency} 0.00 (SHA)`} mono />
                  <FieldRow label="NET DEBIT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
                </div>
              </div>
            </div>

            <SectionHeader title="BENEFICIARY DETAILS" />
            <FieldRow label="BENEFICIARY NAME" value={transaction.creditor.name} />
            <FieldRow label="BENEFICIARY IBAN" value={transaction.creditor.iban} mono />
            <FieldRow label="BENEFICIARY BANK" value={transaction.instructed_agent.name} />
            <FieldRow label="BENEFICIARY BIC" value={transaction.instructed_agent.bic} mono />

            <SectionHeader title="REMITTANCE INFORMATION" />
            <div className="bg-gray-50 p-4 border border-gray-200 mb-4">{transaction.remittance_info}</div>

            <SectionHeader title="NARRATIVE" />
            <div className="bg-gray-50 p-4 border border-gray-200 mb-4">
              We hereby confirm that the above account has been debited for the stated amount in respect of the international payment instruction referenced above. This debit note serves as official notification of the charge to the account holder's records. The settlement was executed through the SWIFT network under ISO 20022 messaging standards in compliance with CBPR+ regulations.
            </div>

            <div className="mt-8 grid grid-cols-2 gap-8">
              <div className="text-center border-t border-gray-300 pt-4">
                <div className="text-gray-500 text-[10px]">AUTHORIZED OFFICER</div>
                <div className="mt-6 text-gray-700">_________________________</div>
                <div className="mt-1">Operations & Settlement Desk</div>
              </div>
              <div className="text-center border-t border-gray-300 pt-4">
                <div className="text-gray-500 text-[10px]">CUSTOMER ACKNOWLEDGMENT</div>
                <div className="mt-6 text-gray-700">_________________________</div>
                <div className="mt-1">{transaction.debtor.name}</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t text-gray-500 text-center">This is a system-generated debit note. | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balancesheet" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <DocumentHeader title="TRANSACTION BALANCE SHEET" />
            <div className="text-center mb-6 border-b border-gray-300 pb-4">
              <div className="font-bold">BALANCE SHEET REPORT — REF: BS-{trn}</div>
              <div>REPORTING DATE: {formatDate(new Date().toISOString())}</div>
              <div>SETTLEMENT DATE: {formatDate(transaction.settlement_info.settlement_date)}</div>
              <div>UETR: {transaction.uetr}</div>
            </div>

            <SectionHeader title="TRANSACTION OVERVIEW" />
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <FieldRow label="MESSAGE TYPE" value={transaction.message_type} />
                <FieldRow label="SETTLEMENT METHOD" value={transaction.settlement_info.settlement_method} />
                <FieldRow label="PRIORITY" value={transaction.settlement_info.settlement_priority || "NORMAL"} />
                <FieldRow label="STATUS" value={transaction.tracking_result} />
              </div>
              <div>
                <FieldRow label="CURRENCY" value={transaction.settlement_info.currency} />
                <FieldRow label="PRINCIPAL AMOUNT" value={formatAmount(transaction.settlement_info.interbank_settlement_amount)} mono />
                <FieldRow label="CHARGES" value="0.00" mono />
                <FieldRow label="NET AMOUNT" value={formatAmount(transaction.settlement_info.interbank_settlement_amount)} mono />
              </div>
            </div>

            <SectionHeader title="DEBIT ENTRIES" />
            <div className="border border-red-200 mb-4">
              <div className="bg-red-100 p-2 font-bold flex justify-between"><span>DEBIT ACCOUNT</span><span>AMOUNT</span></div>
              <div className="p-3 flex justify-between border-b"><span>{transaction.debtor.name} ({transaction.debtor.iban})</span><span className="text-red-700 font-bold">{transaction.settlement_info.currency} -{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span></div>
              <div className="p-3 flex justify-between border-b"><span>Nostro Account — {transaction.instructing_agent.bic}</span><span className="text-red-700 font-bold">{transaction.settlement_info.currency} -{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span></div>
              <div className="p-3 flex justify-between bg-red-50 font-bold"><span>TOTAL DEBITS</span><span className="text-red-700">{transaction.settlement_info.currency} -{formatAmount(transaction.settlement_info.interbank_settlement_amount * 2)}</span></div>
            </div>

            <SectionHeader title="CREDIT ENTRIES" />
            <div className="border border-green-200 mb-4">
              <div className="bg-green-100 p-2 font-bold flex justify-between"><span>CREDIT ACCOUNT</span><span>AMOUNT</span></div>
              <div className="p-3 flex justify-between border-b"><span>Vostro Account — {transaction.instructed_agent.bic}</span><span className="text-green-700 font-bold">{transaction.settlement_info.currency} +{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span></div>
              <div className="p-3 flex justify-between border-b"><span>{transaction.creditor.name} ({transaction.creditor.iban})</span><span className="text-green-700 font-bold">{transaction.settlement_info.currency} +{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span></div>
              <div className="p-3 flex justify-between bg-green-50 font-bold"><span>TOTAL CREDITS</span><span className="text-green-700">{transaction.settlement_info.currency} +{formatAmount(transaction.settlement_info.interbank_settlement_amount * 2)}</span></div>
            </div>

            <SectionHeader title="BALANCE RECONCILIATION" />
            <div className="bg-blue-50 p-4 border border-blue-200 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><div className="text-gray-500">Total Debits</div><div className="font-bold text-red-700">{transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount * 2)}</div></div>
                <div><div className="text-gray-500">Total Credits</div><div className="font-bold text-green-700">{transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount * 2)}</div></div>
                <div><div className="text-gray-500">Net Balance</div><div className="font-bold text-blue-700">{transaction.settlement_info.currency} 0.00</div></div>
              </div>
            </div>
            <div className="bg-green-50 p-3 border border-green-200 text-center font-bold text-green-800">BALANCE SHEET STATUS: BALANCED — ALL ENTRIES RECONCILED</div>
            <div className="mt-4 text-center text-gray-500">Transaction Balance Sheet | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* Remittance Report */}
        <TabsContent value="remittance" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <Barcode value={`REM-${transaction.uetr}`} />
            <div className="mt-2"><DocumentHeader title="REMITTANCE ADVICE REPORT" /></div>
            <div className="text-center mb-6 border-b border-gray-300 pb-4">
              <div className="font-bold">REMITTANCE REF: RA-{trn}</div>
              <div>DATE: {formatDate(new Date().toISOString())} | UETR: {transaction.uetr}</div>
            </div>

            <SectionHeader title="REMITTER (ORDERING PARTY)" />
            <FieldRow label="NAME" value={transaction.debtor.name} />
            <FieldRow label="ACCOUNT / IBAN" value={transaction.debtor.iban} mono />
            <FieldRow label="COUNTRY" value={transaction.debtor.country || "DE"} />
            <FieldRow label="BANK" value={transaction.instructing_agent.name} />
            <FieldRow label="BIC" value={transaction.instructing_agent.bic} mono />

            <SectionHeader title="BENEFICIARY (PAYEE)" />
            <FieldRow label="NAME" value={transaction.creditor.name} />
            <FieldRow label="ACCOUNT / IBAN" value={transaction.creditor.iban} mono />
            <FieldRow label="COUNTRY" value={transaction.creditor.country || "DE"} />
            <FieldRow label="BANK" value={transaction.instructed_agent.name} />
            <FieldRow label="BIC" value={transaction.instructed_agent.bic} mono />

            <SectionHeader title="PAYMENT DETAILS" />
            <div className="bg-gray-50 border border-gray-200 p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldRow label="PAYMENT AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
                  <FieldRow label="VALUE DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
                  <FieldRow label="PAYMENT METHOD" value="INTERNATIONAL WIRE / SWIFT" />
                  <FieldRow label="CHARGE BEARER" value="SHA (Shared)" />
                </div>
                <div>
                  <FieldRow label="MESSAGE TYPE" value={transaction.message_type} />
                  <FieldRow label="SETTLEMENT METHOD" value={transaction.settlement_info.settlement_method} />
                  <FieldRow label="PRIORITY" value={transaction.settlement_info.settlement_priority || "NORMAL"} />
                  <FieldRow label="CBPR+ COMPLIANT" value="YES" />
                </div>
              </div>
            </div>

            <SectionHeader title="REMITTANCE INFORMATION" />
            <div className="bg-yellow-50 p-4 border border-yellow-200 mb-4">
              <FieldRow label="UNSTRUCTURED" value={transaction.remittance_info} />
              <FieldRow label="PURPOSE CODE" value="INTC (Intra-Company Payment)" />
              <FieldRow label="INVOICE REF" value={`INV-${trn.slice(-8)}`} mono />
            </div>

            <SectionHeader title="PROCESSING STATUS" />
            <div className="space-y-2 mb-4">
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Payment Initiated</span><span className="text-green-700 font-bold">COMPLETED</span><span className="text-gray-500">{formatDate(transaction.created_at)}</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Sanctions Screening</span><span className="text-green-700 font-bold">CLEARED</span><span className="text-gray-500">{formatDate(transaction.created_at)}</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Settlement Processed</span><span className="text-green-700 font-bold">CONFIRMED</span><span className="text-gray-500">{formatDate(transaction.settlement_info.settlement_date)}</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Beneficiary Credited</span><span className="text-green-700 font-bold">{transaction.tracking_result}</span><span className="text-gray-500">{formatDate(transaction.updated_at || transaction.settlement_info.settlement_date)}</span></div>
            </div>

            <SectionHeader title="NARRATIVE / REMARKS" />
            <div className="bg-gray-50 p-4 border border-gray-200 mb-4">
              This remittance advice confirms the transfer of {transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)} from {transaction.debtor.name} to {transaction.creditor.name} as per the payment instruction referenced above. The payment was processed through the SWIFT network under ISO 20022 standards and settled via {transaction.settlement_info.settlement_method} method. All compliance checks including AML, KYC, and sanctions screening were completed successfully.
            </div>
            <div className="mt-4 text-center text-gray-500">Remittance Advice Report | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* Credit Notification Report */}
        <TabsContent value="creditnotif" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <Barcode value={`CRNT-${transaction.uetr}`} />
            <div className="mt-2"><DocumentHeader title="CREDIT NOTIFICATION REPORT" /></div>
            <div className="text-center mb-6 bg-green-50 border border-green-200 p-4">
              <div className="text-green-800 font-bold text-base">CREDIT NOTIFICATION</div>
              <div className="text-green-700">Reference: CN-{trn} | Date: {formatDate(new Date().toISOString())}</div>
            </div>

            <SectionHeader title="NOTIFICATION SUMMARY" />
            <div className="bg-green-50 p-4 border border-green-200 mb-4">
              <div className="text-center mb-2 font-bold">AMOUNT CREDITED</div>
              <div className="text-center text-xl font-bold text-green-800">{transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)}</div>
              <div className="text-center text-gray-600 mt-1">Value Date: {formatDate(transaction.settlement_info.settlement_date)}</div>
            </div>

            <SectionHeader title="CREDITED ACCOUNT (BENEFICIARY)" />
            <FieldRow label="ACCOUNT HOLDER" value={transaction.creditor.name} />
            <FieldRow label="ACCOUNT / IBAN" value={transaction.creditor.iban} mono />
            <FieldRow label="BANK" value={transaction.instructed_agent.name} />
            <FieldRow label="BIC" value={transaction.instructed_agent.bic} mono />
            <FieldRow label="CREDIT TYPE" value="INCOMING INTERNATIONAL TRANSFER" />

            <SectionHeader title="ORIGINATING PARTY (REMITTER)" />
            <FieldRow label="NAME" value={transaction.debtor.name} />
            <FieldRow label="ACCOUNT / IBAN" value={transaction.debtor.iban} mono />
            <FieldRow label="BANK" value={transaction.instructing_agent.name} />
            <FieldRow label="BIC" value={transaction.instructing_agent.bic} mono />

            <SectionHeader title="TRANSACTION DETAILS" />
            <FieldRow label="UETR" value={transaction.uetr} mono />
            <FieldRow label="MESSAGE TYPE" value={transaction.message_type} />
            <FieldRow label="SETTLEMENT METHOD" value={transaction.settlement_info.settlement_method} />
            <FieldRow label="SETTLEMENT DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
            <FieldRow label="REMITTANCE INFO" value={transaction.remittance_info} />

            <SectionHeader title="CREDIT VERIFICATION" />
            <div className="space-y-2 mb-4">
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Fund Availability</span><span className="text-green-700 font-bold">IMMEDIATELY AVAILABLE</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Account Balance Updated</span><span className="text-green-700 font-bold">YES</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Statement Entry Created</span><span className="text-green-700 font-bold">YES</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Notification Dispatched</span><span className="text-green-700 font-bold">DELIVERED</span></div>
            </div>

            <div className="bg-green-100 p-4 border border-green-300 text-center font-bold text-green-900">
              CREDIT SUCCESSFULLY APPLIED — FUNDS AVAILABLE FOR WITHDRAWAL
            </div>
            <div className="mt-4 text-center text-gray-500">Credit Notification Report | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* Intermediary Bank Report */}
        <TabsContent value="intermediary" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <DocumentHeader title="INTERMEDIARY BANK REPORT" />
            <div className="text-center mb-6 border-b border-gray-300 pb-4">
              <div className="font-bold">INTERMEDIARY REPORT REF: IBR-{trn}</div>
              <div>UETR: {transaction.uetr}</div>
              <div>REPORT DATE: {formatDate(new Date().toISOString())}</div>
            </div>

            <SectionHeader title="PAYMENT CHAIN OVERVIEW" />
            <div className="border border-gray-200 p-4 mb-4 bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-24 shrink-0 font-bold text-blue-700">ORIGINATOR</div>
                  <div className="flex-1 border-l-2 border-blue-400 pl-3">
                    <div className="font-bold">{transaction.debtor.name}</div>
                    <div className="text-gray-600">IBAN: {transaction.debtor.iban}</div>
                    <div className="text-gray-600">Bank: {transaction.instructing_agent.name} ({transaction.instructing_agent.bic})</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-24 shrink-0 font-bold text-purple-700">SENDER</div>
                  <div className="flex-1 border-l-2 border-purple-400 pl-3">
                    <div className="font-bold">{transaction.instructing_agent.name}</div>
                    <div className="text-gray-600">BIC: {transaction.instructing_agent.bic}</div>
                    <div className="text-gray-600">Role: Instructing Agent / Ordering Institution</div>
                    <div className="text-gray-600">Processing: DEBITED NOSTRO — FORWARDED VIA SWIFT</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-24 shrink-0 font-bold text-orange-700">INTERMEDIARY</div>
                  <div className="flex-1 border-l-2 border-orange-400 pl-3">
                    <div className="font-bold">SWIFT GLOBAL NETWORK (gpi)</div>
                    <div className="text-gray-600">Network: SWIFTNet FIN / MX ISO 20022</div>
                    <div className="text-gray-600">gpi Tracker: CONNECTED — UETR TRACKED</div>
                    <div className="text-gray-600">Transit Time: Same-day settlement</div>
                    <div className="text-gray-600">Sanctions Check: CLEARED at network level</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-24 shrink-0 font-bold text-teal-700">RECEIVER</div>
                  <div className="flex-1 border-l-2 border-teal-400 pl-3">
                    <div className="font-bold">{transaction.instructed_agent.name}</div>
                    <div className="text-gray-600">BIC: {transaction.instructed_agent.bic}</div>
                    <div className="text-gray-600">Role: Instructed Agent / Beneficiary Institution</div>
                    <div className="text-gray-600">Processing: CREDITED VOSTRO — APPLIED TO BENEFICIARY</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-24 shrink-0 font-bold text-green-700">BENEFICIARY</div>
                  <div className="flex-1 border-l-2 border-green-400 pl-3">
                    <div className="font-bold">{transaction.creditor.name}</div>
                    <div className="text-gray-600">IBAN: {transaction.creditor.iban}</div>
                    <div className="text-gray-600">Status: {transaction.tracking_result === "SUCCESSFUL" ? "FUNDS CREDITED" : "PENDING CREDIT"}</div>
                  </div>
                </div>
              </div>
            </div>

            <SectionHeader title="SETTLEMENT DETAILS" />
            <FieldRow label="AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
            <FieldRow label="SETTLEMENT METHOD" value={transaction.settlement_info.settlement_method} />
            <FieldRow label="SETTLEMENT DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
            <FieldRow label="CHARGES ALLOCATION" value="SHA (Shared between parties)" />

            <SectionHeader title="INTERMEDIARY PROCESSING LOG" />
            <div className="space-y-2 mb-4">
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Message Received from Sender</span><span className="text-green-700 font-bold">ACK</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Format Validation (ISO 20022)</span><span className="text-green-700 font-bold">VALID</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>BIC Routing Verified</span><span className="text-green-700 font-bold">CONFIRMED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Sanctions / Compliance</span><span className="text-green-700 font-bold">CLEARED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Forwarded to Receiver</span><span className="text-green-700 font-bold">DELIVERED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Receiver Acknowledgment</span><span className="text-green-700 font-bold">ACK RECEIVED</span></div>
            </div>
            <div className="mt-4 text-center text-gray-500">Intermediary Bank Report | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

        {/* Nostro Common Account Detail */}
        <TabsContent value="nostro" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <DocumentHeader title="NOSTRO / VOSTRO COMMON ACCOUNT DETAIL" />
            <div className="text-center mb-6 border-b border-gray-300 pb-4">
              <div className="font-bold">ACCOUNT RECONCILIATION REPORT — REF: NV-{trn}</div>
              <div>UETR: {transaction.uetr} | DATE: {formatDate(new Date().toISOString())}</div>
            </div>

            <SectionHeader title="NOSTRO ACCOUNT (OUR ACCOUNT AT CORRESPONDENT)" />
            <div className="bg-blue-50 p-4 border border-blue-200 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldRow label="ACCOUNT HOLDER" value={transaction.instructing_agent.name} />
                  <FieldRow label="BIC" value={transaction.instructing_agent.bic} mono />
                  <FieldRow label="HELD AT" value={transaction.instructed_agent.name} />
                  <FieldRow label="CORRESPONDENT BIC" value={transaction.instructed_agent.bic} mono />
                </div>
                <div>
                  <FieldRow label="CURRENCY" value={transaction.settlement_info.currency} />
                  <FieldRow label="ACCOUNT TYPE" value="NOSTRO (Mirror)" />
                  <FieldRow label="RELATIONSHIP" value="CORRESPONDENT BANKING" />
                  <FieldRow label="STATUS" value="ACTIVE / RECONCILED" />
                </div>
              </div>
            </div>

            <SectionHeader title="VOSTRO ACCOUNT (THEIR ACCOUNT AT OUR BANK)" />
            <div className="bg-purple-50 p-4 border border-purple-200 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldRow label="ACCOUNT HOLDER" value={transaction.instructed_agent.name} />
                  <FieldRow label="BIC" value={transaction.instructed_agent.bic} mono />
                  <FieldRow label="HELD AT" value={transaction.instructing_agent.name} />
                  <FieldRow label="HOST BIC" value={transaction.instructing_agent.bic} mono />
                </div>
                <div>
                  <FieldRow label="CURRENCY" value={transaction.settlement_info.currency} />
                  <FieldRow label="ACCOUNT TYPE" value="VOSTRO (Loro)" />
                  <FieldRow label="RELATIONSHIP" value="CORRESPONDENT BANKING" />
                  <FieldRow label="STATUS" value="ACTIVE / RECONCILED" />
                </div>
              </div>
            </div>

            <SectionHeader title="TRANSACTION MOVEMENT" />
            <div className="border border-gray-200 mb-4">
              <div className="bg-gray-100 p-2 font-bold grid grid-cols-5 text-center"><span>DATE</span><span>REFERENCE</span><span>DEBIT</span><span>CREDIT</span><span>BALANCE</span></div>
              <div className="p-2 grid grid-cols-5 text-center border-b"><span>{formatDate(transaction.settlement_info.settlement_date)}</span><span className="font-mono">{trn.slice(-10)}</span><span className="text-red-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span><span>-</span><span className="font-bold">DR</span></div>
              <div className="p-2 grid grid-cols-5 text-center border-b"><span>{formatDate(transaction.settlement_info.settlement_date)}</span><span className="font-mono">SETTL-{trn.slice(-6)}</span><span>-</span><span className="text-green-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span><span className="font-bold">CR</span></div>
              <div className="p-2 grid grid-cols-5 text-center bg-blue-50 font-bold"><span>NET</span><span>-</span><span className="text-red-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span><span className="text-green-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span><span>0.00 (Balanced)</span></div>
            </div>

            <SectionHeader title="RECONCILIATION STATUS" />
            <div className="space-y-2 mb-4">
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Nostro Debit Matched</span><span className="text-green-700 font-bold">MATCHED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Vostro Credit Matched</span><span className="text-green-700 font-bold">MATCHED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Settlement Confirmed</span><span className="text-green-700 font-bold">CONFIRMED</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>MT950 Statement Received</span><span className="text-green-700 font-bold">YES</span></div>
              <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>Auto-Reconciliation</span><span className="text-green-700 font-bold">PASSED</span></div>
            </div>

            <div className="bg-green-100 p-4 border border-green-300 text-center font-bold text-green-900 mb-4">
              NOSTRO / VOSTRO ACCOUNTS FULLY RECONCILED — NO OUTSTANDING ITEMS
            </div>
            <div className="mt-4 text-center text-gray-500">Nostro / Vostro Account Detail | ISO 20022 SWIFT Platform</div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
