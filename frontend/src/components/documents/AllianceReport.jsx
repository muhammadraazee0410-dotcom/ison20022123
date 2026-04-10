import { DocWrap, IsoLogo, FieldRow, SectionHeader, DocFooter, DocHeaderStrip, formatAmount, formatDateTime, getTrn } from "./DocHelpers";

export const AllianceReport = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);

  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="ALLIANCE" />
      <IsoLogo />

      {/* Alliance Header */}
      <div className="bg-gray-900 text-white text-center py-3 mb-1">
        <div className="font-bold text-sm tracking-wider">ALLIANCE MESSAGE MANAGEMENT</div>
      </div>
      <div className="bg-gray-700 text-gray-200 text-center py-2 mb-4">
        <div className="text-xs tracking-wider">INSTANCE SEARCH - DETAILED REPORT</div>
      </div>

      {/* Report Metadata */}
      <div className="mb-6 border-b border-gray-300 pb-4">
        <FieldRow label="Report Generated" value={formatDateTime(new Date().toISOString())} />
        <FieldRow label="Status" value="VERIFIED" />
      </div>

      {/* Report Header */}
      <SectionHeader title="REPORT HEADER" />
      <div className="mb-6">
        <FieldRow label="Application" value="Alliance Message Management" />
        <FieldRow label="Report type" value="Instance Search Detailed Report" />
        <FieldRow label="Operator" value="SAAPROD" />
        <FieldRow label="Alliance Server Instance" value="BISHNUPADA" />
        <FieldRow label="Date Time" value={formatDateTime(transaction.created_at)} />
      </div>

      {/* Report Content */}
      <SectionHeader title="REPORT CONTENT" />
      <div className="mb-6">
        <FieldRow label="Message Instance Details Reprint From" value={`REF-${trn}`} mono />
      </div>

      {/* Instance Type and Transmission */}
      <SectionHeader title="INSTANCE TYPE AND TRANSMISSION" />
      <div className="mb-6">
        <FieldRow label="Notification" value="(Transmission) of Original sent to SWIFTNet (ACK)" />
        <FieldRow label="Network Delivery Status" value="Network Ack" />
        <FieldRow label="Priority/Delivery" value="Normal" />
        <FieldRow label="Message Input Reference" value={`MIR${trn.slice(-10)}`} mono />
      </div>

      {/* Message Header */}
      <SectionHeader title="MESSAGE HEADER" />
      <div className="mb-6">
        <FieldRow label="MX Input" value={`CBPRPlus-${transaction.message_type}_FinancialInstitutionCreditTransfer ${transaction.message_type}`} />
        <FieldRow label="Requestor DN" value={`ou=lod,o=${transaction.instructed_agent.bic.toLowerCase()},o=swift`} mono />
        <FieldRow label="Sender" value={transaction.instructing_agent.bic} mono />
        <FieldRow label="Responder DN" value={transaction.instructed_agent.bic} mono />
        <FieldRow label="MUR" value={`ou=xxx,o=${transaction.instructed_agent.bic.toLowerCase()},o=swift`} mono />
        <FieldRow label="Service Name" value={transaction.business_service} />
        <FieldRow label="Non-repudiation Indicator" value="False" />
        <FieldRow label="SWIFT Reference" value={`SWIFT${trn.slice(-10)}`} mono />
        <FieldRow label="SWIFT Request Reference" value={`REQ${trn.slice(-12)}`} mono />
        <FieldRow label="Store-and-forward Input Time" value={formatDateTime(transaction.created_at)} mono />
        <FieldRow label="Signing DN" value={`cn=sign,o=${transaction.instructing_agent.bic.toLowerCase()},o=swift`} mono />
        <FieldRow label="UETR" value={transaction.uetr} mono />
      </div>

      {/* Message Text (XML-like structure) */}
      <SectionHeader title="MESSAGE TEXT" />
      <div className="mb-6 bg-gray-50 border border-gray-200 p-4">
        <div className="space-y-1">
          <div className="text-gray-500">FinancialInstitutionIdentification</div>
          <div className="ml-4"><span className="text-gray-500">BICFI:</span> <span className="font-mono">{transaction.instructing_agent.bic}</span></div>
          <div className="text-gray-500">FinancialInstitutionIdentification</div>
          <div className="ml-4"><span className="text-gray-500">BICFI:</span> <span className="font-mono">{transaction.instructed_agent.bic}</span></div>
          <div className="mt-2" />
          <div><span className="text-gray-500">BusinessMessageIdentifier:</span> <span className="font-mono">{`BMI${trn}`}</span></div>
          <div><span className="text-gray-500">MessageDefinitionIdentifier:</span> <span className="font-mono">{transaction.message_type}</span></div>
          <div><span className="text-gray-500">BusinessService:</span> <span className="font-mono">{transaction.business_service}</span></div>
          <div><span className="text-gray-500">CreationDate:</span> <span className="font-mono">{formatDateTime(transaction.created_at)}</span></div>
          <div className="mt-2 font-bold text-gray-700">FinancialInstitutionCreditTransferV08 GroupHeader</div>
          <div className="ml-4"><span className="text-gray-500">MessageIdentification:</span> <span className="font-mono">{`MX${Date.now().toString().slice(-10)}`}</span></div>
          <div className="ml-4"><span className="text-gray-500">CreationDateTime:</span> <span className="font-mono">{formatDateTime(transaction.created_at)}</span></div>
          <div className="ml-4"><span className="text-gray-500">NumberOfTransactions:</span> 1</div>
          <div className="mt-2 font-bold text-gray-700">SettlementInformation</div>
          <div className="ml-4"><span className="text-gray-500">SettlementMethod:</span> {transaction.settlement_info.method}</div>
          <div className="mt-2 font-bold text-gray-700">CreditTransferTransactionInformation PaymentIdentification</div>
          <div className="ml-4"><span className="text-gray-500">InstructionIdentification:</span> <span className="font-mono">{`INST${trn}`}</span></div>
          <div className="ml-4"><span className="text-gray-500">EndToEndIdentification:</span> <span className="font-mono">{transaction.uetr.toUpperCase().replace(/-/g, '')}</span></div>
          <div className="ml-4"><span className="text-gray-500">UETR:</span> <span className="font-mono">{transaction.uetr}</span></div>
          <div className="ml-4"><span className="text-gray-500">InterbankSettlementAmount:</span> <span className="font-mono">{formatAmount(transaction.settlement_info.interbank_settlement_amount)}</span></div>
          <div className="ml-4"><span className="text-gray-500">ActiveCurrencyCode:</span> {transaction.settlement_info.currency} (EURO)</div>
          <div className="ml-4"><span className="text-gray-500">InterbankSettlementDate:</span> <span className="font-mono">{transaction.settlement_info.settlement_date}</span></div>
          <div className="ml-4"><span className="text-gray-500">Settlement Priority:</span> NORM</div>
          <div className="mt-2 font-bold text-gray-700">InstructingAgent/FinancialInstitutionIdentification</div>
          <div className="ml-4"><span className="text-gray-500">BICFI:</span> <span className="font-mono">{transaction.instructing_agent.bic}</span></div>
          <div className="mt-2 font-bold text-gray-700">InstructedAgent/FinancialInstitutionIdentification</div>
          <div className="ml-4"><span className="text-gray-500">BICFI:</span> <span className="font-mono">{transaction.instructed_agent.bic}</span></div>
          <div className="mt-2 font-bold text-gray-700">Debtor/FinancialInstitutionIdentification</div>
          <div className="ml-4"><span className="text-gray-500">Name:</span> {transaction.debtor.name}</div>
          <div className="mt-2 font-bold text-gray-700">DebtorAccount</div>
          <div className="ml-4"><span className="text-gray-500">Identification:</span> <span className="font-mono">{transaction.debtor.iban}</span></div>
          <div className="mt-2 font-bold text-gray-700">CreditorAgent/FinancialInstitutionIdentification</div>
          <div className="ml-4"><span className="text-gray-500">BICFI:</span> <span className="font-mono">{transaction.instructed_agent.bic}</span></div>
          <div className="mt-2 font-bold text-gray-700">Creditor/FinancialInstitutionIdentification</div>
          <div className="ml-4"><span className="text-gray-500">Name:</span> {transaction.creditor.name}</div>
          <div className="mt-2 font-bold text-gray-700">CreditorAccount</div>
          <div className="ml-4"><span className="text-gray-500">Identification:</span> <span className="font-mono">{transaction.creditor.iban || 'N/A'}</span></div>
          <div className="mt-2 font-bold text-gray-700">RemittanceInformation</div>
          <div className="ml-4"><span className="text-gray-500">Unstructured:</span> {transaction.remittance_info}</div>
        </div>
      </div>

      {/* Report Footer */}
      <SectionHeader title="REPORT FOOTER" />
      <div className="mb-4">
        <FieldRow label="Number of Entities" value="1" />
        <FieldRow label="End of Report" value="TRUE" />
      </div>

      <div className="text-center text-gray-500 mt-4 text-xs">
        CONFIDENTIAL - ALLIANCE ACCESS SYSTEM v2.5.4 - SWIFT 2025
      </div>

      <DocFooter text="END OF ALLIANCE REPORT" uetr={transaction.uetr} />
    </DocWrap>
  );
};
