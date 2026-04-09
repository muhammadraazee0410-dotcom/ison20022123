import { QRCodeSVG } from "qrcode.react";
import { DocWrap, IsoLogo, DocBanner, FieldRow, SectionHeader, CheckItem, DocFooter, formatAmount, formatDate, formatDateLong, formatDateTime, getTrn, getMsgId } from "./DocHelpers";

// Barcode Component
const Barcode = ({ value }) => {
  const bars = value.split('').map((c, i) => {
    const code = c.charCodeAt(0);
    return [(code % 4) + 1, ((code * 2) % 3) + 1, ((code * 3) % 4) + 1];
  }).flat();

  return (
    <div className="flex justify-center items-center py-4 bg-white">
      <div className="flex h-12">
        {bars.slice(0, 80).map((w, i) => (
          <div key={i} className={`h-12 ${i % 2 === 0 ? 'bg-black' : 'bg-white'}`} style={{ width: `${w}px` }} />
        ))}
      </div>
    </div>
  );
};

// QR Code
const QR = ({ value, size = 80 }) => (
  <div className="bg-white p-2 border border-gray-300" style={{ width: size + 16, height: size + 16 }}>
    <QRCodeSVG value={`SWIFT-TXN:${value}`} size={size} level="H" bgColor="#FFFFFF" fgColor="#000000" />
  </div>
);

// Complete Transaction Summary block - used in all brief docs
const TxnSummary = ({ transaction, trn, messageId }) => (
  <>
    <SectionHeader title="TRANSACTION REFERENCES" />
    <div className="mb-4">
      <FieldRow label="Message Type" value={transaction.message_type} />
      <FieldRow label="Business Service" value={transaction.business_service} />
      <FieldRow label="UETR" value={transaction.uetr} mono />
      <FieldRow label="Message Identification" value={messageId} mono />
      <FieldRow label="End-To-End ID" value={transaction.uetr.toUpperCase().replace(/-/g, '')} mono />
      <FieldRow label="SWIFT Reference" value={`SWIFT${trn.slice(-10)}`} mono />
      <FieldRow label="CBPR+ Compliance" value={transaction.cbpr_compliant ? "CONFIRMED" : "PENDING"} />
    </div>

    <SectionHeader title="SETTLEMENT DETAILS" />
    <div className="mb-4">
      <FieldRow label="Settlement Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
      <FieldRow label="Settlement Method" value={transaction.settlement_info.method} />
      <FieldRow label="Settlement Priority" value={transaction.settlement_info.priority} />
      <FieldRow label="Settlement Date" value={formatDateLong(transaction.settlement_info.settlement_date)} />
    </div>

    <SectionHeader title="PARTICIPATING INSTITUTIONS" />
    <div className="mb-4">
      <FieldRow label="Sender Bank" value={transaction.instructing_agent.name} />
      <FieldRow label="Sender BIC" value={transaction.instructing_agent.bic} mono />
      <FieldRow label="Receiver Bank" value={transaction.instructed_agent.name} />
      <FieldRow label="Receiver BIC" value={transaction.instructed_agent.bic} mono />
    </div>

    <SectionHeader title="DEBTOR / CREDITOR" />
    <div className="mb-4">
      <FieldRow label="Debtor Name" value={transaction.debtor.name} />
      <FieldRow label="Debtor IBAN" value={transaction.debtor.iban} mono />
      <FieldRow label="Creditor Name" value={transaction.creditor.name} />
      <FieldRow label="Creditor IBAN" value={transaction.creditor.iban || 'N/A'} mono />
      <FieldRow label="Remittance Info" value={transaction.remittance_info} />
    </div>

    <SectionHeader title="STATUS" />
    <div className="mb-4">
      <FieldRow label="Transaction Status" value={transaction.status} />
      <FieldRow label="Tracking Result" value={transaction.tracking_result} />
      <FieldRow label="Nostro Credited" value={transaction.nostro_credited ? "YES" : "NO"} />
      <FieldRow label="Vostro Debited" value={transaction.vostro_debited ? "YES" : "NO"} />
      <FieldRow label="Network ACK" value={transaction.network_ack ? "CONFIRMED" : "PENDING"} />
      <FieldRow label="Reversal Possibility" value={transaction.reversal_possibility} />
    </div>
  </>
);

// ============================================================
// 23 Brief Document Tab Components
// ============================================================

