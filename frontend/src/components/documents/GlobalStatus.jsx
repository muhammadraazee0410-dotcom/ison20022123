import { DocWrap, IsoLogo, DocBanner, FieldRow, SectionHeader, CheckItem, DocFooter, DocHeaderStrip, formatAmount, formatDate, formatDateLong, formatDateTime, getTrn, getMsgId } from "./DocHelpers";

export const GlobalStatus = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();

  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="GPSS" />
      <IsoLogo />
      <DocBanner
        title="GLOBAL PAYMENT STATUS STATEMENT"
        subtitle="(SWIFT MX PACS.009.001.08 CONFIRMATION)"
      />

      {/* System Information */}
      <div className="mb-6">
        <FieldRow label="SYSTEM SOURCE" value="SWIFT ALLIANCE MESSAGE MANAGEMENT (SAAPROD)" />
        <FieldRow label="APPLICATION" value="Alliance Message Management" />
        <FieldRow label="REPORT TYPE" value="Instance Search - Detailed Report" />
        <FieldRow label="REPORT STATUS" value="VERIFIED" />
        <FieldRow label="NETWORK STATUS" value="NETWORK ACK (SUCCESSFUL)" />
      </div>

      {/* Global Server Status */}
      <SectionHeader title="GLOBAL SERVER STATUS" />
      <div className="mb-6">
        <p className="leading-relaxed mb-4">
          The referenced payment message has been successfully processed on the SWIFT Global Server.
          Settlement has been completed at the correspondent banking level with full network acknowledgement.
        </p>
        <CheckItem>ACTIVE ON GLOBAL SWIFT SERVER</CheckItem>
        <CheckItem>SUCCESSFULLY MOVED INTO NOSTRO / VOSTRO ACCOUNT</CheckItem>
        <CheckItem>SETTLEMENT FLOW COMPLETED AT CORRESPONDENT LEVEL</CheckItem>
      </div>

      {/* Message Identification Details */}
      <SectionHeader title="MESSAGE IDENTIFICATION DETAILS" />
      <div className="mb-6">
        <FieldRow label="Message Type" value={transaction.message_type} />
        <FieldRow label="Business Service" value={transaction.business_service} />
        <FieldRow label="Message Input Reference" value={`MIR${trn.slice(-10)}`} mono />
        <FieldRow label="Message Identification" value={messageId} mono />
        <FieldRow label="Instruction Identification" value={`INST${trn}`} mono />
        <FieldRow label="End-To-End Identification" value={transaction.uetr.toUpperCase().replace(/-/g, '')} mono />
        <FieldRow label="SWIFT Reference" value={`SWIFT${trn.slice(-10)}`} mono />
        <FieldRow label="SWIFT Request Reference" value={`REQ${trn.slice(-12)}`} mono />
        <FieldRow label="MUR" value={`MUR${Date.now().toString().slice(-8)}`} mono />
        <FieldRow label="UETR" value={transaction.uetr} mono />
        <FieldRow label="Store & Forward Input Time" value={formatDateTime(transaction.created_at)} mono />
        <FieldRow label="Creation Date & Time" value={formatDateTime(transaction.created_at)} mono />
      </div>

      {/* Participating Financial Institutions */}
      <SectionHeader title="PARTICIPATING FINANCIAL INSTITUTIONS" />
      <div className="mb-6">
        <div className="font-bold text-gray-700 mb-1">Instructing Agent (Sender)</div>
        <FieldRow label="Bank Name" value={transaction.instructing_agent.name} />
        <FieldRow label="Bank BIC" value={transaction.instructing_agent.bic} mono />
        <FieldRow label="Country" value={transaction.instructing_agent.country} />
        <div className="mt-3" />
        <div className="font-bold text-gray-700 mb-1">Instructed Agent (Receiver)</div>
        <FieldRow label="Bank Name" value={transaction.instructed_agent.name} />
        <FieldRow label="Bank BIC" value={transaction.instructed_agent.bic} mono />
        <FieldRow label="Country" value={transaction.instructed_agent.country} />
      </div>

      {/* Nostro / Vostro Movement Confirmation */}
      <SectionHeader title="NOSTRO / VOSTRO MOVEMENT CONFIRMATION" />
      <div className="mb-6">
        <FieldRow label="Settlement Method" value={transaction.settlement_info.method} />
        <FieldRow label="Settlement Priority" value={transaction.settlement_info.priority} />
        <FieldRow label="Interbank Settlement Date" value={formatDateLong(transaction.settlement_info.settlement_date)} />
        <FieldRow label="Interbank Settlement Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
        <div className="mt-3" />
        <CheckItem>DEBITED from the Sender's VOSTRO account</CheckItem>
        <CheckItem>CREDITED into the Receiver's NOSTRO account</CheckItem>
        <CheckItem>CONFIRMED under SWIFT Network Acknowledgement</CheckItem>
      </div>

      {/* Underlying Transaction Details */}
      <SectionHeader title="UNDERLYING TRANSACTION DETAILS" />
      <div className="mb-6">
        <FieldRow label="Debtor Name" value={transaction.debtor.name} />
        <FieldRow label="Debtor Account (IBAN)" value={transaction.debtor.iban} mono />
        <FieldRow label="Creditor Name" value={transaction.creditor.name} />
        <FieldRow label="Creditor Account (IBAN)" value={transaction.creditor.iban || 'N/A'} mono />
        <FieldRow label="Remittance Information" value={transaction.remittance_info} />
      </div>

      {/* Final System Confirmation */}
      <SectionHeader title="FINAL SYSTEM CONFIRMATION" />
      <div className="mb-6">
        <p className="leading-relaxed">
          This payment has been fully verified on the SWIFT Global Server. No rejection, hold,
          or compliance flags exist. The transaction is FINALIZED at all levels of the settlement chain.
        </p>
      </div>

      {/* System Footer */}
      <SectionHeader title="SYSTEM FOOTER" />
      <div className="mb-4">
        <FieldRow label="Alliance Server Instance" value="SAAPROD" />
        <FieldRow label="Operator" value="BISHNUPADA" />
        <FieldRow label="Report Generated" value={formatDateTime(new Date().toISOString())} />
        <FieldRow label="CONFIDENTIAL" value="SWIFT Alliance Access System v2.5.4" />
      </div>

      <DocFooter text="END OF STATEMENT" uetr={transaction.uetr} />
    </DocWrap>
  );
};
