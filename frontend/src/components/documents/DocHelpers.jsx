import { Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Document Wrapper - standard monospace receipt style
export const DocWrap = ({ children }) => (
  <div className="bg-white border border-gray-200 shadow-lg font-mono text-xs p-8" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
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

// Barcode Component - shared across all docs
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

// QR Code Component - shared across all docs
export const QR = ({ value, size = 80 }) => (
  <div className="bg-white p-2 border border-gray-300 inline-block" style={{ width: size + 16, height: size + 16 }}>
    <QRCodeSVG value={`SWIFT-TXN:${value}`} size={size} level="H" bgColor="#FFFFFF" fgColor="#000000" />
  </div>
);

// Document header strip with barcode + QR
export const DocHeaderStrip = ({ uetr, docType }) => (
  <div className="flex items-start justify-between mb-4">
    <Barcode value={`${docType}-${uetr}`} />
    <QR value={`${docType}:${uetr}`} size={70} />
  </div>
);

// Title banner with double border
export const DocBanner = ({ title, subtitle }) => (
  <div className="border-2 border-gray-800 p-4 mb-6 text-center">
    <div className="border border-gray-400 inline-block px-8 py-2">
      <div className="font-bold text-sm">{title}</div>
      {subtitle && <div className="text-gray-600">{subtitle}</div>}
    </div>
  </div>
);

// Field Row Component
export const FieldRow = ({ label, value, mono = false, labelWidth = "w-56" }) => (
  <div className="flex py-0.5">
    <span className={`text-gray-600 ${labelWidth} flex-shrink-0`}>{label}:</span>
    <span className={`text-gray-900 ${mono ? 'font-mono' : ''}`}>{value || '-'}</span>
  </div>
);

// Section Header
export const SectionHeader = ({ title }) => (
  <div className="border-t border-b py-1 px-2 my-4 text-center border-gray-300 bg-gray-100">
    <span className="text-xs font-semibold tracking-wider text-gray-700">{title}</span>
  </div>
);

// Bracketed section header (used in confirmation/status docs)
export const BracketHeader = ({ title }) => (
  <div className="text-gray-500 mb-2">[ {title} ]</div>
);

// Checkmark Item
export const CheckItem = ({ children, color = "black" }) => (
  <div className="flex items-start gap-2 py-0.5">
    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color === "green" ? "text-green-600" : "text-gray-700"}`} strokeWidth={2} />
    <span className={color === "green" ? "text-green-600" : "text-gray-900"}>{children}</span>
  </div>
);

// Document footer with ISO 20022 banner
export const DocFooter = ({ text }) => (
  <div className="mt-8">
    <div className="pt-4 border-t-2 border-gray-800 text-center font-bold mb-6">
      {text}
    </div>
    <div className="mt-4">
      <img src="/iso-20022-banner.png" alt="ISO 20022 - Universal financial industry message scheme" className="w-full max-w-lg mx-auto object-contain" />
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

// Generate TRN from UETR
export const getTrn = (uetr) => `MX${uetr.replace(/-/g, '').slice(0, 12).toUpperCase()}`;
export const getMsgId = () => `MX${Date.now().toString().slice(-10)}`;
