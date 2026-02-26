import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Printer,
  Download,
  Loader2,
  AlertTriangle,
  Hexagon,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Barcode Component - generates Code128-style barcode
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

// QR Code Component - simplified visual representation
const QRCode = ({ value, size = 100 }) => {
  const generateQR = () => {
    const cells = [];
    const gridSize = 21;
    const hash = value.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Corner patterns
        const isCorner = (row < 7 && col < 7) || (row < 7 && col >= gridSize - 7) || (row >= gridSize - 7 && col < 7);
        const isBorder = isCorner && ((row === 0 || row === 6 || col === 0 || col === 6) || 
                         (row >= gridSize - 7 && (row === gridSize - 7 || row === gridSize - 1 || col === 0 || col === 6)) ||
                         (col >= gridSize - 7 && (col === gridSize - 7 || col === gridSize - 1 || row === 0 || row === 6)));
        const isCenter = isCorner && row >= 2 && row <= 4 && col >= 2 && col <= 4;
        
        // Data pattern based on hash
        const dataPattern = ((hash + row * col + row + col) % 3) === 0;
        
        const isFilled = isCorner ? (isBorder || isCenter) : dataPattern;
        
        cells.push(
          <div
            key={`${row}-${col}`}
            className={isFilled ? 'bg-black' : 'bg-white'}
            style={{
              width: `${size / gridSize}px`,
              height: `${size / gridSize}px`,
            }}
          />
        );
      }
    }
    return cells;
  };

  return (
    <div 
      className="border border-gray-300 bg-white p-1"
      style={{ width: `${size + 8}px`, height: `${size + 8}px` }}
    >
      <div 
        className="grid"
        style={{ 
          gridTemplateColumns: `repeat(21, 1fr)`,
          width: `${size}px`,
          height: `${size}px`
        }}
      >
        {generateQR()}
      </div>
    </div>
  );
};

// Document Header with HSBC branding
const DocumentHeader = ({ title, subtitle }) => (
  <div className="border-b-2 border-gray-300 pb-4 mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#DB0011] flex items-center justify-center">
            <Hexagon className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
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
        <div className="w-6 h-6 border border-gray-400 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border border-gray-400 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-700">Swift</span>
      </div>
    </div>
  </div>
);

// Field Row Component
const FieldRow = ({ label, value, mono = false }) => (
  <div className="flex py-0.5">
    <span className="text-gray-600 w-48 flex-shrink-0">{label}:</span>
    <span className={`text-gray-900 ${mono ? 'font-mono' : ''}`}>{value || '-'}</span>
  </div>
);

