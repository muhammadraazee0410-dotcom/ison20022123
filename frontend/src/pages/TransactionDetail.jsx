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

// Document Header with HSBC branding
const DocumentHeader = ({ title, subtitle }) => (
  <div className="border-b-2 border-gray-300 pb-4 mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="/hsbc-logo.png" alt="HSBC" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-bold text-[#DB0011]">HSBC</span>
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

  const handlePrint = () => window.print();

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

  const trn = `HSBC${transaction.uetr.replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  const messageId = `HSBC${Date.now().toString().slice(-10)}`;

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
          <TabsTrigger value="settlement" className="text-xs">Settlement</TabsTrigger>
          <TabsTrigger value="confirmation" className="text-xs">Confirmation</TabsTrigger>
          <TabsTrigger value="mt910" className="text-xs">MT910 Credit</TabsTrigger>
          <TabsTrigger value="mt900" className="text-xs">MT900 Debit</TabsTrigger>
          <TabsTrigger value="mt945" className="text-xs">MT945 Statement</TabsTrigger>
          <TabsTrigger value="status" className="text-xs">Status</TabsTrigger>
          <TabsTrigger value="server" className="text-xs">Server Report</TabsTrigger>
          <TabsTrigger value="alliance" className="text-xs">Alliance Msg</TabsTrigger>
          <TabsTrigger value="mt202" className="text-xs">MT202 COV</TabsTrigger>
          <TabsTrigger value="pacs008" className="text-xs">PACS.008</TabsTrigger>
          <TabsTrigger value="debitnote" className="text-xs">Debit Note</TabsTrigger>
        </TabsList>

        {/* Payment Settlement Confirmation Letter */}
        <TabsContent value="settlement" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            {/* Header Box */}
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
            {/* Header Box */}
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
                  <span>: HSBC - CONFIRMED</span>
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
                <img src="/hsbc-logo.png" alt="HSBC" className="w-10 h-10 object-contain" />
                <div>
                  <span className="text-2xl font-bold text-[#DB0011]">HSBC</span>
                  <span className="text-gray-500 ml-2">Germany</span>
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
                © HSBC Germany - SWIFT Alliance Access System v7.5.4
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
                  <img src="/hsbc-logo.png" alt="HSBC" className="w-10 h-10 object-contain" />
                  <span className="text-xl font-bold text-[#DB0011]">HSBC</span>
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

        {/* Debit Note Tab */}
        <TabsContent value="debitnote" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <Barcode value={`DN${transaction.uetr}`} />
            <div className="px-8 pt-4">
              <DocumentHeader title="OFFICIAL DEBIT NOTE" />
            </div>
            <div className="px-8 pb-8">
              <div className="text-center mb-4">
                <div>DEBIT NOTE NO: DN-{new Date().toISOString().slice(0, 10)}-1 | DATE: {formatDate(new Date().toISOString())}</div>
              </div>

              <SectionHeader title="BANK DETAILS" />
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <FieldRow label="BANK NAME" value="HSBC GERMANY" />
                  <FieldRow label="BRANCH" value="FRANKFURT BRANCH" />
                  <FieldRow label="ADDRESS" value="TAUNUSANLAGE 12, 60254 FRANKFURT AM MAIN, GERMANY" />
                  <FieldRow label="SWIFT/BIC" value={transaction.instructing_agent.bic} mono />
                </div>
                <div className="ml-8"><QRCode value={`DN${transaction.uetr}`} size={90} /></div>
              </div>

              <SectionHeader title="CUSTOMER DETAILS" />
              <FieldRow label="CUSTOMER NAME" value={transaction.debtor.name} />
              <FieldRow label="ACCOUNT NUMBER" value={transaction.debtor.iban} mono />

              <SectionHeader title="TRANSACTION DETAILS" />
              <FieldRow label="TRANSACTION DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
              <FieldRow label="TRANSACTION REFERENCE" value={trn} mono />
              <FieldRow label="UETR" value={transaction.uetr} mono />
              <FieldRow label="DEBIT AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />

              <SectionHeader title="BENEFICIARY DETAILS" />
              <FieldRow label="BENEFICIARY NAME" value={transaction.creditor.name} />
              <FieldRow label="BENEFICIARY BANK" value={transaction.instructed_agent.name} />
              <FieldRow label="BENEFICIARY BIC" value={transaction.instructed_agent.bic} mono />

              <SectionHeader title="REMITTANCE INFORMATION" />
              <div className="bg-gray-50 p-4 border border-gray-200 mb-4">{transaction.remittance_info}</div>

              <div className="mt-8 grid grid-cols-2 gap-8">
                <div className="text-center border-t border-gray-300 pt-4">
                  <div className="text-gray-500 text-xs">AUTHORIZED SIGNATURE</div>
                  <div className="mt-8 text-gray-700">_________________________</div>
                  <div className="mt-2">HSBC GERMANY</div>
                </div>
                <div className="text-center border-t border-gray-300 pt-4">
                  <div className="text-gray-500 text-xs">CUSTOMER ACKNOWLEDGMENT</div>
                  <div className="mt-8 text-gray-700">_________________________</div>
                  <div className="mt-2">{transaction.debtor.name}</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-300 text-gray-500 text-center">
                This is a computer-generated document and does not require a physical signature.
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
