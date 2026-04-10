import { DocWrap, IsoLogo, DocBanner, FieldRow, CheckItem, DocFooter, DocHeaderStrip, AmountBox, SectionHeader, formatAmount, formatDateLong, getTrn, getMsgId } from "./DocHelpers";

export const SettlementLetter = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();

  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="SETTLE" />
      <IsoLogo />
      <DocBanner
        title="PAYMENT SETTLEMENT CONFIRMATION LETTER"
        subtitle="(FOR CORRESPONDENT / BENEFICIARY BANK USE)"
      />

      {/* Explanation */}
      <div className="bg-gray-50 border border-gray-200 p-3 mb-6 rounded">
        <p className="text-gray-700 leading-relaxed">This Settlement Confirmation Letter certifies that the below-referenced financial institution credit transfer has been successfully processed, acknowledged, and settled through the SWIFT Global Network in accordance with CBPR+ standards. The transaction was active on the SWIFT Global Server and has been successfully moved into the respective Nostro/Vostro accounts without any exception, rejection, or compliance hold.</p>
      </div>

      {/* Letter Header */}
      <div className="mb-6">
        <FieldRow label="To" value="Correspondent / Beneficiary Bank" labelWidth="w-24" highlight />
        <FieldRow label="Attention" value="Operations / Payments Department" labelWidth="w-24" />
        <div className="mt-4" />
        <FieldRow label="From" value="Operations & Settlement Desk" labelWidth="w-24" />
        <FieldRow label="Via" value="SWIFT Network (CBPR+)" labelWidth="w-24" />
        <FieldRow label="Date" value={formatDateLong(transaction.settlement_info.settlement_date)} labelWidth="w-24" />
      </div>

      {/* Subject */}
      <div className="mb-6 bg-blue-50 border border-blue-200 p-3 rounded">
        <div className="font-bold text-[#1a4b8e]">SUBJECT: CONFIRMATION OF SUCCESSFUL SETTLEMENT</div>
        <div className="ml-16 text-gray-700">SWIFT MX {transaction.message_type} - NOSTRO / VOSTRO MOVEMENT</div>
      </div>

      <AmountBox currency={transaction.settlement_info.currency} amount={transaction.settlement_info.interbank_settlement_amount} />

      {/* Transaction References */}
      <SectionHeader title="TRANSACTION REFERENCES" />
      <div className="mb-6">
        <FieldRow label="Message Type" value={transaction.message_type} highlight />
        <FieldRow label="Business Service" value={transaction.business_service} />
        <FieldRow label="Message Identification" value={messageId} mono />
        <FieldRow label="Instruction Identification" value={`INST${trn}`} mono />
        <FieldRow label="End-To-End Identification" value={transaction.uetr.toUpperCase().replace(/-/g, '')} mono />
        <FieldRow label="MUR" value={`MUR${Date.now().toString().slice(-8)}`} mono />
        <FieldRow label="UETR" value={transaction.uetr} mono highlight />
        <div className="mt-2" />
        <FieldRow label="SWIFT Reference" value={`SWIFT${trn.slice(-10)}`} mono />
        <FieldRow label="SWIFT Request Reference" value={`REQ${trn.slice(-12)}`} mono />
      </div>

      {/* Participating Institutions */}
      <SectionHeader title="PARTICIPATING INSTITUTIONS" />
      <div className="mb-6">
        <div className="bg-blue-50 p-3 border border-blue-200 rounded mb-2">
          <FieldRow label="Instructing Agent (Sender)" value={transaction.instructing_agent.name} highlight />
          <FieldRow label="Sender BIC" value={transaction.instructing_agent.bic} mono />
        </div>
        <div className="bg-green-50 p-3 border border-green-200 rounded">
          <FieldRow label="Instructed Agent (Receiver)" value={transaction.instructed_agent.name} highlight />
          <FieldRow label="Receiver BIC" value={transaction.instructed_agent.bic} mono />
        </div>
      </div>

      {/* Settlement Confirmation */}
      <SectionHeader title="SETTLEMENT CONFIRMATION" />
      <div className="mb-6">
        <FieldRow label="Settlement Method" value={transaction.settlement_info.method} />
        <FieldRow label="Settlement Priority" value={transaction.settlement_info.priority} />
        <FieldRow label="Interbank Settlement Date" value={formatDateLong(transaction.settlement_info.settlement_date)} highlight />
        <FieldRow label="Settlement Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono highlight />
      </div>

      {/* Checkmarks */}
      <div className="mb-6">
        <CheckItem>Amount debited from sender Vostro account</CheckItem>
        <CheckItem>Amount credited to receiver Nostro account</CheckItem>
        <CheckItem>Network Acknowledgement received (ACK)</CheckItem>
        <CheckItem>Settlement completed at correspondent level</CheckItem>
      </div>

      {/* Underlying Customer Details */}
      <SectionHeader title="UNDERLYING CUSTOMER DETAILS" />
      <div className="mb-6">
        <FieldRow label="Debtor" value={transaction.debtor.name} highlight />
        <FieldRow label="Debtor Account (IBAN)" value={transaction.debtor.iban} mono />
        <FieldRow label="Creditor" value={transaction.creditor.name} highlight />
        <FieldRow label="Creditor Account (IBAN)" value={transaction.creditor.iban || 'N/A'} mono />
        <FieldRow label="Remittance Information" value={transaction.remittance_info} />
      </div>

      {/* Final Confirmation */}
      <SectionHeader title="FINAL CONFIRMATION" />
      <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded">
        <p className="leading-relaxed text-green-900">
          We confirm that this transaction is <strong>FINAL and SETTLED</strong>. No further action is
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

      <DocFooter text="END OF CONFIRMATION LETTER" uetr={transaction.uetr} />
    </DocWrap>
  );
};
