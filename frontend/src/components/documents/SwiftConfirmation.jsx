import { Check } from "lucide-react";
import { DocWrap, IsoLogo, DocBanner, FieldRow, BracketHeader, BorderedSection, CheckItem, ApprovalStamp, DocFooter, DocHeaderStrip, formatAmount, formatDate, formatDateLong, formatDateTime, getTrn, getMsgId } from "./DocHelpers";

export const SwiftConfirmation = ({ transaction }) => {
  const trn = getTrn(transaction.uetr);
  const messageId = getMsgId();

  return (
    <DocWrap>
      <DocHeaderStrip uetr={transaction.uetr} docType="SWIFTCONF" />
      <IsoLogo />
      <DocBanner
        title="SWIFT PAYMENT CONFIRMATION COPY"
        subtitle="(CORRESPONDENT / NOSTRO SETTLEMENT CONFIRMATION)"
      />

      {/* Message Type timestamp */}
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
        <BracketHeader title="TRANSACTION REFERENCES" />
        <BorderedSection>
          <FieldRow label="Message Identification" value={messageId} mono />
          <FieldRow label="Instruction ID" value={`INST${trn}`} mono />
          <FieldRow label="End-To-End ID" value={transaction.uetr.toUpperCase().replace(/-/g, '')} mono />
          <FieldRow label="MUR" value={`MUR${Date.now().toString().slice(-8)}`} mono />
          <FieldRow label="UETR" value={transaction.uetr} mono />
          <FieldRow label="SWIFT Reference" value={`SWIFT${trn.slice(-10)}`} mono />
          <FieldRow label="SWIFT Request Reference" value={`REQ${trn.slice(-12)}`} mono />
        </BorderedSection>
      </div>

      {/* Participating Banks */}
      <div className="mb-6">
        <BracketHeader title="PARTICIPATING BANKS" />
        <BorderedSection>
          <FieldRow label="Sender Bank" value={transaction.instructing_agent.name} />
          <FieldRow label="Sender BIC" value={transaction.instructing_agent.bic} mono />
          <div className="mt-2" />
          <FieldRow label="Receiver / Beneficiary" value={transaction.instructed_agent.name} />
          <FieldRow label="Beneficiary Bank BIC" value={transaction.instructed_agent.bic} mono />
          <div className="mt-2" />
          <FieldRow label="Correspondent Network" value="SWIFT GLOBAL SERVER" />
        </BorderedSection>
      </div>

      {/* Settlement Details */}
      <div className="mb-6">
        <BracketHeader title="SETTLEMENT DETAILS" />
        <BorderedSection>
          <FieldRow label="Settlement Method" value={transaction.settlement_info.method} />
          <FieldRow label="Settlement Priority" value={transaction.settlement_info.priority} />
          <FieldRow label="Interbank Settle Date" value={formatDateLong(transaction.settlement_info.settlement_date).toUpperCase().replace(/ /g, '-')} />
          <FieldRow label="Settlement Amount" value={`${transaction.settlement_info.currency} ${formatAmount(transaction.settlement_info.interbank_settlement_amount)}`} mono />
        </BorderedSection>
      </div>

      {/* Nostro/Vostro Status */}
      <div className="mb-6">
        <BracketHeader title="NOSTRO / VOSTRO STATUS" />
        <BorderedSection>
          <FieldRow label="CURRENT STATUS" value="CREDITED TO RECEIVER NOSTRO ACCOUNT" />
        </BorderedSection>
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
        <BracketHeader title="MULTI-LEVEL CONFIRMATIONS" />
        <BorderedSection>
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
        </BorderedSection>
        <p className="mt-2 text-gray-700">
          The SWIFT Global Server confirms that the transaction is currently positioned
          in the NOSTRO account of the beneficiary bank and is fully cleared at the
          correspondent level.
        </p>
      </div>

      {/* Global Tracking & IP Verification */}
      <div className="mb-6">
        <BracketHeader title="GLOBAL TRACKING & IP VERIFICATION" />
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

      {/* Final SWIFT Confirmation */}
      <div className="mb-6">
        <BracketHeader title="FINAL SWIFT CONFIRMATION" />
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

      <ApprovalStamp date={formatDate(new Date().toISOString())} />
      <DocFooter text="END OF SWIFT CONFIRMATION COPY" uetr={transaction.uetr} />
    </DocWrap>
  );
};
