import { Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Document Wrapper - bank-grade monospace receipt style
export const DocWrap = ({ children }) => (
  <div className="bg-white border border-gray-300 shadow-lg font-mono text-xs p-8 relative" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
    {children}
  </div>
);

// ISO Logo header line - BIG SIZE
export const IsoLogo = () => (
  <div className="flex items-center gap-4 mb-6">
    <img src="/iso-logo.png" alt="ISO 20022" className="w-24 h-24 object-contain" />
    <div>
      <span className="font-bold text-xl text-[#1a4b8e]">ISO 20022</span>
      <div className="text-gray-500 text-xs">SWIFT Transfer Platform</div>
    </div>
  </div>
);

// SWIFT Logo (text-based, professional)
export const SwiftLogo = () => (
  <div className="flex flex-col items-center">
    <div className="bg-[#1a3a6e] text-white px-4 py-2 rounded">
      <div className="font-bold text-base tracking-widest" style={{ fontFamily: "Arial, sans-serif" }}>SWIFT</div>
    </div>
    <div className="text-[8px] text-gray-500 mt-0.5 tracking-wider" style={{ fontFamily: "Arial, sans-serif" }}>GLOBAL NETWORK</div>
  </div>
);

// Barcode Component
export const Barcode = ({ value }) => {
  const bars = value.split('').map((c) => {
    const code = c.charCodeAt(0);
    return [(code % 4) + 1, ((code * 2) % 3) + 1, ((code * 3) % 4) + 1];
  }).flat();
  return (
    <div className="flex justify-center items-center py-3 bg-white">
      <div className="flex h-12">
        {bars.slice(0, 80).map((w, i) => (
          <div key={i} className={`h-12 ${i % 2 === 0 ? 'bg-black' : 'bg-white'}`} style={{ width: `${w}px` }} />
        ))}
      </div>
    </div>
  );
};

// QR Code Component
export const QR = ({ value, size = 80 }) => (
  <div className="bg-white p-2 border border-gray-300 inline-block" style={{ width: size + 16, height: size + 16 }}>
    <QRCodeSVG value={`SWIFT-TXN:${value}`} size={size} level="H" bgColor="#FFFFFF" fgColor="#000000" />
  </div>
);

// Document header strip: barcode on left, SWIFT logo on right
export const DocHeaderStrip = ({ uetr, docType }) => (
  <div className="flex items-start justify-between mb-4">
    <Barcode value={`${docType}-${uetr}`} />
    <img src="/swift-logo.png" alt="SWIFT" className="w-14 h-14 object-contain" />
  </div>
);

// Title banner - bank-grade with color accent
export const DocBanner = ({ title, subtitle, color = "#1a4b8e" }) => (
  <div className="p-4 mb-6 text-center border-2" style={{ borderColor: color }}>
    <div className="inline-block px-8 py-2 border" style={{ borderColor: color }}>
      <div className="font-bold text-sm" style={{ color }}>{title}</div>
      {subtitle && <div className="text-gray-600 mt-1">{subtitle}</div>}
    </div>
  </div>
);

// Field Row Component - enhanced with color
export const FieldRow = ({ label, value, mono = false, labelWidth = "w-56", highlight = false }) => (
  <div className={`flex py-0.5 ${highlight ? 'bg-blue-50 px-2 -mx-2 rounded' : ''}`}>
    <span className={`text-gray-600 ${labelWidth} flex-shrink-0`}>{label}:</span>
    <span className={`${highlight ? 'text-[#1a4b8e] font-bold' : 'text-gray-900'} ${mono ? 'font-mono' : ''}`}>{value || '-'}</span>
  </div>
);

// Section Header - bank-grade with color accent
export const SectionHeader = ({ title, color = "#1a4b8e" }) => (
  <div className="py-1.5 px-3 my-4 text-center" style={{ borderTop: `2px solid ${color}`, borderBottom: `2px solid ${color}`, backgroundColor: `${color}10` }}>
    <span className="text-xs font-bold tracking-wider" style={{ color }}>{title}</span>
  </div>
);

// Bracketed section header
export const BracketHeader = ({ title }) => (
  <div className="text-[#1a4b8e] font-bold mb-2">[ {title} ]</div>
);

// Checkmark Item
export const CheckItem = ({ children, color = "black" }) => (
  <div className="flex items-start gap-2 py-0.5">
    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color === "green" ? "text-green-600" : "text-[#1a4b8e]"}`} strokeWidth={2.5} />
    <span className={color === "green" ? "text-green-700 font-semibold" : "text-gray-900"}>{children}</span>
  </div>
);

// Document footer: ISO banner bottom-LEFT, QR bottom-RIGHT
export const DocFooter = ({ text, uetr = "" }) => (
  <div className="mt-8">
    <div className="pt-4 border-t-2 border-[#1a4b8e] text-center font-bold mb-4" style={{ color: '#1a4b8e' }}>
      {text}
    </div>
    <div className="flex items-end justify-between mt-4">
      <img src="/iso-20022-banner.png" alt="ISO 20022" className="w-64 object-contain" />
      <div className="flex flex-col items-center">
        <QR value={uetr || text} size={65} />
        <div className="text-[8px] text-gray-400 mt-1">Scan to verify</div>
      </div>
    </div>
  </div>
);

// Bordered data section
export const BorderedSection = ({ children }) => (
  <div className="border-t border-b border-gray-300 py-2">
    {children}
  </div>
);

// Approval stamp
export const ApprovalStamp = ({ date }) => (
  <div className="flex justify-end mt-8">
    <div className="border-2 border-green-600 text-green-600 px-6 py-3 transform rotate-[-5deg]">
      <div className="font-bold text-center">PAYMENT APPROVED</div>
      <div className="text-xs text-center mt-1">{date}</div>
    </div>
  </div>
);

// Color-coded status badge
export const StatusBadge = ({ status }) => {
  const styles = {
    SUCCESSFUL: "bg-green-100 text-green-800 border-green-300",
    CONFIRMED: "bg-green-100 text-green-800 border-green-300",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    FAILED: "bg-red-100 text-red-800 border-red-300",
    FINALIZED: "bg-blue-100 text-blue-800 border-blue-300",
  };
  return (
    <span className={`inline-block px-3 py-1 border rounded font-bold text-xs ${styles[status] || "bg-gray-100 text-gray-800 border-gray-300"}`}>
      {status}
    </span>
  );
};

// Amount highlight box
export const AmountBox = ({ currency, amount, label = "Settlement Amount", type = "neutral" }) => {
  const colors = {
    credit: { bg: "bg-green-50", border: "border-green-500", text: "text-green-800" },
    debit: { bg: "bg-red-50", border: "border-red-500", text: "text-red-800" },
    neutral: { bg: "bg-blue-50", border: "border-[#1a4b8e]", text: "text-[#1a4b8e]" },
  };
  const c = colors[type] || colors.neutral;
  return (
    <div className={`${c.bg} border-2 ${c.border} p-4 text-center my-4 rounded`}>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${c.text}`}>{currency} {formatAmount(amount)}</div>
    </div>
  );
};

// Format helpers
export const formatAmount = (amount) =>
  new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

export const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('de-DE') : '-';

export const formatDateLong = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDateTime = (dateStr) =>
  dateStr ? `${new Date(dateStr).toISOString().replace('T', ' ').slice(0, -5)}Z` : '-';

export const getTrn = (uetr) => `MX${uetr.replace(/-/g, '').slice(0, 12).toUpperCase()}`;
export const getMsgId = () => `MX${Date.now().toString().slice(-10)}`;
