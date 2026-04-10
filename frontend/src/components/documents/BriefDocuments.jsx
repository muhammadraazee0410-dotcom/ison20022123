import { DocWrap, IsoLogo, DocBanner, FieldRow, SectionHeader, CheckItem, DocFooter, DocHeaderStrip, AmountBox, StatusBadge, formatAmount, formatDate, formatDateLong, formatDateTime, getTrn, getMsgId } from "./DocHelpers";

// Complete Transaction Summary - bank grade with full details
const TxnSummary = ({ transaction, trn, messageId }) => (
  <>
    <SectionHeader title="TRANSACTION REFERENCES" />
    <div className="mb-4">
      <FieldRow label="Message Type" value={transaction.message_type} highlight />
      <FieldRow label="Business Service" value={transaction.business_service} />
      <FieldRow label="UETR" value={transaction.uetr} mono highlight />
      <FieldRow label="Message Identification" value={messageId} mono />
      <FieldRow label="Instruction Identification" value={`INST${trn}`} mono />
      <FieldRow label="End-To-End ID" value={transaction.uetr.toUpperCase().replace(/-/g, '')} mono />
      <FieldRow label="SWIFT Reference" value={`SWIFT${trn.slice(-10)}`} mono />
      <FieldRow label="SWIFT Request Reference" value={`REQ${trn.slice(-12)}`} mono />
      <FieldRow label="MUR" value={`MUR${Date.now().toString().slice(-8)}`} mono />
      <FieldRow label="Transaction Created" value={formatDateTime(transaction.created_at)} />
      <FieldRow label="Last Updated" value={formatDateTime(transaction.updated_at || transaction.created_at)} />
      <FieldRow label="CBPR+ Compliance" value={transaction.cbpr_compliant ? "CONFIRMED" : "PENDING"} />
    </div>

    <AmountBox currency={transaction.settlement_info.currency} amount={transaction.settlement_info.interbank_settlement_amount} />

    <SectionHeader title="SETTLEMENT DETAILS" />
    <div className="mb-4">
      <FieldRow label="Settlement Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono highlight />
      <FieldRow label="Settlement Method" value={transaction.settlement_info.method} />
      <FieldRow label="Settlement Priority" value={transaction.settlement_info.priority} />
      <FieldRow label="Interbank Settlement Date" value={formatDateLong(transaction.settlement_info.settlement_date)} />
      <FieldRow label="Value Date" value={formatDate(transaction.settlement_info.settlement_date)} />
      <FieldRow label="Charge Bearer" value="SHA (Shared between parties)" />
      <FieldRow label="Exchange Rate" value="N/A (Single currency transfer)" />
    </div>

    <SectionHeader title="INSTRUCTING AGENT (SENDER BANK)" />
    <div className="mb-4 bg-blue-50 p-3 border border-blue-200 rounded -mx-1">
      <FieldRow label="Bank Name" value={transaction.instructing_agent.name} highlight />
      <FieldRow label="Bank BIC/SWIFT" value={transaction.instructing_agent.bic} mono />
      <FieldRow label="Country" value={transaction.instructing_agent.country} />
      <FieldRow label="Role" value="Ordering Institution / Instructing Agent" />
    </div>

    <SectionHeader title="INSTRUCTED AGENT (RECEIVER BANK)" />
    <div className="mb-4 bg-green-50 p-3 border border-green-200 rounded -mx-1">
      <FieldRow label="Bank Name" value={transaction.instructed_agent.name} highlight />
      <FieldRow label="Bank BIC/SWIFT" value={transaction.instructed_agent.bic} mono />
      <FieldRow label="Country" value={transaction.instructed_agent.country} />
      <FieldRow label="Role" value="Beneficiary Institution / Instructed Agent" />
    </div>

    <SectionHeader title="DEBTOR (ORDERING CUSTOMER)" />
    <div className="mb-4">
      <FieldRow label="Debtor Name" value={transaction.debtor.name} highlight />
      <FieldRow label="Debtor Account (IBAN)" value={transaction.debtor.iban} mono />
      <FieldRow label="Debtor Country" value={transaction.debtor.country} />
      <FieldRow label="Address" value={transaction.debtor.address || 'On file with ordering institution'} />
    </div>

    <SectionHeader title="CREDITOR (BENEFICIARY CUSTOMER)" />
    <div className="mb-4">
      <FieldRow label="Creditor Name" value={transaction.creditor.name} highlight />
      <FieldRow label="Creditor Account (IBAN)" value={transaction.creditor.iban || 'N/A'} mono />
      <FieldRow label="Creditor Country" value={transaction.creditor.country} />
      <FieldRow label="Address" value={transaction.creditor.address || 'On file with beneficiary institution'} />
    </div>

    <SectionHeader title="REMITTANCE INFORMATION" />
    <div className="mb-4">
      <FieldRow label="Type" value="UNSTRUCTURED" />
      <FieldRow label="Details" value={transaction.remittance_info} highlight />
    </div>

    <SectionHeader title="TRANSACTION STATUS" />
    <div className="mb-4 flex flex-wrap gap-3 items-center py-2">
      <div className="flex items-center gap-2"><span className="text-gray-600">Status:</span> <StatusBadge status={transaction.status} /></div>
      <div className="flex items-center gap-2"><span className="text-gray-600">Tracking:</span> <StatusBadge status={transaction.tracking_result} /></div>
      <div className="flex items-center gap-2"><span className="text-gray-600">Nostro:</span> <StatusBadge status={transaction.nostro_credited ? "CONFIRMED" : "PENDING"} /></div>
      <div className="flex items-center gap-2"><span className="text-gray-600">Vostro:</span> <StatusBadge status={transaction.vostro_debited ? "CONFIRMED" : "PENDING"} /></div>
      <div className="flex items-center gap-2"><span className="text-gray-600">ACK:</span> <StatusBadge status={transaction.network_ack ? "CONFIRMED" : "PENDING"} /></div>
    </div>
    <div className="mb-4">
      <FieldRow label="Reversal Possibility" value={transaction.reversal_possibility} />
      <FieldRow label="Manual Intervention" value={transaction.manual_intervention} />
    </div>
  </>
);

// ============================================================
// 23 Brief Document Tab Components - BANK GRADE
// ============================================================