export const PaymentTracer = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="SWIFT gpi PAYMENT TRACER" subtitle="(END-TO-END PAYMENT TRACKING REPORT)" />
      <div className="mb-4">
        <FieldRow label="Trace ID" value={`GPT-${trn}`} mono />
        <FieldRow label="Trace Initiated" value={formatDateTime(new Date().toISOString())} />
        <FieldRow label="Trace Status" value={transaction.tracking_result} />
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="gpi TRACKING CHAIN" />
      <div className="space-y-1 mb-4 border border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full" /><span className="font-bold">1.</span> {transaction.debtor.name} — DEBITED</div>
        <div className="text-gray-400 ml-2">|</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full" /><span className="font-bold">2.</span> {transaction.instructing_agent.bic} (Sender) — FORWARDED</div>
        <div className="text-gray-400 ml-2">|</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full" /><span className="font-bold">3.</span> SWIFT NETWORK (gpi) — TRANSMITTED</div>
        <div className="text-gray-400 ml-2">|</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full" /><span className="font-bold">4.</span> {transaction.instructed_agent.bic} (Receiver) — RECEIVED</div>
        <div className="text-gray-400 ml-2">|</div>
        <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${transaction.tracking_result === "SUCCESSFUL" ? "bg-green-500" : "bg-yellow-500"}`} /><span className="font-bold">5.</span> {transaction.creditor.name} — {transaction.tracking_result === "SUCCESSFUL" ? "CREDITED" : "PENDING"}</div>
      </div>
      <DocFooter text="END OF PAYMENT TRACER" />
    </DocWrap>
  );
};

export const MT202COV = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <Barcode value={`MT202COV-${transaction.uetr}`} />
      <IsoLogo />
      <DocBanner title="MT202 COV - GENERAL FINANCIAL INSTITUTION TRANSFER" subtitle="(COVER PAYMENT FOR UNDERLYING CUSTOMER CREDIT TRANSFER)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="MT202 COV MESSAGE FIELDS" />
      <div className="bg-gray-50 border border-gray-200 p-4 mb-4">
        <FieldRow label="Field 20 (TRN)" value={trn} mono />
        <FieldRow label="Field 21 (Related Ref)" value={`REL${trn.slice(-10)}`} mono />
        <FieldRow label="Field 32A (Value/Ccy/Amt)" value={`${transaction.settlement_info.settlement_date.replace(/-/g, '')} ${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
        <FieldRow label="Field 52A (Ordering Inst)" value={transaction.instructing_agent.bic} mono />
        <FieldRow label="Field 58A (Ben Inst)" value={transaction.instructed_agent.bic} mono />
      </div>
      <SectionHeader title="COVER SEQUENCE (SEQ B)" />
      <div className="bg-gray-50 border border-gray-200 p-4 mb-4">
        <FieldRow label="Field 50A (Ordering Cust)" value={transaction.debtor.name} />
        <FieldRow label="Field 59 (Beneficiary)" value={transaction.creditor.name} />
        <FieldRow label="Field 70 (Remittance)" value={transaction.remittance_info} />
      </div>
      <DocFooter text="END OF MT202 COV" />
    </DocWrap>
  );
};

export const AFTValidation = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="AFT VALIDATION REPORT" subtitle="(AUTOMATED FORMAT & TRANSLATION CHECK)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="VALIDATION RESULTS" />
      <div className="space-y-2 mb-4">
        {[
          ["V001", "Message Format Check (ISO 20022)", "PASS", "XML Schema Valid"],
          ["V002", "CBPR+ Business Rules", "PASS", "All rules satisfied"],
          ["V003", "BIC Directory Lookup (Sender)", "PASS", transaction.instructing_agent.bic],
          ["V004", "BIC Directory Lookup (Receiver)", "PASS", transaction.instructed_agent.bic],
          ["V005", "IBAN Validation (Debtor)", "PASS", "Checksum OK"],
          ["V006", "Settlement Amount Format", "PASS", "Decimal/Currency valid"],
          ["V007", "UETR Format (UUID v4)", "PASS", "Format verified"],
          ["V008", "Duplicate Detection", "PASS", "No duplicate found"],
          ["V009", "Sanctions Screening", "PASS", "CLEARED"],
          ["V010", "AML/CFT Check", "PASS", "No flags raised"],
        ].map(([code, desc, status, detail]) => (
          <div key={code} className="flex text-xs font-mono py-0.5">
            <span className="w-16 text-gray-500">{code}</span>
            <span className="flex-1 text-gray-700">{desc}</span>
            <span className="w-40 text-right"><span className="text-green-600">{status}</span> <span className="text-gray-400">[{detail}]</span></span>
          </div>
        ))}
      </div>
      <div className="bg-green-50 border border-green-300 p-3 text-center font-bold text-green-800 mb-4">ALL VALIDATIONS PASSED - MESSAGE APPROVED FOR TRANSMISSION</div>
      <DocFooter text="END OF AFT VALIDATION REPORT" />
    </DocWrap>
  );
};

export const MT103AnswerBack = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="MT103 ANSWER BACK" subtitle="(CUSTOMER PAYMENT CONFIRMATION)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="MT103 ANSWER BACK DETAILS" />
      <div className="bg-gray-50 border border-gray-200 p-4 mb-4">
        <FieldRow label="Answer Back Status" value="CONFIRMED BY RECEIVER" />
        <FieldRow label="Delivery Time" value={formatDateTime(transaction.updated_at || transaction.created_at)} mono />
        <FieldRow label="ACK Reference" value={`ACK${trn.slice(-10)}`} mono />
        <FieldRow label="Credit Applied" value="YES - BENEFICIARY ACCOUNT CREDITED" />
      </div>
      <DocFooter text="END OF MT103 ANSWER BACK" />
    </DocWrap>
  );
};

