import { DocWrap, IsoLogo, DocBanner, FieldRow, CheckItem, DocFooter, formatAmount, formatDateLong, getTrn, getMsgId } from "./DocHelpers";

export const SettlementLetter = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();

  return (
    <DocWrap>
      <IsoLogo />
      <DocBanner
        title="PAYMENT SETTLEMENT CONFIRMATION LETTER"
        subtitle="(FOR CORRESPONDENT / BENEFICIARY BANK USE)"
      />

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

      <DocFooter text="END OF CONFIRMATION LETTER" />
    </DocWrap>
  );
};