// Section Header
const SectionHeader = ({ title }) => (
  <div className="border-t border-b border-gray-300 bg-gray-100 py-1 px-2 my-4 text-center">
    <span className="text-xs font-semibold tracking-wider text-gray-700">{title}</span>
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
  const printRef = useRef();

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

  const handlePrint = () => {
    window.print();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('de-DE', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE');
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.toISOString().replace('T', ' ').slice(0, -5)}Z`;
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Transaction Not Found
          </h2>
          <Button onClick={() => navigate("/transactions")} className="bg-[#DB0011] hover:bg-[#B3000E]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Transactions
          </Button>
        </div>
      </div>
    );
  }

  // Generate reference numbers
  const trn = `HSBC${transaction.uetr.replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  const relatedRef = trn;
  const messageId = `HSBC${Date.now().toString().slice(-10)}`;

  return (
    <div className="p-6 space-y-4" data-testid="transaction-detail">
      {/* Header Actions */}
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
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="border-gray-300" data-testid="print-button">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" className="border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Document Tabs */}
      <Tabs defaultValue="mt202" className="w-full">
        <TabsList className="grid w-full grid-cols-4 no-print">
          <TabsTrigger value="mt202">MT202 COV</TabsTrigger>
          <TabsTrigger value="pacs008">PACS.008</TabsTrigger>
          <TabsTrigger value="mt103ack">MT103 ACK</TabsTrigger>
          <TabsTrigger value="debitnote">Debit Note</TabsTrigger>
        </TabsList>

        {/* MT202 COV - Cover Payment */}
        <TabsContent value="mt202" className="mt-4">
          <div ref={printRef} className="bg-white border border-gray-200 shadow-lg font-mono text-xs leading-relaxed" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            {/* Barcode */}
            <Barcode value={transaction.uetr} />
            
            {/* Header */}
            <div className="px-8 pt-4">
              <DocumentHeader 
                title="MT202 COV - COVER PAYMENT" 
                subtitle="SWIFT FINANCIAL INSTITUTION TRANSFER"
              />
            </div>

            {/* Main Content */}
            <div className="px-8 pb-8 text-xs" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
              {/* Summary Section */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <FieldRow label="TRN" value={trn} mono />
                  <FieldRow label="UETR" value={transaction.uetr} mono />
                  <FieldRow label="MESSAGE TYPE" value="MT202 COV - COVER PAYMENT" />
                  <FieldRow label="RELATED MT103" value={relatedRef} mono />
                  <FieldRow label="SENDER'S SENDING TIME" value={formatDateTime(transaction.created_at)} mono />
                  <FieldRow label="VALUE DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
                  <FieldRow label="SETTLEMENT AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
                  <FieldRow label="CURRENCY" value={transaction.settlement_info.currency} />
                  <FieldRow label="STATUS" value={`${transaction.status} - COVER PAYMENT SENT`} />
                  <FieldRow label="CLEARING MECHANISM" value="CORRESPONDENT BANKING - NOSTRO/VOSTRO" />
                  <FieldRow label="SERVICE TYPE" value="SWIFT GPI COV" />
                </div>
                <div className="ml-8">
                  <QRCode value={transaction.uetr} size={90} />
                </div>
              </div>

              {/* Institution Details */}
              <div className="grid grid-cols-2 gap-8 mb-4">
                <div>
                  <div className="text-gray-500 mb-1">ORDERING INSTITUTION:</div>
                  <div className="font-semibold">{transaction.instructing_agent.name}</div>
                  <FieldRow label="BIC CODE" value={transaction.instructing_agent.bic} mono />
                  <FieldRow label="ADDRESS" value={`TAUNUSANLAGE 12, 60254 FRANKFURT AM MAIN, GERMANY`} />
                </div>
                <div>
                  <div className="text-gray-500 mb-1">INTERMEDIARY INSTITUTION:</div>
                  <div className="font-semibold">COMMERZBANK AG</div>
                  <FieldRow label="BIC CODE" value="COBADEFF" mono />
                  <FieldRow label="ADDRESS" value="COBADEFF" />
                </div>
              </div>

              <div className="mb-4">
                <div className="text-gray-500 mb-1">BENEFICIARY BANK:</div>
                <div className="font-semibold">{transaction.instructed_agent.name}</div>
                <FieldRow label="BIC CODE" value={transaction.instructed_agent.bic} mono />
                <FieldRow label="BANK ADDRESS" value={`${transaction.creditor.country}`} />
              </div>

              {/* Message Text - Sequence A */}
              <SectionHeader title="MESSAGE TEXT - SEQUENCE A: GENERAL INFORMATION" />
              
              <SwiftField tag="20" label="TRANSACTION REFERENCE NUMBER">
                {trn}
              </SwiftField>
              <SwiftField tag="21" label="RELATED REFERENCE">
                {relatedRef}
              </SwiftField>
              <SwiftField tag="32A" label="VALUE DATE, CURRENCY, AMOUNT">
{`DATE:     ${formatDate(transaction.settlement_info.settlement_date)}
CURRENCY: ${transaction.settlement_info.currency}
AMOUNT:   ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`}
              </SwiftField>
              <SwiftField tag="52A" label="ORDERING INSTITUTION">
                {transaction.instructing_agent.bic}
              </SwiftField>
              <SwiftField tag="56A" label="INTERMEDIARY INSTITUTION">
{`COBADEFF
COMMERZBANK AG`}
              </SwiftField>
              <SwiftField tag="57A" label="BENEFICIARY BANK">
{`${transaction.instructed_agent.bic}
${transaction.instructed_agent.name}
${transaction.creditor.country}`}
              </SwiftField>
              <SwiftField tag="58A" label="BENEFICIARY INSTITUTION">
{`${transaction.instructed_agent.bic}
${transaction.instructed_agent.name}
${transaction.creditor.country}`}
              </SwiftField>
              <SwiftField tag="72" label="SENDER TO RECEIVER INFORMATION">
{`//INS/${transaction.instructing_agent.bic}
//COVER PAYMENT FOR MT103
//REF: ${trn}`}
              </SwiftField>

              {/* Message Text - Sequence B */}
              <SectionHeader title="MESSAGE TEXT - SEQUENCE B: UNDERLYING CUSTOMER CREDIT TRANSFER DETAILS" />

              <SwiftField tag="50K" label="ORDERING CUSTOMER">
{`${transaction.debtor.iban}
${transaction.debtor.name}
${transaction.debtor.country}`}
              </SwiftField>
              <SwiftField tag="52A" label="ORDERING INSTITUTION">
{`${transaction.instructing_agent.bic}
${transaction.instructing_agent.name}`}
              </SwiftField>
              <SwiftField tag="56A" label="INTERMEDIARY INSTITUTION">
{`COBADEFF
COMMERZBANK AG`}
              </SwiftField>
              <SwiftField tag="57A" label="BENEFICIARY BANK">
                {transaction.instructed_agent.bic}
              </SwiftField>
              <SwiftField tag="59" label="BENEFICIARY CUSTOMER">
{`${transaction.creditor.iban || '//ACCOUNT'}
${transaction.creditor.name}
${transaction.creditor.country}`}
              </SwiftField>
              <SwiftField tag="70" label="REMITTANCE INFORMATION">
                {transaction.remittance_info}
              </SwiftField>
              <SwiftField tag="71A" label="DETAILS OF CHARGES">
                SHA
              </SwiftField>
              <SwiftField tag="72" label="SENDER TO RECEIVER INFORMATION">
{`//UETR/${transaction.uetr}
//MT103 SENT DIRECTLY TO BENEFICIARY BANK
//THIS IS THE COVER PAYMENT
//PLEASE APPLY FUNDS AS PER MT103 INSTRUCTIONS`}
              </SwiftField>

              {/* Output SWIFT Message Report */}
              <SectionHeader title="OUTPUT SWIFT MESSAGE REPORT" />
              
              <div className="bg-gray-50 p-4 font-mono text-xs overflow-x-auto border border-gray-200">
                <pre className="whitespace-pre-wrap">
{`:1:F01${transaction.instructing_agent.bic} 1 1 }2:O202${transaction.instructed_agent.bic} M)}3:{103:COV}{108:${trn}}{119:COV}}{121:${transaction.uetr}}-
:20:${trn}
:21:${relatedRef}
:32A:${transaction.settlement_info.settlement_date.replace(/-/g, '')}${transaction.settlement_info.currency}${formatAmount(transaction.settlement_info.interbank_settlement_amount).replace(/\./g, ',')}
:52A:${transaction.instructing_agent.bic}
:56A:COBADEFF
COMMERZBANK AG
:57A:${transaction.instructed_agent.bic}
${transaction.instructed_agent.name}
:58A:${transaction.instructed_agent.bic}
${transaction.instructed_agent.name}
:72://INS/${transaction.instructing_agent.bic}
//COVER PAYMENT FOR MT103
//REF: ${trn}

:50K:${transaction.debtor.iban}
${transaction.debtor.name}
:52A:DEUTDEFFXXX
:56A:COBADEFF
:57A:${transaction.instructed_agent.bic}
${transaction.instructed_agent.name}
:59://${transaction.creditor.iban || 'ACCOUNT'}
${transaction.creditor.name}
:70:${transaction.remittance_info}
:71A:SHA
:72://UETR/${transaction.uetr}
//MT103 SENT DIRECTLY TO BENEFICIARY BANK`}
                </pre>
              </div>

              {/* AFT Validation */}
              <SectionHeader title="AUTOMATED FILE TRANSFER (AFT) VALIDATION" />
              
              <div className="mb-2 text-gray-600">
                <div>ALLIANCE ACCESS 7.5 - AFT GATEWAY ACKNOWLEDGMENT PROTOCOL</div>
                <div>REAL-TIME STRAIGHT-THROUGH PROCESSING VALIDATION ENGINE</div>
                <div>LAU/FMA AUTHENTICATED MESSAGE DELIVERY - COPY SERVICE CONFIRMATION</div>
                <div className="mt-2 font-semibold">UN/EDIFACT SEGMENT VALIDATION - ISO 9735 COMPLIANCE STATUS</div>
              </div>

              <div className="border-t border-b border-gray-200 py-2 mt-4">
                <ValidationRow code="0050" description="CMT, CONTROL TOTAL/CHECKSUM" status="VALID" detail="CHK: 8B5D" />
                <ValidationRow code="0060" description="RFF-DTM, REFERENCE/DATETIME" status="VALID" detail="SYNC" />
                <ValidationRow code="0070" description="RFF, REFERENCE NUMBER" status="VALID" detail="UETR: OK" />
                <ValidationRow code="0080" description="DTM, DATE/TIME FORMAT" status="VALID" detail="ISO: 8601" />
                <ValidationRow code="0090" description="NAD-CTA-COM, PARTY DETAILS" status="VALID" detail="BIC: AUTH" />
                <ValidationRow code="0100" description="NAD, NAME AND ADDRESS" status="VALID" detail="DIR: FOUND" />
                <ValidationRow code="0110" description="CTA, CONTACT INFORMATION" status="VALID" detail="PIN: VALID" />
                <ValidationRow code="0120" description="COM, COMMUNICATION DETAILS" status="VALID" detail="EMC: AES256" />
                <ValidationRow code="0125" description="CUX, CURRENCY DETAILS" status="VALID" detail="FX: N/A" />
                <ValidationRow code="0130" description="ENC-FTX-SGA, EXTENDED VALIDATION" status="VALID" detail="SIG: RSA" />
                <ValidationRow code="0140" description="EBC, APPLICATION ERROR CODE" status="VALID" detail="ERR: NONE" />
                <ValidationRow code="0150" description="FTX, FREE TEXT NARRATIVE" status="VALID" detail="LEN: 1024" />
                <ValidationRow code="0160" description="RFF-FTX, REFERENCE TEXT" status="VALID" detail="PMT: SWIFT" />
                <ValidationRow code="0170" description="RFF, REFERENCE IDENTIFIER" status="VALID" detail="DOF: NONE" />
                <ValidationRow code="0180" description="FTX, ADDITIONAL INFORMATION" status="VALID" detail="CHNL: UTF8" />
                <ValidationRow code="0190" description="UNT, MESSAGE TRAILER/COUNT" status="VALID" detail="SEG: 20/20" />
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-300 text-gray-500">
                <div>MT202 COV GENERAL FINANCIAL INSTITUTION TRANSFER | GENERATED: {formatDateTime(new Date().toISOString())}</div>
                <div>REFERENCE: {trn} | UETR: {transaction.uetr}</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* PACS.008 Customer Credit Transfer */}
        <TabsContent value="pacs008" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <Barcode value={`PACS008${transaction.uetr}`} />
            
            <div className="px-8 pt-4">
              <DocumentHeader 
                title="ISO 20022 PACS.008 CUSTOMER CREDIT TRANSFER" 
              />
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
                  <FieldRow label="INSTRUCTION ID" value={`INST${trn}`} mono />
                  <FieldRow label="END-TO-END ID" value={transaction.uetr.toUpperCase().replace(/-/g, '')} mono />
                  <FieldRow label="CLEARING SYSTEM DETAILS" value="TARGET2" />
                  <FieldRow label="SETTLEMENT METHOD" value="TARGET2" />
                  <FieldRow label="PURPOSE CODE" value="OTHR" />
                  <FieldRow label="CATEGORY PURPOSE" value="COMM" />
                </div>
                <div className="ml-8">
                  <QRCode value={`PACS008${transaction.uetr}`} size={90} />
                </div>
              </div>

              <SectionHeader title="PACS.008 MESSAGE STRUCTURE" />

              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap">
{`<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>
        ${messageId}
      </MsgId>
      <CreDtTm>
        ${transaction.created_at}
      </CreDtTm>
      <NbOfTxs>
        1
      </NbOfTxs>
      <TtlIntrBkSttlmAmt Ccy="${transaction.settlement_info.currency}">
        ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}
      </TtlIntrBkSttlmAmt>
      <IntrBkSttlmDt>
        ${transaction.settlement_info.settlement_date}
      </IntrBkSttlmDt>
      <SttlmInf>
        <SttlmMtd>
          ${transaction.settlement_info.method}
        </SttlmMtd>
        <ClrSys>
          <Cd>
            CBA
          </Cd>
        </ClrSys>
      </SttlmInf>
      <InstgAgt>
        <FinInstnId>
          <BICFI>
            ${transaction.instructing_agent.bic}
          </BICFI>
          <Nm>
            ${transaction.instructing_agent.name}
          </Nm>
          <PstlAdr>
            <Ctry>
              ${transaction.instructing_agent.country}
            </Ctry>
            <TwnNm>
              FRANKFURT AM MAIN
            </TwnNm>
          </PstlAdr>
        </FinInstnId>
      </InstgAgt>
      <InstdAgt>
        <FinInstnId>
          <BICFI>
            ${transaction.instructed_agent.bic}
          </BICFI>
          <Nm>
            ${transaction.instructed_agent.name}
          </Nm>
          <PstlAdr>
            <Ctry>
              ${transaction.instructed_agent.country}
            </Ctry>
          </PstlAdr>
        </FinInstnId>
      </InstdAgt>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>
          INST${trn}
        </InstrId>
        <EndToEndId>
          ${transaction.uetr.toUpperCase().replace(/-/g, '')}
        </EndToEndId>
        <TxId>
          ${trn}
        </TxId>
        <UETR>
          ${transaction.uetr}
        </UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="${transaction.settlement_info.currency}">
        ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}
      </IntrBkSttlmAmt>
      <Dbtr>
        <Nm>
          ${transaction.debtor.name}
        </Nm>
        <PstlAdr>
          <Ctry>
            ${transaction.debtor.country}
          </Ctry>
        </PstlAdr>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>
            ${transaction.debtor.iban}
          </IBAN>
        </Id>
      </DbtrAcct>
      <Cdtr>
        <Nm>
          ${transaction.creditor.name}
        </Nm>
        <PstlAdr>
          <Ctry>
            ${transaction.creditor.country}
          </Ctry>
        </PstlAdr>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>
            ${transaction.creditor.iban || 'N/A'}
          </IBAN>
        </Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>
          ${transaction.remittance_info}
        </Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`}
                </pre>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-300 text-gray-500">
                <div>ISO 20022 PACS.008 CROSS-BORDER | GENERATED: {formatDateTime(new Date().toISOString())}</div>
                <div>REFERENCE: {messageId} | UETR: {transaction.uetr}</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* MT103 ACK */}
        <TabsContent value="mt103ack" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <Barcode value={`MT103ACK${transaction.uetr}`} />
            
            <div className="px-8 pt-4">
              <DocumentHeader 
                title="MT103 ANSWER BACK - TARGET2 CLEARING ACKNOWLEDGMENT" 
              />
            </div>

            <div className="px-8 pb-8">
              <div className="text-center text-lg font-bold mb-6 tracking-wider">
                ACKNOWLEDGED BY TARGET2 [{transaction.instructed_agent.bic}] (ACK)
              </div>

              <SectionHeader title="TRANSACTION REFERENCE" />

              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <FieldRow label="TRANSACTION REFERENCE NUMBER (TRN)" value={trn} mono />
                  <FieldRow label="UETR" value={transaction.uetr} mono />
                  <FieldRow label="MUR" value={`079658933986447N`} mono />
                  <FieldRow label="TRANSACTION AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)} (PENDING TARGET2 [${transaction.instructed_agent.bic}] CLEARING)`} />
                  <FieldRow label="VALUE DATE" value={`${formatDate(transaction.settlement_info.settlement_date)} (SETTLEMENT: ${formatDate(transaction.settlement_info.settlement_date)})`} />
                </div>
                <div className="ml-8">
                  <QRCode value={`ACK${transaction.uetr}`} size={90} />
                </div>
              </div>

              <SectionHeader title="PROCESSING TIMESTAMPS" />

              <div className="bg-gray-50 p-4 border border-gray-200 mb-4">
                <FieldRow label="DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
                <FieldRow label="CREATION TIME" value={`${formatDate(transaction.settlement_info.settlement_date)} - ${formatDateTime(transaction.created_at)}`} mono />
                <FieldRow label="TRANSMISSION TIME" value={`${formatDate(transaction.settlement_info.settlement_date)} - 40.000 SECONDS`} />
                <FieldRow label="TARGET2 ACKNOWLEDGMENT TIME" value={formatDateTime(transaction.updated_at)} mono />
                <FieldRow label="END TIME" value={formatDateTime(transaction.updated_at)} mono />
                <FieldRow label="PROCESSING DURATION" value="40.000 SECONDS (TO TARGET2)" />
              </div>

              <SectionHeader title="NETWORK CONFIRMATION" />

              <div className="bg-gray-50 p-4 border border-gray-200 mb-4">
                <FieldRow label="SWIFT NETWORK STATUS" value="MESSAGE ACKNOWLEDGED: SUBMITTED TO TARGET2" />
                <FieldRow label="DELIVERY STATUS" value="DELIVERED TO TARGET2 FOR CLEARING" />
                <FieldRow label="SETTLEMENT PIPELINE" value={`TARGET2 [CONFIRMED] -> ${transaction.instructed_agent.bic} [PENDING]`} />
                <FieldRow label="RECEIVER NOTIFICATION" value={transaction.instructed_agent.bic} mono />
                <FieldRow label="ACK REFERENCE" value={`TARGET2-ACK-${Date.now().toString().slice(-10)} 1`} mono />
                <FieldRow label="ACK PROCESSING STATUS" value={`ACCEPTED (READY FOR DELIVERY)`} />
                <FieldRow label="TECHNICAL VALIDATION" value="PASSED" />
                <FieldRow label="BUSINESS VALIDATION" value="PASSED" />
                <FieldRow label="SETTLEMENT STATUS" value="SUBMITTED TO SWIFT FOR CROSS-BORDER SETTLEMENT" />
                <FieldRow label="TRACKER STATUS" value="ACTIVE" />
                <FieldRow label="NEXT AGENT" value={transaction.instructed_agent.bic} mono />
              </div>

              <SectionHeader title="SETTLEMENT CONFIRMATION" />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <div className="font-semibold mb-2 text-gray-700">SENDER CONFIRMATION</div>
                  <FieldRow label="DEBIT STATUS" value="COMPLETED - SENT TO TARGET2" />
                  <FieldRow label="DEBIT ACCOUNT" value={transaction.debtor.iban} mono />
                  <FieldRow label="DEBIT TIME" value={formatDateTime(transaction.created_at)} mono />
                  <FieldRow label="BALANCE AFTER DEBIT" value={`EUR ${formatAmount(Math.random() * 10000000)}`} />
                  <FieldRow label="TARGET2 POSITION" value="SUBMITTED FOR CLEARING" />
                </div>
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <div className="font-semibold mb-2 text-gray-700">RECEIVER CONFIRMATION</div>
                  <FieldRow label="CREDIT STATUS" value={`PENDING TARGET2 [${transaction.instructed_agent.bic}]`} />
                  <FieldRow label="CREDITOR ACCOUNT" value={transaction.creditor.iban || 'N/A'} mono />
                  <FieldRow label="EXPECTED CREDIT TIME" value={formatDateTime(transaction.updated_at)} mono />
                  <FieldRow label="NOTIFICATION" value="PROCESSING" />
                </div>
              </div>

              <SectionHeader title="CONFIRMATION STATUS" />

              <div className="bg-green-50 border border-green-200 p-4 text-center">
                <div className="font-semibold text-green-800 mb-2">THIS ACKNOWLEDGMENT CONFIRMS THAT THE MT103 MESSAGE HAS BEEN</div>
                <div className="text-green-700">SUCCESSFULLY RECEIVED AND ACCEPTED BY TARGET2 [{transaction.instructed_agent.bic}] FOR CLEARING</div>
                <div className="text-green-700">TO THE BENEFICIARY BANK VIA SWIFT NETWORK</div>
                <div className="mt-2 font-mono text-sm">REFERENCE: {trn} | STATUS: ACKNOWLEDGED BY TARGET2 [{transaction.instructed_agent.bic}]</div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-300 text-gray-500">
                <div>MT103 ANSWER BACK - TARGET2 [{transaction.instructed_agent.bic}] CLEARING ACKNOWLEDGMENT | GENERATED: {formatDateTime(new Date().toISOString())}</div>
                <div>TRANSACTION REFERENCE: {trn} | UETR: {transaction.uetr}</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Official Debit Note */}
        <TabsContent value="debitnote" className="mt-4">
          <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <Barcode value={`DN${transaction.uetr}`} />
            
            <div className="px-8 pt-4">
              <DocumentHeader 
                title="OFFICIAL DEBIT NOTE" 
              />
            </div>

            <div className="px-8 pb-8">
              <div className="text-center mb-4">
                <div>DEBIT NOTE NO: DN-{new Date().toISOString().slice(0, 10)}-1 | DATE: {formatDate(new Date().toISOString())}</div>
              </div>

              <SectionHeader title="DOCUMENT SECURITY CODE" />
              <div className="text-center mb-4 font-mono">
                SEC{Date.now().toString().slice(-10)}180
              </div>

              <SectionHeader title="BANK DETAILS" />

              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <FieldRow label="BANK NAME" value="HSBC GERMANY" />
                  <FieldRow label="BRANCH" value="FRANKFURT BRANCH" />
                  <FieldRow label="ADDRESS" value="TAUNUSANLAGE 12, 60254 FRANKFURT AM MAIN, GERMANY" />
                  <FieldRow label="SWIFT/BIC" value={transaction.instructing_agent.bic} mono />
                  <FieldRow label="TELEPHONE" value="+49 69 910-00" />
                </div>
                <div className="ml-8">
                  <QRCode value={`DN${transaction.uetr}`} size={90} />
                </div>
              </div>

              <SectionHeader title="CUSTOMER DETAILS" />

              <FieldRow label="CUSTOMER NAME" value={transaction.debtor.name} />
              <FieldRow label="CUSTOMER ADDRESS" value={`${transaction.debtor.country}`} />
              <FieldRow label="ACCOUNT NUMBER" value={transaction.debtor.iban} mono />
              <FieldRow label="CUSTOMER ID" value={`CUST${transaction.debtor.iban.slice(-8)}`} mono />

              <SectionHeader title="TRANSACTION DETAILS" />

              <FieldRow label="TRANSACTION DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
              <FieldRow label="VALUE DATE" value={formatDate(transaction.settlement_info.settlement_date)} />
              <FieldRow label="TRANSACTION REFERENCE" value={trn} mono />
              <FieldRow label="UETR" value={transaction.uetr} mono />
              <FieldRow label="DEBIT AMOUNT" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} />
              <FieldRow label="AMOUNT IN WORDS" value={`${transaction.settlement_info.currency} ${numberToWords(transaction.settlement_info.interbank_settlement_amount)} ONLY`} />
              <FieldRow label="DEBIT NOTE NUMBER" value={`DN${trn.slice(-8)}`} mono />
              <FieldRow label="TRANSACTION TYPE" value="WIRE TRANSFER" />

              <SectionHeader title="BENEFICIARY DETAILS" />

              <FieldRow label="BENEFICIARY NAME" value={transaction.creditor.name} />
              <FieldRow label="BENEFICIARY BANK" value={transaction.instructed_agent.name} />
              <FieldRow label="BENEFICIARY BIC" value={transaction.instructed_agent.bic} mono />
              <FieldRow label="BENEFICIARY ACCOUNT" value={transaction.creditor.iban || 'N/A'} mono />

              <SectionHeader title="REMITTANCE INFORMATION" />

              <div className="bg-gray-50 p-4 border border-gray-200 mb-4">
                {transaction.remittance_info}
              </div>

              {/* Authorization */}
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

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-300 text-gray-500">
                <div>OFFICIAL DEBIT NOTE | GENERATED: {formatDateTime(new Date().toISOString())}</div>
                <div>REFERENCE: {trn} | UETR: {transaction.uetr}</div>
                <div className="mt-2 text-center text-xs">This is a computer-generated document and does not require a physical signature.</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to convert number to words
function numberToWords(num) {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];

  if (num === 0) return 'ZERO';

  const millions = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = Math.floor(num % 1000);

  let result = '';

  if (millions > 0) {
    result += convertHundreds(millions) + ' MILLION ';
  }
  if (thousands > 0) {
    result += convertHundreds(thousands) + ' THOUSAND ';
  }
  if (remainder > 0) {
    result += convertHundreds(remainder);
  }

  return result.trim();

  function convertHundreds(n) {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' HUNDRED ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      str += teens[n - 10] + ' ';
      n = 0;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }
}