export const PACS008XML = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="PACS.008 XML MESSAGE" subtitle="(FI TO FI CUSTOMER CREDIT TRANSFER)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="XML MESSAGE STRUCTURE" />
      <div className="bg-gray-50 border border-gray-200 p-4 mb-4 font-mono text-xs whitespace-pre-wrap">
{`<FIToFICstmrCdtTrf>
  <GrpHdr>
    <MsgId>${messageId}</MsgId>
    <CreDtTm>${formatDateTime(transaction.created_at)}</CreDtTm>
    <NbOfTxs>1</NbOfTxs>
    <SttlmInf><SttlmMtd>${transaction.settlement_info.method}</SttlmMtd></SttlmInf>
  </GrpHdr>
  <CdtTrfTxInf>
    <PmtId>
      <InstrId>INST${trn}</InstrId>
      <EndToEndId>${transaction.uetr.toUpperCase().replace(/-/g, '')}</EndToEndId>
      <UETR>${transaction.uetr}</UETR>
    </PmtId>
    <IntrBkSttlmAmt Ccy="${transaction.settlement_info.currency}">${formatAmount(transaction.settlement_info.interbank_settlement_amount)}</IntrBkSttlmAmt>
    <IntrBkSttlmDt>${transaction.settlement_info.settlement_date}</IntrBkSttlmDt>
    <InstgAgt><FinInstnId><BICFI>${transaction.instructing_agent.bic}</BICFI></FinInstnId></InstgAgt>
    <InstdAgt><FinInstnId><BICFI>${transaction.instructed_agent.bic}</BICFI></FinInstnId></InstdAgt>
    <Dbtr><Nm>${transaction.debtor.name}</Nm></Dbtr>
    <DbtrAcct><Id><IBAN>${transaction.debtor.iban}</IBAN></Id></DbtrAcct>
    <Cdtr><Nm>${transaction.creditor.name}</Nm></Cdtr>
    <CdtrAcct><Id><IBAN>${transaction.creditor.iban || 'N/A'}</IBAN></Id></CdtrAcct>
    <RmtInf><Ustrd>${transaction.remittance_info}</Ustrd></RmtInf>
  </CdtTrfTxInf>
</FIToFICstmrCdtTrf>`}
      </div>
      <DocFooter text="END OF PACS.008 XML" />
    </DocWrap>
  );
};

export const M1Fund = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="M1 FUND ALLOCATION REPORT" subtitle="(IMMEDIATE SETTLEMENT FUND ALLOCATION)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="FUND MOVEMENT" />
      <div className="space-y-2 mb-4">
        <div className="flex justify-between bg-blue-50 p-2 border border-blue-200"><span>Nostro Account Debit</span><span className="font-bold">CONFIRMED</span></div>
        <div className="flex justify-between bg-blue-50 p-2 border border-blue-200"><span>Vostro Account Credit</span><span className="font-bold">CONFIRMED</span></div>
        <div className="flex justify-between bg-blue-50 p-2 border border-blue-200"><span>Interbank Settlement</span><span className="font-bold">COMPLETED</span></div>
        <div className="flex justify-between bg-green-50 p-2 border border-green-200"><span>M1 Fund Status</span><span className="text-green-700 font-bold">ALLOCATED</span></div>
      </div>
      <DocFooter text="END OF M1 FUND REPORT" />
    </DocWrap>
  );
};

export const ServerReport = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="SWIFT SERVER PROCESSING REPORT" subtitle="(ALLIANCE GATEWAY SERVER LOG)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="SERVER PROCESSING LOG" />
      <div className="bg-gray-900 text-green-400 p-4 font-mono text-xs mb-4 rounded">
        <div>[{formatDateTime(transaction.created_at)}] RECEIVED: {transaction.message_type} from {transaction.instructing_agent.bic}</div>
        <div>[{formatDateTime(transaction.created_at)}] VALIDATION: Format check PASSED</div>
        <div>[{formatDateTime(transaction.created_at)}] VALIDATION: BIC lookup PASSED</div>
        <div>[{formatDateTime(transaction.created_at)}] VALIDATION: IBAN check PASSED</div>
        <div>[{formatDateTime(transaction.created_at)}] SANCTIONS: Screening CLEARED</div>
        <div>[{formatDateTime(transaction.created_at)}] ROUTING: Message routed to {transaction.instructed_agent.bic}</div>
        <div>[{formatDateTime(transaction.created_at)}] DELIVERY: Network ACK received</div>
        <div>[{formatDateTime(transaction.created_at)}] SETTLEMENT: {transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)} SETTLED</div>
        <div>[{formatDateTime(transaction.created_at)}] STATUS: FINALIZED - No errors</div>
      </div>
      <SectionHeader title="SERVER METRICS" />
      <div className="mb-4">
        <FieldRow label="Processing Time" value="0.847 seconds" />
        <FieldRow label="Queue Position" value="1 of 1" />
        <FieldRow label="Server Instance" value="SAAPROD-GW01" />
        <FieldRow label="Gateway Version" value="Alliance Gateway v7.8.20" />
      </div>
      <DocFooter text="END OF SERVER REPORT" />
    </DocWrap>
  );
};