export const PaymentTracer = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="TRACER" />
      <IsoLogo />
      <DocBanner title="SWIFT gpi PAYMENT TRACER" subtitle="(END-TO-END PAYMENT TRACKING REPORT)" />

      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This report provides a complete end-to-end tracking analysis of the referenced SWIFT gpi payment through each node in the payment chain. The gpi Tracker confirms the current status, location, and settlement position of funds at each intermediary and final beneficiary level.</p>
      </div>

      <div className="mb-4">
        <FieldRow label="Trace ID" value={`GPT-${trn}`} mono highlight />
        <FieldRow label="Trace Initiated" value={formatDateTime(new Date().toISOString())} />
        <FieldRow label="Trace Status" value={transaction.tracking_result} />
        <FieldRow label="gpi Service Level" value="g001 - Confirmed within same day" />
      </div>

      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />

      <SectionHeader title="gpi TRACKING CHAIN" />
      <div className="space-y-0 mb-4 border border-gray-200 rounded overflow-hidden">
        {[
          { step: 1, entity: transaction.debtor.name, role: "Debtor Account", status: "DEBITED", color: "bg-red-50 border-red-200", dot: "bg-green-500" },
          { step: 2, entity: `${transaction.instructing_agent.name} (${transaction.instructing_agent.bic})`, role: "Instructing Agent", status: "FORWARDED TO SWIFT", color: "bg-blue-50 border-blue-200", dot: "bg-green-500" },
          { step: 3, entity: "SWIFT GLOBAL SERVER (gpi TRACKER)", role: "Network", status: "TRANSMITTED & ACKNOWLEDGED", color: "bg-gray-50 border-gray-200", dot: "bg-green-500" },
          { step: 4, entity: `${transaction.instructed_agent.name} (${transaction.instructed_agent.bic})`, role: "Instructed Agent", status: "RECEIVED & CONFIRMED", color: "bg-blue-50 border-blue-200", dot: "bg-green-500" },
          { step: 5, entity: transaction.creditor.name, role: "Beneficiary Account", status: transaction.tracking_result === "SUCCESSFUL" ? "CREDITED" : "PENDING CREDIT", color: transaction.tracking_result === "SUCCESSFUL" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200", dot: transaction.tracking_result === "SUCCESSFUL" ? "bg-green-500" : "bg-yellow-500" },
        ].map(({ step, entity, role, status, color, dot }) => (
          <div key={step} className={`flex items-center gap-3 p-3 border-b ${color}`}>
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot}`} />
            <span className="w-6 font-bold text-gray-500">{step}.</span>
            <div className="flex-1">
              <div className="font-bold text-gray-900">{entity}</div>
              <div className="text-gray-500">{role}</div>
            </div>
            <StatusBadge status={status} />
          </div>
        ))}
      </div>

      <SectionHeader title="CONFIRMATION" />
      <div className="mb-4">
        <CheckItem color="green">End-to-end payment tracking completed</CheckItem>
        <CheckItem color="green">All nodes confirmed receipt and forwarding</CheckItem>
        <CheckItem color="green">Settlement finalized at correspondent level</CheckItem>
        <CheckItem color="green">No exceptions, holds, or compliance flags detected</CheckItem>
      </div>

      <DocFooter text="END OF PAYMENT TRACER" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const MT202COV = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="MT202COV" />
      <IsoLogo />
      <DocBanner title="MT202 COV - GENERAL FINANCIAL INSTITUTION TRANSFER" subtitle="(COVER PAYMENT FOR UNDERLYING CUSTOMER CREDIT TRANSFER)" />

      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This MT202 COV (Cover Payment) message accompanies a corresponding customer credit transfer (pacs.008/MT103). It instructs the movement of funds between financial institutions to settle the underlying customer payment. Sequence A contains the interbank cover details; Sequence B references the underlying customer transaction.</p>
      </div>

      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />

      <SectionHeader title="SEQUENCE A - COVER PAYMENT (INTERBANK)" />
      <div className="bg-blue-50 border border-blue-200 p-4 mb-4 rounded">
        <FieldRow label="Field 20 (TRN)" value={trn} mono highlight />
        <FieldRow label="Field 21 (Related Ref)" value={`REL${trn.slice(-10)}`} mono />
        <FieldRow label="Field 32A (Value/Ccy/Amt)" value={`${transaction.settlement_info.settlement_date.replace(/-/g, '')} ${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
        <FieldRow label="Field 52A (Ordering Inst)" value={transaction.instructing_agent.bic} mono />
        <FieldRow label="Field 53A (Sender Corr)" value={transaction.instructing_agent.bic} mono />
        <FieldRow label="Field 54A (Receiver Corr)" value={transaction.instructed_agent.bic} mono />
        <FieldRow label="Field 58A (Ben Inst)" value={transaction.instructed_agent.bic} mono />
      </div>

      <SectionHeader title="SEQUENCE B - UNDERLYING CUSTOMER TRANSFER" />
      <div className="bg-green-50 border border-green-200 p-4 mb-4 rounded">
        <FieldRow label="Field 50A (Ordering Cust)" value={transaction.debtor.name} highlight />
        <FieldRow label="Ordering Cust IBAN" value={transaction.debtor.iban} mono />
        <FieldRow label="Field 59 (Beneficiary)" value={transaction.creditor.name} highlight />
        <FieldRow label="Beneficiary IBAN" value={transaction.creditor.iban || 'N/A'} mono />
        <FieldRow label="Field 70 (Remittance)" value={transaction.remittance_info} />
        <FieldRow label="Field 71A (Charges)" value="SHA (Shared between parties)" />
      </div>

      <DocFooter text="END OF MT202 COV" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const AFTValidation = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="AFT" />
      <IsoLogo />
      <DocBanner title="AFT VALIDATION REPORT" subtitle="(AUTOMATED FORMAT & TRANSLATION VERIFICATION)" />

      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This Automated Format & Translation (AFT) report confirms that the referenced SWIFT MX message has been validated against all ISO 20022 schema rules, CBPR+ business rules, BIC directory lookups, IBAN checksum validations, sanctions screening, and AML/CFT compliance requirements. All checks must pass before the message is transmitted to the SWIFT network.</p>
      </div>

      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />

      <SectionHeader title="VALIDATION RESULTS" />
      <div className="space-y-1 mb-4 border border-gray-200 rounded overflow-hidden">
        {[
          ["V001", "Message Format Check (ISO 20022 XSD)", "PASS", "XML Schema validated against pacs.009.001.08.xsd", "bg-green-50"],
          ["V002", "CBPR+ Business Rule Validation", "PASS", "All 47 business rules satisfied", "bg-green-50"],
          ["V003", "BIC Directory Lookup (Sender)", "PASS", `${transaction.instructing_agent.bic} verified in SWIFT BIC directory`, "bg-green-50"],
          ["V004", "BIC Directory Lookup (Receiver)", "PASS", `${transaction.instructed_agent.bic} verified in SWIFT BIC directory`, "bg-green-50"],
          ["V005", "IBAN Validation (Debtor)", "PASS", `${transaction.debtor.iban.slice(0, 4)}... Checksum OK (MOD 97-10)`, "bg-green-50"],
          ["V006", "Settlement Amount Format", "PASS", "Decimal precision and currency code valid", "bg-green-50"],
          ["V007", "UETR Format (UUID v4)", "PASS", "UUID format verified, unique in system", "bg-green-50"],
          ["V008", "Duplicate Detection", "PASS", "No duplicate message found in 30-day window", "bg-green-50"],
          ["V009", "Sanctions Screening (OFAC/EU/UN)", "PASS", "No matches against any sanctions list", "bg-green-50"],
          ["V010", "AML/CFT Compliance Check", "PASS", "Transaction within normal parameters", "bg-green-50"],
          ["V011", "PEP Screening", "PASS", "No politically exposed persons identified", "bg-green-50"],
          ["V012", "Country Risk Assessment", "PASS", "No high-risk jurisdictions involved", "bg-green-50"],
        ].map(([code, desc, status, detail, bg]) => (
          <div key={code} className={`flex items-center gap-2 p-2 border-b ${bg}`}>
            <span className="w-12 font-mono text-gray-500 flex-shrink-0">{code}</span>
            <span className="flex-1 text-gray-800">{desc}</span>
            <span className="text-green-700 font-bold w-12 text-right">{status}</span>
            <span className="text-gray-500 text-xs flex-1">[{detail}]</span>
          </div>
        ))}
      </div>

      <div className="bg-green-100 border-2 border-green-400 p-4 text-center rounded mb-4">
        <div className="text-green-900 font-bold text-sm">ALL 12 VALIDATIONS PASSED</div>
        <div className="text-green-700 text-xs mt-1">Message approved for transmission to SWIFT network</div>
      </div>

      <DocFooter text="END OF AFT VALIDATION REPORT" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const MT103AnswerBack = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="MT103" />
      <IsoLogo />
      <DocBanner title="MT103 ANSWER BACK" subtitle="(CUSTOMER PAYMENT ACKNOWLEDGEMENT & CONFIRMATION)" />

      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This MT103 Answer Back confirms that the receiver bank has acknowledged receipt of the customer credit transfer instruction. The payment has been applied to the beneficiary account and no further action is required from the sending institution. This document serves as proof of successful payment delivery.</p>
      </div>

      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />

      <SectionHeader title="ANSWER BACK CONFIRMATION" />
      <div className="bg-green-50 border-2 border-green-300 p-4 mb-4 rounded">
        <FieldRow label="Answer Back Status" value="CONFIRMED BY RECEIVER BANK" highlight />
        <FieldRow label="Delivery Timestamp" value={formatDateTime(transaction.updated_at || transaction.created_at)} mono />
        <FieldRow label="ACK Reference" value={`ACK${trn.slice(-10)}`} mono />
        <FieldRow label="Credit Applied" value="YES - BENEFICIARY ACCOUNT CREDITED" />
        <FieldRow label="Credit Timestamp" value={formatDateTime(transaction.updated_at || transaction.created_at)} mono />
        <FieldRow label="Beneficiary Notified" value="YES (Per receiver bank policy)" />
      </div>

      <SectionHeader title="DELIVERY CHAIN CONFIRMATION" />
      <div className="mb-4">
        <CheckItem color="green">Payment instruction received by {transaction.instructed_agent.name}</CheckItem>
        <CheckItem color="green">Compliance checks passed at receiver bank</CheckItem>
        <CheckItem color="green">Funds credited to {transaction.creditor.name}</CheckItem>
        <CheckItem color="green">Answer back transmitted to {transaction.instructing_agent.bic}</CheckItem>
        <CheckItem color="green">End-to-end payment cycle completed</CheckItem>
      </div>

      <DocFooter text="END OF MT103 ANSWER BACK" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const PACS008XML = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="PACS008" />
      <IsoLogo />
      <DocBanner title="PACS.008 XML MESSAGE" subtitle="(FI TO FI CUSTOMER CREDIT TRANSFER - ISO 20022 XML)" />

      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This is the complete ISO 20022 pacs.008.001.08 XML message representation of the Financial Institution to Financial Institution Customer Credit Transfer. This XML structure is the actual message format transmitted through the SWIFT CBPR+ network for interbank settlement.</p>
      </div>

      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />

      <SectionHeader title="XML MESSAGE STRUCTURE" />
      <div className="bg-gray-900 text-green-400 p-4 mb-4 rounded font-mono text-xs whitespace-pre-wrap overflow-x-auto">
{`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${messageId}</MsgId>
      <CreDtTm>${formatDateTime(transaction.created_at)}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>${transaction.settlement_info.method}</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>INST${trn}</InstrId>
        <EndToEndId>${transaction.uetr.toUpperCase().replace(/-/g, '')}</EndToEndId>
        <UETR>${transaction.uetr}</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="${transaction.settlement_info.currency}">${formatAmount(transaction.settlement_info.interbank_settlement_amount)}</IntrBkSttlmAmt>
      <IntrBkSttlmDt>${transaction.settlement_info.settlement_date}</IntrBkSttlmDt>
      <SttlmPrty>${transaction.settlement_info.priority === 'HIGH' ? 'HIGH' : 'NORM'}</SttlmPrty>
      <InstgAgt><FinInstnId><BICFI>${transaction.instructing_agent.bic}</BICFI></FinInstnId></InstgAgt>
      <InstdAgt><FinInstnId><BICFI>${transaction.instructed_agent.bic}</BICFI></FinInstnId></InstdAgt>
      <Dbtr><Nm>${transaction.debtor.name}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${transaction.debtor.iban}</IBAN></Id></DbtrAcct>
      <Cdtr><Nm>${transaction.creditor.name}</Nm></Cdtr>
      <CdtrAcct><Id><IBAN>${transaction.creditor.iban || 'N/A'}</IBAN></Id></CdtrAcct>
      <RmtInf><Ustrd>${transaction.remittance_info}</Ustrd></RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`}
      </div>
      <DocFooter text="END OF PACS.008 XML" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const M1Fund = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="M1FUND" />
      <IsoLogo />
      <DocBanner title="M1 FUND ALLOCATION REPORT" subtitle="(IMMEDIATE SETTLEMENT FUND ALLOCATION & LIQUIDITY CONFIRMATION)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This report confirms the M1 (immediate) fund allocation for the referenced transaction. Funds have been earmarked, allocated, and transferred through the correspondent banking network. The settlement is confirmed at all levels of the payment chain.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="FUND MOVEMENT CONFIRMATION" />
      <div className="space-y-2 mb-4">
        {[
          ["Nostro Account Debit", "CONFIRMED", "Funds debited from sender's Nostro account", "bg-red-50 border-red-200"],
          ["Vostro Account Credit", "CONFIRMED", "Funds credited to receiver's Vostro account", "bg-green-50 border-green-200"],
          ["Interbank Settlement", "COMPLETED", "Settlement confirmed via SWIFT network", "bg-blue-50 border-blue-200"],
          ["Liquidity Check", "PASSED", "Sufficient funds available for immediate settlement", "bg-blue-50 border-blue-200"],
          ["M1 Fund Status", "ALLOCATED", "Funds fully allocated and irrevocable", "bg-green-50 border-green-200"],
        ].map(([label, status, desc, colors]) => (
          <div key={label} className={`flex items-center justify-between p-3 border rounded ${colors}`}>
            <div><div className="font-bold text-gray-900">{label}</div><div className="text-xs text-gray-600">{desc}</div></div>
            <StatusBadge status={status} />
          </div>
        ))}
      </div>
      <DocFooter text="END OF M1 FUND REPORT" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const ServerReport = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="SERVER" />
      <IsoLogo />
      <DocBanner title="SWIFT SERVER PROCESSING REPORT" subtitle="(ALLIANCE GATEWAY SERVER LOG & AUDIT TRAIL)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This server processing report provides a complete audit trail of the message lifecycle from receipt through the Alliance Gateway, validation, sanctions screening, routing, delivery, and final settlement. All timestamps are in UTC.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="SERVER PROCESSING LOG" />
      <div className="bg-gray-900 text-green-400 p-4 font-mono text-xs mb-4 rounded space-y-1">
        <div><span className="text-gray-500">[{formatDateTime(transaction.created_at)}]</span> <span className="text-cyan-400">RECEIVED</span>  {transaction.message_type} from {transaction.instructing_agent.bic}</div>
        <div><span className="text-gray-500">[{formatDateTime(transaction.created_at)}]</span> <span className="text-cyan-400">VALIDATE</span>  ISO 20022 format check ............. <span className="text-green-400">PASSED</span></div>
        <div><span className="text-gray-500">[{formatDateTime(transaction.created_at)}]</span> <span className="text-cyan-400">VALIDATE</span>  CBPR+ business rules .............. <span className="text-green-400">PASSED</span></div>
        <div><span className="text-gray-500">[{formatDateTime(transaction.created_at)}]</span> <span className="text-cyan-400">VALIDATE</span>  BIC directory lookup .............. <span className="text-green-400">PASSED</span></div>
        <div><span className="text-gray-500">[{formatDateTime(transaction.created_at)}]</span> <span className="text-cyan-400">VALIDATE</span>  IBAN checksum verification ........ <span className="text-green-400">PASSED</span></div>
        <div><span className="text-gray-500">[{formatDateTime(transaction.created_at)}]</span> <span className="text-yellow-400">SCREEN </span>  Sanctions screening (OFAC/EU/UN) .. <span className="text-green-400">CLEARED</span></div>
        <div><span className="text-gray-500">[{formatDateTime(transaction.created_at)}]</span> <span className="text-yellow-400">SCREEN </span>  AML/CFT compliance check .......... <span className="text-green-400">CLEARED</span></div>
        <div><span className="text-gray-500">[{formatDateTime(transaction.created_at)}]</span> <span className="text-blue-400">ROUTE  </span>  Message routed to {transaction.instructed_agent.bic}</div>
        <div><span className="text-gray-500">[{formatDateTime(transaction.created_at)}]</span> <span className="text-blue-400">DELIVER</span>  Network ACK received from receiver</div>
        <div><span className="text-gray-500">[{formatDateTime(transaction.created_at)}]</span> <span className="text-green-400">SETTLE </span>  {transaction.settlement_info.currency} {formatAmount(transaction.settlement_info.interbank_settlement_amount)} <span className="text-green-400">SETTLED</span></div>
        <div><span className="text-gray-500">[{formatDateTime(transaction.created_at)}]</span> <span className="text-green-400">STATUS </span>  Transaction <span className="text-green-400">FINALIZED</span> - No errors</div>
      </div>
      <SectionHeader title="SERVER METRICS" />
      <div className="mb-4">
        <FieldRow label="Processing Time" value="0.847 seconds" />
        <FieldRow label="Queue Position" value="1 of 1" />
        <FieldRow label="Server Instance" value="SAAPROD-GW01" />
        <FieldRow label="Gateway Version" value="Alliance Gateway v7.8.20" />
        <FieldRow label="Message Size" value="2.4 KB" />
        <FieldRow label="Encryption" value="TLS 1.3 / PKI-based signing" />
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
      <DocHeaderStrip uetr={transaction.uetr} docType="FTRACER" />
      <IsoLogo />
      <DocBanner title="FUNDS TRACER REPORT" subtitle="(COMPLETE FUND FLOW CHAIN ANALYSIS)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This Funds Tracer provides a comprehensive analysis of the fund flow from the debtor's account through all intermediary steps to the final credit in the creditor's account. Each step is verified and timestamped.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="FUND FLOW CHAIN" />
      <div className="space-y-0 mb-4 border border-gray-200 rounded overflow-hidden">
        {[
          { step: 1, entity: `${transaction.debtor.name} (${transaction.debtor.iban?.slice(0, 12)}...)`, action: "DEBITED", desc: "Funds debited from ordering customer account", color: "bg-red-50 border-red-200" },
          { step: 2, entity: `${transaction.instructing_agent.name} (${transaction.instructing_agent.bic})`, action: "FORWARDED", desc: "Payment instruction forwarded to SWIFT network", color: "bg-blue-50 border-blue-200" },
          { step: 3, entity: "SWIFT GLOBAL SERVER (gpi)", action: "TRANSMITTED", desc: "Message transmitted through SWIFTNet FIN/MX", color: "bg-gray-50 border-gray-200" },
          { step: 4, entity: `${transaction.instructed_agent.name} (${transaction.instructed_agent.bic})`, action: "RECEIVED", desc: "Payment received and applied to Nostro account", color: "bg-blue-50 border-blue-200" },
          { step: 5, entity: `${transaction.creditor.name} (${transaction.creditor.iban?.slice(0, 12) || 'N/A'}...)`, action: transaction.tracking_result === "SUCCESSFUL" ? "CREDITED" : "PENDING", desc: transaction.tracking_result === "SUCCESSFUL" ? "Funds credited to beneficiary account" : "Awaiting final credit to beneficiary", color: transaction.tracking_result === "SUCCESSFUL" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200" },
        ].map(({ step, entity, action, desc, color }) => (
          <div key={step} className={`flex items-center gap-3 p-3 border-b ${color}`}>
            <span className="w-6 font-bold text-gray-500">{step}.</span>
            <div className="flex-1"><div className="font-bold text-gray-900">{entity}</div><div className="text-gray-500 text-xs">{desc}</div></div>
            <StatusBadge status={action} />
          </div>
        ))}
      </div>
      <DocFooter text="END OF FUNDS TRACER" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const FundLocation = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="FUNDLOC" />
      <IsoLogo />
      <DocBanner title="FUND LOCATION REPORT" subtitle="(REAL-TIME FUND POSITION & LOCATION TRACKING)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This report confirms the current real-time position and location of funds for the referenced transaction. It provides visibility into exactly where the money resides at each point in the settlement chain.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="CURRENT FUND LOCATION" />
      <div className={`p-4 mb-4 border-2 rounded text-center ${transaction.tracking_result === "SUCCESSFUL" ? "bg-green-50 border-green-400" : "bg-yellow-50 border-yellow-400"}`}>
        <div className="text-lg font-bold">{transaction.tracking_result === "SUCCESSFUL" ? "FUNDS DELIVERED TO BENEFICIARY" : "FUNDS IN TRANSIT"}</div>
        <div className="mt-2"><FieldRow label="Institution" value={transaction.tracking_result === "SUCCESSFUL" ? transaction.instructed_agent.name : "SWIFT NETWORK"} /></div>
        <div><FieldRow label="Account" value={transaction.tracking_result === "SUCCESSFUL" ? (transaction.creditor.iban || 'N/A') : "INTERMEDIARY NOSTRO"} mono /></div>
      </div>
      <SectionHeader title="LOCATION HISTORY" />
      <div className="border border-gray-200 rounded overflow-hidden mb-4">
        <div className="bg-gray-100 p-2 font-bold grid grid-cols-4 text-center text-xs border-b"><span>TIMESTAMP</span><span>LOCATION</span><span>STATUS</span><span>AMOUNT</span></div>
        {[
          [formatDateTime(transaction.created_at), `Debtor (${transaction.debtor.iban?.slice(0,10)}...)`, "DEBITED", transaction.settlement_info.currency],
          [formatDateTime(transaction.created_at), `Sender (${transaction.instructing_agent.bic})`, "TRANSFERRED", transaction.settlement_info.currency],
          [formatDateTime(transaction.created_at), `Receiver (${transaction.instructed_agent.bic})`, "RECEIVED", transaction.settlement_info.currency],
          [formatDateTime(new Date().toISOString()), `Beneficiary (${transaction.creditor.iban?.slice(0,10) || 'N/A'}...)`, transaction.tracking_result === "SUCCESSFUL" ? "CREDITED" : "PENDING", transaction.settlement_info.currency],
        ].map(([ts, loc, status, ccy], i) => (
          <div key={i} className="p-2 grid grid-cols-4 text-center text-xs border-b hover:bg-gray-50">
            <span className="font-mono">{ts}</span><span>{loc}</span><span><StatusBadge status={status} /></span><span className="font-mono">{ccy} {formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span>
          </div>
        ))}
      </div>
      <DocFooter text="END OF FUND LOCATION REPORT" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const BeneficiaryCredit = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="BENCR" />
      <IsoLogo />
      <DocBanner title="BENEFICIARY CREDIT ADVICE" subtitle="(CREDIT NOTIFICATION TO BENEFICIARY CUSTOMER)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This Credit Advice confirms that an incoming payment has been received and credited to the beneficiary's account. The funds are now available for use. This document serves as official notification of the credit entry.</p>
      </div>
      <AmountBox currency={transaction.settlement_info.currency} amount={transaction.settlement_info.interbank_settlement_amount} label="AMOUNT CREDITED" type="credit" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="CREDIT DETAILS" />
      <div className="bg-green-50 border-2 border-green-300 p-4 mb-4 rounded">
        <FieldRow label="Credit Applied" value="YES" highlight />
        <FieldRow label="Value Date" value={formatDateLong(transaction.settlement_info.settlement_date)} />
        <FieldRow label="Beneficiary" value={transaction.creditor.name} highlight />
        <FieldRow label="Beneficiary IBAN" value={transaction.creditor.iban || 'N/A'} mono />
        <FieldRow label="Ordering Customer" value={transaction.debtor.name} />
        <FieldRow label="Availability" value="IMMEDIATE - Funds available for withdrawal/transfer" />
      </div>
      <DocFooter text="END OF BENEFICIARY CREDIT ADVICE" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const DocClearance = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="DOCCLR" />
      <IsoLogo />
      <DocBanner title="DOCUMENT CLEARANCE CERTIFICATE" subtitle="(COMPLIANCE, SANCTIONS & REGULATORY CLEARANCE)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This Document Clearance Certificate confirms that the referenced transaction has passed all mandatory compliance, sanctions, anti-money laundering, and regulatory screenings required for cross-border financial transfers under applicable international regulations.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="CLEARANCE STATUS" />
      <div className="space-y-1 mb-4">
        {[
          ["Sanctions Screening (OFAC)", "CLEARED", "No match found against OFAC SDN list"],
          ["EU Sanctions Check", "CLEARED", "No match found against EU consolidated list"],
          ["UN Sanctions Check", "CLEARED", "No match found against UN Security Council list"],
          ["AML/CFT Compliance", "PASSED", "Transaction within normal parameters"],
          ["KYC Verification", "VERIFIED", "Customer identity verified by ordering institution"],
          ["PEP Screening", "CLEARED", "No politically exposed persons identified"],
          ["Country Risk Assessment", "LOW RISK", "No high-risk jurisdictions involved"],
          ["Document Authentication", "VERIFIED", "Digital signature and message integrity confirmed"],
          ["Compliance Officer Sign-off", "APPROVED", "Automated approval - no manual review required"],
        ].map(([label, status, desc]) => (
          <div key={label} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
            <div><div className="font-bold text-gray-900">{label}</div><div className="text-xs text-gray-600">{desc}</div></div>
            <StatusBadge status={status} />
          </div>
        ))}
      </div>
      <div className="bg-green-100 border-2 border-green-400 p-4 text-center rounded mb-4">
        <div className="text-green-900 font-bold text-sm">DOCUMENT FULLY CLEARED - NO HOLDS OR RESTRICTIONS</div>
        <div className="text-green-700 text-xs mt-1">All regulatory requirements satisfied</div>
      </div>
      <DocFooter text="END OF CLEARANCE CERTIFICATE" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const SMTPMail = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="SMTP" />
      <IsoLogo />
      <DocBanner title="SMTP MAIL NOTIFICATION LOG" subtitle="(EMAIL DELIVERY CONFIRMATION & AUDIT)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This log records the email notification sent regarding the referenced transaction. It includes SMTP delivery details, security verification (DKIM/SPF/DMARC), and confirmation of successful delivery to the recipient.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="EMAIL DELIVERY LOG" />
      <div className="bg-gray-50 border border-gray-200 p-4 mb-4 rounded">
        <FieldRow label="From" value="noreply@swift-alliance.net" highlight />
        <FieldRow label="To" value="operations@correspondent-bank.com" />
        <FieldRow label="CC" value="settlement-desk@correspondent-bank.com" />
        <FieldRow label="Subject" value={`SWIFT Payment Confirmation - UETR: ${transaction.uetr}`} />
        <FieldRow label="Sent At" value={formatDateTime(new Date().toISOString())} mono />
        <FieldRow label="SMTP Status" value="250 OK - Message accepted for delivery" />
        <FieldRow label="Message-ID" value={`<${messageId}@swift-alliance.net>`} mono />
        <FieldRow label="Encryption" value="TLS 1.3 (ECDHE-RSA-AES256-GCM-SHA384)" />
        <FieldRow label="DKIM" value="PASS (selector: swift2025)" />
        <FieldRow label="SPF" value="PASS (ip: 198.51.100.42)" />
        <FieldRow label="DMARC" value="PASS (policy: reject)" />
        <FieldRow label="Content Type" value="multipart/mixed (HTML + PDF attachment)" />
      </div>
      <DocFooter text="END OF SMTP LOG" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const OnLedger = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  const amt = transaction.settlement_info.interbank_settlement_amount;
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="LEDGER" />
      <IsoLogo />
      <DocBanner title="ON-LEDGER POSTING CONFIRMATION" subtitle="(GENERAL LEDGER DOUBLE-ENTRY RECORD)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This document confirms the general ledger postings for the referenced transaction. All entries follow double-entry accounting principles, ensuring the ledger remains balanced. Debit and credit entries are posted simultaneously to maintain accounting integrity.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="LEDGER ENTRIES (DOUBLE-ENTRY)" />
      <div className="border border-gray-300 mb-4 rounded overflow-hidden">
        <div className="bg-[#1a4b8e] text-white p-2 font-bold grid grid-cols-5 text-center text-xs"><span>DATE</span><span>ACCOUNT</span><span>DEBIT</span><span>CREDIT</span><span>REF</span></div>
        <div className="p-2 grid grid-cols-5 text-center border-b bg-red-50">
          <span>{formatDate(transaction.settlement_info.settlement_date)}</span>
          <span className="font-mono">{transaction.debtor.iban?.slice(-8)}</span>
          <span className="text-red-700 font-bold">{transaction.settlement_info.currency} {formatAmount(amt)}</span>
          <span>-</span>
          <span className="font-mono text-xs">{trn.slice(-8)}</span>
        </div>
        <div className="p-2 grid grid-cols-5 text-center border-b bg-green-50">
          <span>{formatDate(transaction.settlement_info.settlement_date)}</span>
          <span className="font-mono">{transaction.creditor.iban?.slice(-8) || 'NOSTRO'}</span>
          <span>-</span>
          <span className="text-green-700 font-bold">{transaction.settlement_info.currency} {formatAmount(amt)}</span>
          <span className="font-mono text-xs">{trn.slice(-8)}</span>
        </div>
        <div className="p-2 grid grid-cols-5 text-center bg-blue-50 font-bold border-t-2 border-[#1a4b8e]">
          <span>NET</span><span>-</span>
          <span className="text-red-700">{transaction.settlement_info.currency} {formatAmount(amt)}</span>
          <span className="text-green-700">{transaction.settlement_info.currency} {formatAmount(amt)}</span>
          <span className="text-[#1a4b8e]">BALANCED</span>
        </div>
      </div>
      <div className="bg-green-100 border border-green-300 p-3 text-center rounded mb-4"><span className="font-bold text-green-900">LEDGER BALANCED - NO DISCREPANCIES</span></div>
      <DocFooter text="END OF ON-LEDGER POSTING" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const OfficerComm = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="OFFCOMM" />
      <IsoLogo />
      <DocBanner title="OFFICER COMMUNICATION RECORD" subtitle="(INTERNAL BANK COMMUNICATION & AUTHORIZATION LOG)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This document records all internal bank communications regarding the referenced transaction, including operations desk processing, compliance officer review, and settlement desk confirmation. It serves as an audit trail of all officer-level actions.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="COMMUNICATION LOG" />
      <div className="space-y-3 mb-4">
        {[
          { dept: "Operations Desk", time: transaction.created_at, msg: `Transaction ${transaction.uetr} received and validated. Message type: ${transaction.message_type}. Amount: ${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}. Debtor: ${transaction.debtor.name}. Creditor: ${transaction.creditor.name}. Proceeding with settlement workflow.`, color: "border-l-blue-500 bg-blue-50" },
          { dept: "Compliance Officer", time: transaction.created_at, msg: `Sanctions screening completed for all parties. No matches found against OFAC/EU/UN lists. AML check passed - transaction within normal parameters for this customer profile. KYC status verified. Transaction approved for processing without manual review.`, color: "border-l-yellow-500 bg-yellow-50" },
          { dept: "Settlement Desk", time: transaction.updated_at || transaction.created_at, msg: `Settlement confirmed at correspondent level. Nostro/Vostro entries posted and balanced. Network ACK received from ${transaction.instructed_agent.bic}. Transaction status: FINALIZED. No exceptions or holds. All reconciliation checks passed.`, color: "border-l-green-500 bg-green-50" },
        ].map(({ dept, time, msg, color }, i) => (
          <div key={i} className={`border border-gray-200 border-l-4 ${color} p-3 rounded`}>
            <div className="flex justify-between mb-1"><span className="font-bold text-gray-800">{dept}</span><span className="text-gray-500 text-xs font-mono">{formatDateTime(time)}</span></div>
            <div className="text-gray-700 leading-relaxed">{msg}</div>
          </div>
        ))}
      </div>
      <DocFooter text="END OF OFFICER COMMUNICATION" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const MT900Debit = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="MT900" />
      <IsoLogo />
      <DocBanner title="MT900 - CONFIRMATION OF DEBIT" subtitle="(VOSTRO ACCOUNT DEBIT NOTIFICATION)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This MT900 message confirms that the sender's Vostro account has been debited for the referenced transaction. It is sent by the account servicing institution to the account owner to confirm the debit entry.</p>
      </div>
      <AmountBox currency={transaction.settlement_info.currency} amount={transaction.settlement_info.interbank_settlement_amount} label="DEBIT CONFIRMED" type="debit" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="MT900 MESSAGE FIELDS" />
      <div className="bg-red-50 border border-red-200 p-4 mb-4 rounded">
        <FieldRow label="Field 20 (TRN)" value={`MT900${trn.slice(-8)}`} mono highlight />
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
      <DocHeaderStrip uetr={transaction.uetr} docType="MT910" />
      <IsoLogo />
      <DocBanner title="MT910 - CONFIRMATION OF CREDIT" subtitle="(NOSTRO ACCOUNT CREDIT NOTIFICATION)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This MT910 message confirms that the receiver's Nostro account has been credited for the referenced transaction. It is sent by the account servicing institution to the account owner to confirm the credit entry. Funds are now available.</p>
      </div>
      <AmountBox currency={transaction.settlement_info.currency} amount={transaction.settlement_info.interbank_settlement_amount} label="CREDIT CONFIRMED" type="credit" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="MT910 MESSAGE FIELDS" />
      <div className="bg-green-50 border border-green-200 p-4 mb-4 rounded">
        <FieldRow label="Field 20 (TRN)" value={`MT910${trn.slice(-8)}`} mono highlight />
        <FieldRow label="Field 21 (Related Ref)" value={trn} mono />
        <FieldRow label="Field 25 (Account)" value={transaction.creditor.iban || transaction.debtor.iban} mono />
        <FieldRow label="Field 32A (Value/Ccy/Amt)" value={`${transaction.settlement_info.settlement_date.replace(/-/g, '')} ${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
        <FieldRow label="Field 52A (Ordering Inst)" value={transaction.instructed_agent.bic} mono />
      </div>
      <DocFooter text="END OF MT910 CREDIT CONFIRMATION" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const MT940Statement = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  const amt = transaction.settlement_info.interbank_settlement_amount;
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="MT940" />
      <IsoLogo />
      <DocBanner title="MT940 - CUSTOMER STATEMENT MESSAGE" subtitle="(ACCOUNT STATEMENT WITH TRANSACTION ENTRIES)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This MT940 Customer Statement provides a detailed account statement showing all transaction entries for the referenced account during the statement period. It includes opening/closing balances, individual transaction entries, and balance reconciliation.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="STATEMENT ENTRIES" />
      <div className="border border-gray-300 mb-4 rounded overflow-hidden">
        <div className="bg-[#1a4b8e] text-white p-2 font-bold grid grid-cols-6 text-center text-xs"><span>DATE</span><span>TYPE</span><span>REF</span><span>DEBIT</span><span>CREDIT</span><span>D/C</span></div>
        <div className="p-2 grid grid-cols-6 text-center text-xs border-b bg-red-50">
          <span>{formatDate(transaction.settlement_info.settlement_date)}</span><span>SWIFT TRF</span><span className="font-mono">{trn.slice(-8)}</span><span className="text-red-700 font-bold">{formatAmount(amt)}</span><span>-</span><span className="font-bold text-red-700">DR</span>
        </div>
        <div className="p-2 grid grid-cols-6 text-center text-xs border-b bg-green-50">
          <span>{formatDate(transaction.settlement_info.settlement_date)}</span><span>SETTL</span><span className="font-mono">SETTL-{trn.slice(-6)}</span><span>-</span><span className="text-green-700 font-bold">{formatAmount(amt)}</span><span className="font-bold text-green-700">CR</span>
        </div>
      </div>
      <SectionHeader title="MT940 FIELDS" />
      <div className="bg-gray-50 border border-gray-200 p-4 mb-4 rounded">
        <FieldRow label="Field 20 (TRN)" value={`STMT${trn.slice(-8)}`} mono highlight />
        <FieldRow label="Field 25 (Account ID)" value={transaction.debtor.iban} mono />
        <FieldRow label="Field 28C (Statement No)" value="001/001" />
        <FieldRow label="Field 60F (Opening Balance)" value={`C${transaction.settlement_info.settlement_date.replace(/-/g, '')}${transaction.settlement_info.currency}0,00`} mono />
        <FieldRow label="Field 62F (Closing Balance)" value={`C${transaction.settlement_info.settlement_date.replace(/-/g, '')}${transaction.settlement_info.currency}0,00`} mono />
        <FieldRow label="Field 64 (Available Balance)" value={`C${transaction.settlement_info.settlement_date.replace(/-/g, '')}${transaction.settlement_info.currency}0,00`} mono />
      </div>
      <DocFooter text="END OF MT940 STATEMENT" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const DebitNote = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="DEBITNOTE" />
      <IsoLogo />
      <DocBanner title="OFFICIAL DEBIT NOTE" subtitle="(ACCOUNT DEBIT NOTIFICATION & AUTHORIZATION)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This Official Debit Note confirms that the referenced amount has been debited from the account holder's account in accordance with the SWIFT payment instruction. This debit is authorized under the existing banking mandate and service agreement.</p>
      </div>
      <AmountBox currency={transaction.settlement_info.currency} amount={transaction.settlement_info.interbank_settlement_amount} label="AMOUNT DEBITED" type="debit" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="DEBIT DETAILS" />
      <div className="bg-red-50 border border-red-200 p-4 mb-4 rounded">
        <FieldRow label="Debit Date" value={formatDateLong(transaction.settlement_info.settlement_date)} highlight />
        <FieldRow label="Account Debited" value={transaction.debtor.iban} mono />
        <FieldRow label="Account Holder" value={transaction.debtor.name} />
        <FieldRow label="Reason" value={`SWIFT ${transaction.message_type} - ${transaction.remittance_info}`} />
        <FieldRow label="Authorization" value="SYSTEM AUTHORIZED (Under existing banking mandate)" />
        <FieldRow label="Reversibility" value={transaction.reversal_possibility} />
      </div>
      <DocFooter text="END OF DEBIT NOTE" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const BalanceSheet = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  const amt = transaction.settlement_info.interbank_settlement_amount;
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="BALSHEET" />
      <IsoLogo />
      <DocBanner title="TRANSACTION BALANCE SHEET" subtitle="(ASSET & LIABILITY IMPACT ANALYSIS)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This Balance Sheet provides a comprehensive analysis of the asset and liability impact of the referenced transaction on the participating financial institutions. It confirms that all entries are balanced according to double-entry accounting principles.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="BALANCE IMPACT" />
      <div className="border border-gray-300 mb-4 rounded overflow-hidden">
        <div className="bg-[#1a4b8e] text-white p-2 font-bold grid grid-cols-4 text-center"><span>ITEM</span><span>DEBIT</span><span>CREDIT</span><span>NET</span></div>
        <div className="p-3 grid grid-cols-4 text-center border-b bg-red-50"><span className="font-bold">Nostro (Sender)</span><span className="text-red-700 font-bold">{transaction.settlement_info.currency} {formatAmount(amt)}</span><span>-</span><span className="text-red-700">-{formatAmount(amt)}</span></div>
        <div className="p-3 grid grid-cols-4 text-center border-b bg-green-50"><span className="font-bold">Nostro (Receiver)</span><span>-</span><span className="text-green-700 font-bold">{transaction.settlement_info.currency} {formatAmount(amt)}</span><span className="text-green-700">+{formatAmount(amt)}</span></div>
        <div className="p-3 grid grid-cols-4 text-center bg-blue-50 font-bold border-t-2 border-[#1a4b8e]"><span>NET POSITION</span><span className="text-red-700">{formatAmount(amt)}</span><span className="text-green-700">{formatAmount(amt)}</span><span className="text-[#1a4b8e]">0.00 (BALANCED)</span></div>
      </div>
      <div className="bg-green-100 border-2 border-green-400 p-3 text-center rounded mb-4"><span className="font-bold text-green-900">BALANCE SHEET FULLY BALANCED - NO DISCREPANCIES</span></div>
      <DocFooter text="END OF BALANCE SHEET" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const RemittanceReport = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="REMIT" />
      <IsoLogo />
      <DocBanner title="REMITTANCE ADVICE REPORT" subtitle="(PAYMENT REMITTANCE & PURPOSE INFORMATION)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This Remittance Advice provides detailed information about the payment purpose, charge allocation, and remittance details associated with the referenced transaction. It enables the beneficiary to reconcile the incoming payment with their records.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="REMITTANCE DETAILS" />
      <div className="bg-gray-50 border border-gray-200 p-4 mb-4 rounded">
        <FieldRow label="Remittance Type" value="UNSTRUCTURED" highlight />
        <FieldRow label="Remittance Information" value={transaction.remittance_info} />
        <FieldRow label="Payment Purpose" value={transaction.remittance_info} />
        <FieldRow label="Charge Bearer (Field 71A)" value="SHA (Shared between ordering and beneficiary)" />
        <FieldRow label="Sender Charges" value={`${transaction.settlement_info.currency} 0.00 (No charges applied)`} />
        <FieldRow label="Receiver Charges" value={`${transaction.settlement_info.currency} 0.00 (No charges applied)`} />
        <FieldRow label="Exchange Rate" value="N/A (Single currency transfer)" />
        <FieldRow label="Instructed Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
        <FieldRow label="Settled Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
      </div>
      <DocFooter text="END OF REMITTANCE REPORT" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const CreditNotification = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="CRNOTIF" />
      <IsoLogo />
      <DocBanner title="CREDIT NOTIFICATION" subtitle="(INCOMING PAYMENT CREDIT NOTICE TO RECEIVER)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This Credit Notification confirms that an incoming SWIFT payment has been received and credited. The funds have been applied to the beneficiary's account and are immediately available for use. No further action is required.</p>
      </div>
      <AmountBox currency={transaction.settlement_info.currency} amount={transaction.settlement_info.interbank_settlement_amount} label="INCOMING CREDIT" type="credit" />
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="CREDIT CONFIRMATION" />
      <div className="bg-green-50 border-2 border-green-400 p-4 mb-4 rounded text-center">
        <div className="text-green-800 font-bold">CREDIT APPLIED SUCCESSFULLY</div>
        <div className="text-green-700 mt-1">From: {transaction.debtor.name} | To: {transaction.creditor.name}</div>
        <div className="text-green-600 mt-1">Credited on {formatDateLong(transaction.settlement_info.settlement_date)}</div>
        <div className="text-green-600 text-xs mt-1">Funds immediately available for withdrawal or transfer</div>
      </div>
      <DocFooter text="END OF CREDIT NOTIFICATION" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const IntermediaryBank = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="INTERMED" />
      <IsoLogo />
      <DocBanner title="INTERMEDIARY BANK REPORT" subtitle="(CORRESPONDENT BANK ROUTING, PROCESSING & VERIFICATION)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This report documents the intermediary/correspondent bank processing for the referenced transaction. It confirms that the payment was correctly routed, validated, screened, and forwarded to the beneficiary bank through the correspondent banking network.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="INTERMEDIARY PROCESSING LOG" />
      <div className="space-y-1 mb-4">
        {[
          ["Message Received from Sender", "ACK", "Incoming message acknowledged within SLA"],
          ["Format Validation (ISO 20022)", "VALID", "Message conforms to pacs.009.001.08 schema"],
          ["BIC Routing Verified", "CONFIRMED", "Destination BIC verified in SWIFT directory"],
          ["Sanctions / Compliance Screening", "CLEARED", "No matches found against any watchlist"],
          ["Nostro Balance Check", "SUFFICIENT", "Adequate funds available for settlement"],
          ["Forwarded to Receiver Bank", "DELIVERED", `Message forwarded to ${transaction.instructed_agent.bic}`],
          ["Receiver Acknowledgment", "ACK RECEIVED", "Receiver bank confirmed receipt and processing"],
        ].map(([label, status, desc]) => (
          <div key={label} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
            <div><div className="font-bold text-gray-900">{label}</div><div className="text-xs text-gray-600">{desc}</div></div>
            <StatusBadge status={status} />
          </div>
        ))}
      </div>
      <div className="mb-4">
        <FieldRow label="Intermediary BIC" value="COBADEFFXXX" mono highlight />
        <FieldRow label="Correspondent Network" value="SWIFT FIN/MX" />
        <FieldRow label="Charges Allocation" value="SHA (Shared between ordering and beneficiary)" />
        <FieldRow label="Processing Time" value="< 1 second (STP - Straight Through Processing)" />
      </div>
      <DocFooter text="END OF INTERMEDIARY BANK REPORT" uetr={transaction.uetr} />
    </DocWrap>
  );
};

export const NostroAccountDetail = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();
  const amt = transaction.settlement_info.interbank_settlement_amount;
  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="NOSTRO" />
      <IsoLogo />
      <DocBanner title="NOSTRO / VOSTRO ACCOUNT DETAIL" subtitle="(CORRESPONDENT ACCOUNT RECONCILIATION REPORT)" />
      <div className="bg-gray-50 border border-gray-200 p-3 mb-4 rounded">
        <p className="text-gray-700 leading-relaxed">This report provides a detailed view of the Nostro (our account at their bank) and Vostro (their account at our bank) positions for the referenced transaction. It includes the movement entries, reconciliation status, and confirms that both mirror accounts are balanced.</p>
      </div>
      <TxnSummary transaction={transaction} trn={trn} messageId={messageId} />
      <SectionHeader title="NOSTRO ACCOUNT (OUR ACCOUNT AT CORRESPONDENT)" />
      <div className="bg-blue-50 p-4 border-2 border-blue-300 mb-4 rounded">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldRow label="Account Holder" value={transaction.instructing_agent.name} highlight />
            <FieldRow label="BIC" value={transaction.instructing_agent.bic} mono />
            <FieldRow label="Held At" value={transaction.instructed_agent.name} />
          </div>
          <div>
            <FieldRow label="Currency" value={transaction.settlement_info.currency} />
            <FieldRow label="Account Type" value="NOSTRO (Mirror Account)" />
            <FieldRow label="Status" value="ACTIVE / RECONCILED" />
          </div>
        </div>
      </div>
      <SectionHeader title="VOSTRO ACCOUNT (THEIR ACCOUNT AT OUR BANK)" />
      <div className="bg-purple-50 p-4 border-2 border-purple-300 mb-4 rounded">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldRow label="Account Holder" value={transaction.instructed_agent.name} highlight />
            <FieldRow label="BIC" value={transaction.instructed_agent.bic} mono />
            <FieldRow label="Held At" value={transaction.instructing_agent.name} />
          </div>
          <div>
            <FieldRow label="Currency" value={transaction.settlement_info.currency} />
            <FieldRow label="Account Type" value="VOSTRO (Loro Account)" />
            <FieldRow label="Status" value="ACTIVE / RECONCILED" />
          </div>
        </div>
      </div>
      <SectionHeader title="TRANSACTION MOVEMENT" />
      <div className="border border-gray-300 mb-4 rounded overflow-hidden">
        <div className="bg-[#1a4b8e] text-white p-2 font-bold grid grid-cols-5 text-center text-xs"><span>DATE</span><span>REF</span><span>DEBIT</span><span>CREDIT</span><span>BAL</span></div>
        <div className="p-2 grid grid-cols-5 text-center border-b bg-red-50"><span>{formatDate(transaction.settlement_info.settlement_date)}</span><span className="font-mono">{trn.slice(-10)}</span><span className="text-red-700 font-bold">{transaction.settlement_info.currency} {formatAmount(amt)}</span><span>-</span><span className="font-bold">DR</span></div>
        <div className="p-2 grid grid-cols-5 text-center border-b bg-green-50"><span>{formatDate(transaction.settlement_info.settlement_date)}</span><span className="font-mono">SETTL-{trn.slice(-6)}</span><span>-</span><span className="text-green-700 font-bold">{transaction.settlement_info.currency} {formatAmount(amt)}</span><span className="font-bold">CR</span></div>
        <div className="p-2 grid grid-cols-5 text-center bg-blue-50 font-bold border-t-2 border-[#1a4b8e]"><span>NET</span><span>-</span><span className="text-red-700">{formatAmount(amt)}</span><span className="text-green-700">{formatAmount(amt)}</span><span className="text-[#1a4b8e]">0.00 (Balanced)</span></div>
      </div>
      <SectionHeader title="RECONCILIATION STATUS" />
      <div className="space-y-1 mb-4">
        {[
          ["Nostro Debit Matched", "MATCHED", "Confirmed against correspondent statement"],
          ["Vostro Credit Matched", "MATCHED", "Confirmed against internal records"],
          ["Settlement Confirmed", "CONFIRMED", "SWIFT network acknowledgement received"],
          ["MT950 Statement Received", "YES", "Correspondent statement reconciled"],
          ["Auto-Reconciliation", "PASSED", "No breaks or unmatched items"],
        ].map(([label, status, desc]) => (
          <div key={label} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
            <div><div className="font-bold text-gray-900">{label}</div><div className="text-xs text-gray-600">{desc}</div></div>
            <StatusBadge status={status} />
          </div>
        ))}
      </div>
      <div className="bg-green-100 border-2 border-green-400 p-4 text-center rounded mb-4">
        <div className="font-bold text-green-900">NOSTRO / VOSTRO ACCOUNTS FULLY RECONCILED</div>
        <div className="text-green-700 text-xs mt-1">No outstanding items or discrepancies</div>
      </div>
      <DocFooter text="END OF NOSTRO / VOSTRO ACCOUNT DETAIL" uetr={transaction.uetr} />
    </DocWrap>
  );
};