export const FundsTracer = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="FUNDS TRACER REPORT" subtitle="(FUND FLOW CHAIN ANALYSIS)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="FUND FLOW CHAIN" />
      <div className="space-y-1 mb-4 border border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full" /><span className="font-bold">STEP 1:</span> {transaction.debtor.name} (Debtor) — DEBITED</div>
        <div className="text-gray-400 ml-2">|</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full" /><span className="font-bold">STEP 2:</span> {transaction.instructing_agent.bic} (Sender Bank) — FORWARDED</div>
        <div className="text-gray-400 ml-2">|</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full" /><span className="font-bold">STEP 3:</span> SWIFT NETWORK (gpi) — TRANSMITTED</div>
        <div className="text-gray-400 ml-2">|</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full" /><span className="font-bold">STEP 4:</span> {transaction.instructed_agent.bic} (Receiver Bank) — RECEIVED</div>
        <div className="text-gray-400 ml-2">|</div>
        <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${transaction.tracking_result === "SUCCESSFUL" ? "bg-green-500" : "bg-yellow-500"}`} /><span className="font-bold">STEP 5:</span> {transaction.creditor.name} — {transaction.tracking_result === "SUCCESSFUL" ? "CREDITED" : "PENDING"}</div>
      </div>
      <FieldRow label="FINAL STATUS" value={transaction.tracking_result} />
      <FieldRow label="FUNDS LOCATION" value={transaction.tracking_result === "SUCCESSFUL" ? "BENEFICIARY ACCOUNT" : "IN TRANSIT"} />
      <DocFooter text="END OF FUNDS TRACER" />
    </DocWrap>
  );
};

export const FundLocation = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="FUND LOCATION REPORT" subtitle="(REAL-TIME FUND POSITION)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="CURRENT LOCATION" />
      <div className="bg-blue-50 p-4 border border-blue-200 mb-4">
        <div className="font-bold mb-2">FUND STATUS: {transaction.tracking_result === "SUCCESSFUL" ? "DELIVERED TO BENEFICIARY" : "IN TRANSIT"}</div>
        <FieldRow label="Institution" value={transaction.tracking_result === "SUCCESSFUL" ? transaction.instructed_agent.name : "SWIFT NETWORK"} />
        <FieldRow label="BIC" value={transaction.tracking_result === "SUCCESSFUL" ? transaction.instructed_agent.bic : "SWIFT gpi TRACKER"} mono />
        <FieldRow label="Account" value={transaction.tracking_result === "SUCCESSFUL" ? (transaction.creditor.iban || 'N/A') : "INTERMEDIARY NOSTRO"} mono />
      </div>
      <SectionHeader title="LOCATION HISTORY" />
      <div className="space-y-2 mb-4">
        <div className="flex justify-between p-2 border-b"><span>Debtor Account ({transaction.debtor.iban?.slice(0, 10)}...)</span><span>DEBITED</span><span className="text-gray-500">{formatDate(transaction.settlement_info.settlement_date)}</span></div>
        <div className="flex justify-between p-2 border-b"><span>Sender Nostro ({transaction.instructing_agent.bic})</span><span>TRANSFERRED</span><span className="text-gray-500">{formatDate(transaction.settlement_info.settlement_date)}</span></div>
        <div className="flex justify-between p-2 border-b"><span>Receiver Vostro ({transaction.instructed_agent.bic})</span><span>RECEIVED</span><span className="text-gray-500">{formatDate(transaction.settlement_info.settlement_date)}</span></div>
        <div className="flex justify-between p-2 border-b"><span>Beneficiary ({transaction.creditor.iban?.slice(0, 10) || 'N/A'}...)</span><span className="text-green-700 font-bold">{transaction.tracking_result === "SUCCESSFUL" ? "CREDITED" : "PENDING"}</span><span className="text-gray-500">{formatDate(new Date().toISOString())}</span></div>
      </div>
      <DocFooter text="END OF FUND LOCATION REPORT" />
    </DocWrap>
  );
};

export const BeneficiaryCredit = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <Barcode value={`BENCR-${transaction.uetr}`} />
      <IsoLogo />
      <DocBanner title="BENEFICIARY CREDIT ADVICE" subtitle="(CREDIT NOTIFICATION TO BENEFICIARY)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="CREDIT CONFIRMATION" />
      <div className="bg-green-50 border border-green-300 p-4 mb-4">
        <FieldRow label="Amount Credited" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
        <FieldRow label="Credit Date" value={formatDateLong(transaction.settlement_info.settlement_date)} />
        <FieldRow label="Beneficiary" value={transaction.creditor.name} />
        <FieldRow label="Beneficiary IBAN" value={transaction.creditor.iban || 'N/A'} mono />
        <FieldRow label="Credit Status" value="APPLIED TO ACCOUNT" />
      </div>
      <DocFooter text="END OF BENEFICIARY CREDIT ADVICE" />
    </DocWrap>
  );
};

export const DocClearance = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="DOCUMENT CLEARANCE CERTIFICATE" subtitle="(COMPLIANCE & CLEARANCE VERIFICATION)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="CLEARANCE STATUS" />
      <div className="space-y-2 mb-4">
        {[
          ["Sanctions Screening", "CLEARED"],
          ["AML/CFT Check", "PASSED"],
          ["KYC Verification", "VERIFIED"],
          ["OFAC List Check", "NO MATCH"],
          ["EU Sanctions Check", "NO MATCH"],
          ["PEP Screening", "CLEARED"],
          ["Document Authentication", "VERIFIED"],
          ["Compliance Officer Sign-off", "APPROVED"],
        ].map(([label, status]) => (
          <div key={label} className="flex justify-between bg-green-50 p-2 border border-green-200">
            <span>{label}</span><span className="text-green-700 font-bold">{status}</span>
          </div>
        ))}
      </div>
      <div className="bg-green-100 border border-green-400 p-3 text-center font-bold text-green-900 mb-4">DOCUMENT FULLY CLEARED - NO HOLDS OR RESTRICTIONS</div>
      <DocFooter text="END OF CLEARANCE CERTIFICATE" />
    </DocWrap>
  );
};

export const SMTPMail = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="SMTP MAIL NOTIFICATION LOG" subtitle="(EMAIL DELIVERY CONFIRMATION)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="EMAIL DELIVERY LOG" />
      <div className="bg-gray-50 border border-gray-200 p-4 mb-4">
        <FieldRow label="From" value="noreply@swift-alliance.net" />
        <FieldRow label="To" value="operations@correspondent-bank.com" />
        <FieldRow label="Subject" value={`SWIFT Confirmation - UETR: ${transaction.uetr}`} />
        <FieldRow label="Sent At" value={formatDateTime(new Date().toISOString())} />
        <FieldRow label="SMTP Status" value="250 OK - Delivered" />
        <FieldRow label="Message-ID" value={`<${messageId}@swift-alliance.net>`} mono />
        <FieldRow label="Encryption" value="TLS 1.3" />
        <FieldRow label="DKIM" value="PASS" />
        <FieldRow label="SPF" value="PASS" />
      </div>
      <DocFooter text="END OF SMTP LOG" />
    </DocWrap>
  );
};

export const OnLedger = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="ON-LEDGER POSTING CONFIRMATION" subtitle="(GENERAL LEDGER ENTRY RECORD)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="LEDGER ENTRIES" />
      <div className="border border-gray-200 mb-4">
        <div className="bg-gray-100 p-2 font-bold grid grid-cols-5 text-center"><span>DATE</span><span>ACCOUNT</span><span>DEBIT</span><span>CREDIT</span><span>REF</span></div>
        <div className="p-2 grid grid-cols-5 text-center border-b">
          <span>{formatDate(transaction.settlement_info.settlement_date)}</span>
          <span className="font-mono">{transaction.debtor.iban?.slice(-8)}</span>
          <span className="text-red-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span>
          <span>-</span>
          <span className="font-mono text-xs">{trn.slice(-8)}</span>
        </div>
        <div className="p-2 grid grid-cols-5 text-center border-b">
          <span>{formatDate(transaction.settlement_info.settlement_date)}</span>
          <span className="font-mono">{transaction.creditor.iban?.slice(-8) || 'NOSTRO'}</span>
          <span>-</span>
          <span className="text-green-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span>
          <span className="font-mono text-xs">{trn.slice(-8)}</span>
        </div>
        <div className="p-2 grid grid-cols-5 text-center bg-blue-50 font-bold">
          <span>NET</span><span>-</span>
          <span className="text-red-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span>
          <span className="text-green-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span>
          <span>BALANCED</span>
        </div>
      </div>
      <FieldRow label="Posting Status" value="CONFIRMED - LEDGER BALANCED" />
      <DocFooter text="END OF ON-LEDGER POSTING" />
    </DocWrap>
  );
};

export const OfficerComm = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="OFFICER COMMUNICATION RECORD" subtitle="(INTERNAL BANK COMMUNICATION LOG)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="COMMUNICATION LOG" />
      <div className="space-y-3 mb-4">
        <div className="border border-gray-200 p-3 bg-gray-50">
          <div className="font-bold text-gray-700">Operations Desk</div>
          <div className="text-gray-500 text-xs">{formatDateTime(transaction.created_at)}</div>
          <div className="mt-1">Transaction {transaction.uetr} received and validated. Amount: {transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)}. Proceeding with settlement.</div>
        </div>
        <div className="border border-gray-200 p-3 bg-gray-50">
          <div className="font-bold text-gray-700">Compliance Officer</div>
          <div className="text-gray-500 text-xs">{formatDateTime(transaction.created_at)}</div>
          <div className="mt-1">Sanctions screening completed. No matches found. AML check passed. Transaction approved for processing.</div>
        </div>
        <div className="border border-gray-200 p-3 bg-gray-50">
          <div className="font-bold text-gray-700">Settlement Desk</div>
          <div className="text-gray-500 text-xs">{formatDateTime(transaction.updated_at || transaction.created_at)}</div>
          <div className="mt-1">Settlement confirmed. Nostro/Vostro entries posted. Network ACK received. Transaction FINALIZED.</div>
        </div>
      </div>
      <DocFooter text="END OF OFFICER COMMUNICATION" />
    </DocWrap>
  );
};

export const MT900Debit = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <Barcode value={`MT900-${transaction.uetr}`} />
      <IsoLogo />
      <DocBanner title="MT900 - CONFIRMATION OF DEBIT" subtitle="(VOSTRO ACCOUNT DEBIT NOTIFICATION)" />
      <div className="bg-red-50 border-2 border-red-600 p-4 mb-6 text-center">
        <div className="text-sm text-red-700 font-medium">DEBIT CONFIRMED</div>
        <div className="text-3xl font-bold text-red-800 mt-1">{transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)}</div>
        <div className="text-sm text-red-600 mt-1">Debited from Vostro Account on {formatDateLong(transaction.settlement_info.settlement_date)}</div>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="MT900 MESSAGE FIELDS" />
      <div className="bg-gray-50 border border-gray-200 p-4 mb-4">
        <FieldRow label="Field 20 (TRN)" value={`MT900${trn.slice(-8)}`} mono />
        <FieldRow label="Field 21 (Related Ref)" value={trn} mono />
        <FieldRow label="Field 25 (Account)" value={transaction.debtor.iban} mono />
        <FieldRow label="Field 32A (Value/Ccy/Amt)" value={`${transaction.settlement_info.settlement_date.replace(/-/g, '')} ${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
        <FieldRow label="Field 52A (Ordering Inst)" value={transaction.instructing_agent.bic} mono />
      </div>
      <DocFooter text="END OF MT900 DEBIT CONFIRMATION" />
    </DocWrap>
  );
};

export const MT910Credit = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <Barcode value={`MT910-${transaction.uetr}`} />
      <IsoLogo />
      <DocBanner title="MT910 - CONFIRMATION OF CREDIT" subtitle="(NOSTRO ACCOUNT CREDIT NOTIFICATION)" />
      <div className="bg-green-50 border-2 border-green-600 p-4 mb-6 text-center">
        <div className="text-sm text-green-700 font-medium">CREDIT CONFIRMED</div>
        <div className="text-3xl font-bold text-green-800 mt-1">{transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)}</div>
        <div className="text-sm text-green-600 mt-1">Credited to Nostro Account on {formatDateLong(transaction.settlement_info.settlement_date)}</div>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="MT910 MESSAGE FIELDS" />
      <div className="bg-gray-50 border border-gray-200 p-4 mb-4">
        <FieldRow label="Field 20 (TRN)" value={`MT910${trn.slice(-8)}`} mono />
        <FieldRow label="Field 21 (Related Ref)" value={trn} mono />
        <FieldRow label="Field 25 (Account)" value={transaction.debtor.iban} mono />
        <FieldRow label="Field 32A (Value/Ccy/Amt)" value={`${transaction.settlement_info.settlement_date.replace(/-/g, '')} ${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
        <FieldRow label="Field 52A (Ordering Inst)" value={transaction.instructed_agent.bic} mono />
      </div>
      <DocFooter text="END OF MT910 CREDIT CONFIRMATION" />
    </DocWrap>
  );
};

export const MT940Statement = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <Barcode value={`MT940-${transaction.uetr}`} />
      <IsoLogo />
      <DocBanner title="MT940 - CUSTOMER STATEMENT MESSAGE" subtitle="(ACCOUNT STATEMENT WITH TRANSACTION ENTRIES)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="STATEMENT ENTRIES" />
      <div className="border border-gray-200 mb-4">
        <div className="bg-gray-100 p-2 font-bold grid grid-cols-6 text-center text-xs"><span>DATE</span><span>TYPE</span><span>REF</span><span>DEBIT</span><span>CREDIT</span><span>BAL</span></div>
        <div className="p-2 grid grid-cols-6 text-center text-xs border-b">
          <span>{formatDate(transaction.settlement_info.settlement_date)}</span>
          <span>SWIFT</span>
          <span className="font-mono">{trn.slice(-8)}</span>
          <span className="text-red-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span>
          <span>-</span>
          <span>DR</span>
        </div>
        <div className="p-2 grid grid-cols-6 text-center text-xs border-b">
          <span>{formatDate(transaction.settlement_info.settlement_date)}</span>
          <span>SETTL</span>
          <span className="font-mono">SETTL-{trn.slice(-6)}</span>
          <span>-</span>
          <span className="text-green-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span>
          <span>CR</span>
        </div>
      </div>
      <SectionHeader title="MT940 FIELDS" />
      <div className="bg-gray-50 border border-gray-200 p-4 mb-4">
        <FieldRow label="Field 20 (TRN)" value={`STMT${trn.slice(-8)}`} mono />
        <FieldRow label="Field 25 (Account)" value={transaction.debtor.iban} mono />
        <FieldRow label="Field 28C (Statement No)" value="001/001" />
        <FieldRow label="Field 60F (Opening Bal)" value={`C${transaction.settlement_info.settlement_date.replace(/-/g, '')}${transaction.settlement_info.currency}0,00`} mono />
        <FieldRow label="Field 62F (Closing Bal)" value={`C${transaction.settlement_info.settlement_date.replace(/-/g, '')}${transaction.settlement_info.currency}0,00`} mono />
      </div>
      <DocFooter text="END OF MT940 STATEMENT" />
    </DocWrap>
  );
};

export const DebitNote = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <Barcode value={`DN-${transaction.uetr}`} />
      <IsoLogo />
      <DocBanner title="OFFICIAL DEBIT NOTE" subtitle="(ACCOUNT DEBIT NOTIFICATION)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="DEBIT DETAILS" />
      <div className="bg-red-50 border border-red-200 p-4 mb-4">
        <FieldRow label="Debit Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
        <FieldRow label="Debit Date" value={formatDateLong(transaction.settlement_info.settlement_date)} />
        <FieldRow label="Account Debited" value={transaction.debtor.iban} mono />
        <FieldRow label="Account Holder" value={transaction.debtor.name} />
        <FieldRow label="Reason" value={`SWIFT ${transaction.message_type} - ${transaction.remittance_info}`} />
        <FieldRow label="Authorization" value="SYSTEM AUTHORIZED" />
      </div>
      <DocFooter text="END OF DEBIT NOTE" />
    </DocWrap>
  );
};

export const BalanceSheet = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  const amt = transaction.settlement_info.interbank_settlement_amount;
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="TRANSACTION BALANCE SHEET" subtitle="(ASSET & LIABILITY IMPACT REPORT)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="BALANCE IMPACT" />
      <div className="border border-gray-200 mb-4">
        <div className="bg-gray-100 p-2 font-bold grid grid-cols-4 text-center"><span>ITEM</span><span>DEBIT</span><span>CREDIT</span><span>NET</span></div>
        <div className="p-2 grid grid-cols-4 text-center border-b"><span>Nostro Account</span><span>-</span><span className="text-green-700">{formatAmount(amt)}</span><span className="text-green-700">+{formatAmount(amt)}</span></div>
        <div className="p-2 grid grid-cols-4 text-center border-b"><span>Vostro Account</span><span className="text-red-700">{formatAmount(amt)}</span><span>-</span><span className="text-red-700">-{formatAmount(amt)}</span></div>
        <div className="p-2 grid grid-cols-4 text-center bg-blue-50 font-bold"><span>NET POSITION</span><span className="text-red-700">{formatAmount(amt)}</span><span className="text-green-700">{formatAmount(amt)}</span><span>0.00</span></div>
      </div>
      <div className="bg-green-100 border border-green-300 p-3 text-center font-bold text-green-900 mb-4">BALANCE SHEET BALANCED - NO DISCREPANCIES</div>
      <DocFooter text="END OF BALANCE SHEET" />
    </DocWrap>
  );
};

export const RemittanceReport = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="REMITTANCE ADVICE REPORT" subtitle="(PAYMENT REMITTANCE INFORMATION)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="REMITTANCE DETAILS" />
      <div className="bg-gray-50 border border-gray-200 p-4 mb-4">
        <FieldRow label="Remittance Type" value="UNSTRUCTURED" />
        <FieldRow label="Remittance Info" value={transaction.remittance_info} />
        <FieldRow label="Payment Purpose" value={transaction.remittance_info} />
        <FieldRow label="Charges" value="SHA (Shared between parties)" />
        <FieldRow label="Exchange Rate" value="N/A (Single currency)" />
        <FieldRow label="Instructed Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
      </div>
      <DocFooter text="END OF REMITTANCE REPORT" />
    </DocWrap>
  );
};

export const CreditNotification = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <Barcode value={`CRNOTIF-${transaction.uetr}`} />
      <IsoLogo />
      <DocBanner title="CREDIT NOTIFICATION" subtitle="(INCOMING PAYMENT CREDIT NOTICE)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="CREDIT NOTICE" />
      <div className="bg-green-50 border-2 border-green-500 p-4 mb-4 text-center">
        <div className="text-green-800 font-bold text-lg">INCOMING CREDIT</div>
        <div className="text-2xl font-bold text-green-900 mt-1">{transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)}</div>
        <div className="text-green-700 mt-1">From: {transaction.debtor.name}</div>
        <div className="text-green-700">To: {transaction.creditor.name}</div>
        <div className="text-green-600 mt-1">Credited on {formatDateLong(transaction.settlement_info.settlement_date)}</div>
      </div>
      <DocFooter text="END OF CREDIT NOTIFICATION" />
    </DocWrap>
  );
};

export const IntermediaryBank = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="INTERMEDIARY BANK REPORT" subtitle="(CORRESPONDENT BANK ROUTING & PROCESSING)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="INTERMEDIARY PROCESSING LOG" />
      <div className="space-y-2 mb-4">
        {[
          ["Message Received from Sender", "ACK"],
          ["Format Validation (ISO 20022)", "VALID"],
          ["BIC Routing Verified", "CONFIRMED"],
          ["Sanctions / Compliance", "CLEARED"],
          ["Forwarded to Receiver", "DELIVERED"],
          ["Receiver Acknowledgment", "ACK RECEIVED"],
        ].map(([label, status]) => (
          <div key={label} className="flex justify-between bg-green-50 p-2 border border-green-200">
            <span>{label}</span><span className="text-green-700 font-bold">{status}</span>
          </div>
        ))}
      </div>
      <FieldRow label="Intermediary BIC" value="COBADEFFXXX" mono />
      <FieldRow label="Charges Allocation" value="SHA (Shared between parties)" />
      <DocFooter text="END OF INTERMEDIARY BANK REPORT" />
    </DocWrap>
  );
};

export const NostroAccountDetail = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner title="NOSTRO / VOSTRO COMMON ACCOUNT DETAIL" subtitle="(ACCOUNT RECONCILIATION REPORT)" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="NOSTRO ACCOUNT (OUR ACCOUNT AT CORRESPONDENT)" />
      <div className="bg-blue-50 p-4 border border-blue-200 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldRow label="Account Holder" value={transaction.instructing_agent.name} />
            <FieldRow label="BIC" value={transaction.instructing_agent.bic} mono />
            <FieldRow label="Held At" value={transaction.instructed_agent.name} />
          </div>
          <div>
            <FieldRow label="Currency" value={transaction.settlement_info.currency} />
            <FieldRow label="Account Type" value="NOSTRO (Mirror)" />
            <FieldRow label="Status" value="ACTIVE / RECONCILED" />
          </div>
        </div>
      </div>
      <SectionHeader title="VOSTRO ACCOUNT (THEIR ACCOUNT AT OUR BANK)" />
      <div className="bg-purple-50 p-4 border border-purple-200 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldRow label="Account Holder" value={transaction.instructed_agent.name} />
            <FieldRow label="BIC" value={transaction.instructed_agent.bic} mono />
            <FieldRow label="Held At" value={transaction.instructing_agent.name} />
          </div>
          <div>
            <FieldRow label="Currency" value={transaction.settlement_info.currency} />
            <FieldRow label="Account Type" value="VOSTRO (Loro)" />
            <FieldRow label="Status" value="ACTIVE / RECONCILED" />
          </div>
        </div>
      </div>
      <SectionHeader title="TRANSACTION MOVEMENT" />
      <div className="border border-gray-200 mb-4">
        <div className="bg-gray-100 p-2 font-bold grid grid-cols-5 text-center"><span>DATE</span><span>REF</span><span>DEBIT</span><span>CREDIT</span><span>BAL</span></div>
        <div className="p-2 grid grid-cols-5 text-center border-b"><span>{formatDate(transaction.settlement_info.settlement_date)}</span><span className="font-mono">{trn.slice(-10)}</span><span className="text-red-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span><span>-</span><span className="font-bold">DR</span></div>
        <div className="p-2 grid grid-cols-5 text-center border-b"><span>{formatDate(transaction.settlement_info.settlement_date)}</span><span className="font-mono">SETTL-{trn.slice(-6)}</span><span>-</span><span className="text-green-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span><span className="font-bold">CR</span></div>
        <div className="p-2 grid grid-cols-5 text-center bg-blue-50 font-bold"><span>NET</span><span>-</span><span className="text-red-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span><span className="text-green-700">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span><span>0.00 (Balanced)</span></div>
      </div>
      <SectionHeader title="RECONCILIATION STATUS" />
      <div className="space-y-2 mb-4">
        {[
          ["Nostro Debit Matched", "MATCHED"],
          ["Vostro Credit Matched", "MATCHED"],
          ["Settlement Confirmed", "CONFIRMED"],
          ["MT950 Statement Received", "YES"],
          ["Auto-Reconciliation", "PASSED"],
        ].map(([label, status]) => (
          <div key={label} className="flex justify-between bg-green-50 p-2 border border-green-200">
            <span>{label}</span><span className="text-green-700 font-bold">{status}</span>
          </div>
        ))}
      </div>
      <div className="bg-green-100 p-4 border border-green-300 text-center font-bold text-green-900 mb-4">NOSTRO / VOSTRO ACCOUNTS FULLY RECONCILED - NO OUTSTANDING ITEMS</div>
      <DocFooter text="END OF NOSTRO / VOSTRO ACCOUNT DETAIL" />
    </DocWrap>
  );
};
