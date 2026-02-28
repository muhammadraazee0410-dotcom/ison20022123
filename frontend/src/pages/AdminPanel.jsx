import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Euro,
  CircleDollarSign,
  Wallet,
  Building2,
  UserCircle,
  PlusCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Terminal,
  Loader2,
  Shield,
  Globe,
  CreditCard,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ============ BALANCE CARDS ============
const BalanceSection = ({ balance }) => {
  const fmt = (val, currency) =>
    new Intl.NumberFormat(currency === "EUR" ? "de-DE" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="balance-section">
      <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Euro className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400 uppercase tracking-wider font-medium">Available Balance EUR</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono" data-testid="balance-eur">
            {fmt(balance?.available_eur || 0, "EUR")}
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-500/30 bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-slate-400 uppercase tracking-wider font-medium">Available Balance USD</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono" data-testid="balance-usd">
            {fmt(balance?.available_usd || 0, "USD")}
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-[#DB0011]/40 bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#DB0011]/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#DB0011]" />
            </div>
            <span className="text-sm text-slate-400 uppercase tracking-wider font-medium">Total Available Balance</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono" data-testid="balance-total">
            {fmt(balance?.total_combined_eur || 0, "EUR")}
          </p>
          <p className="text-xs text-slate-500 mt-1">{balance?.account_count || 0} accounts</p>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ SERVER TERMINAL ============
const ServerTerminal = ({ logs, loading }) => {
  const termRef = useRef(null);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [logs]);

  const levelColor = (level) => {
    switch (level) {
      case "OK": return "text-green-400";
      case "ERROR": return "text-red-400";
      case "WARN": return "text-yellow-400";
      case "SYSTEM": return "text-cyan-400";
      default: return "text-slate-300";
    }
  };

  const levelBadge = (level) => {
    switch (level) {
      case "OK": return "bg-green-900/50 text-green-400 border-green-700/50";
      case "ERROR": return "bg-red-900/50 text-red-400 border-red-700/50";
      case "WARN": return "bg-yellow-900/50 text-yellow-400 border-yellow-700/50";
      case "SYSTEM": return "bg-cyan-900/50 text-cyan-400 border-cyan-700/50";
      default: return "bg-slate-800 text-slate-400 border-slate-600";
    }
  };

  return (
    <Card className="border border-slate-700 bg-slate-950 shadow-xl" data-testid="server-terminal">
      <CardHeader className="border-b border-slate-800 bg-slate-900 py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green-400" />
            SWIFT Server Console — HSBC Germany MX Gateway
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-mono">ONLINE</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={termRef}
          className="font-mono text-xs leading-relaxed p-4 max-h-[400px] overflow-y-auto"
          style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
        >
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading server logs...
            </div>
          ) : (
            (logs || []).map((log, i) => (
              <div key={i} className="flex gap-2 py-0.5 hover:bg-slate-900/50">
                <span className="text-slate-600 shrink-0 w-[180px]">
                  {log.ts ? new Date(log.ts).toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : ""}
                </span>
                <span className={`shrink-0 w-[52px] text-center font-bold ${levelColor(log.level)}`}>
                  [{log.level}]
                </span>
                <span className={levelColor(log.level)}>{log.msg}</span>
              </div>
            ))
          )}
          <div className="text-green-400 mt-2 animate-pulse">_</div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============ ADD ACCOUNT FORM ============
const AddAccountForm = ({ onCreated, onClose }) => {
  const [form, setForm] = useState({
    account_type: "company",
    company_name: "",
    company_address: "",
    registration_nr: "",
    rep_name: "",
    rep_passport: "",
    rep_passport_country: "",
    rep_passport_issue: "",
    rep_passport_expiry: "",
    rep_title: "",
    bank_name: "HSBC Continental Europe, Germany",
    bank_address: "Hansaallee 3, 40549 Dusseldorf, Germany",
    account_name: "",
    account_no: "",
    iban: "",
    swift_code: "TUBDDEDD",
    balance_eur: "",
    balance_usd: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name || !form.iban || !form.account_name) {
      toast.error("Company name, account name, and IBAN are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        account_type: form.account_type,
        company_name: form.company_name,
        company_address: form.company_address || null,
        registration_nr: form.registration_nr || null,
        representative: {
          name: form.rep_name || form.company_name,
          title_position: form.rep_title || null,
          passport_no: form.rep_passport || "N/A",
          passport_issue_country: form.rep_passport_country || null,
          passport_issue_date: form.rep_passport_issue || null,
          passport_expiry_date: form.rep_passport_expiry || null,
        },
        bank_name: form.bank_name,
        bank_address: form.bank_address,
        account_name: form.account_name,
        account_no: form.account_no || null,
        iban: form.iban,
        swift_code: form.swift_code,
        balance_eur: parseFloat(form.balance_eur) || 0,
        balance_usd: parseFloat(form.balance_usd) || 0,
      };
      await axios.post(`${API}/accounts`, payload);
      toast.success("Account created successfully");
      onCreated();
      onClose();
    } catch (err) {
      toast.error("Failed to create account");
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = "bg-white border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#DB0011] focus:border-[#DB0011]";
  const labelClass = "text-xs font-medium text-gray-600 uppercase tracking-wider mb-1 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1" data-testid="add-account-form">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Account Type</label>
          <select value={form.account_type} onChange={(e) => set("account_type", e.target.value)} className={fieldClass} data-testid="account-type-select">
            <option value="company">Company</option>
            <option value="individual">Individual</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Company / Individual Name *</label>
          <input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} className={fieldClass} required data-testid="company-name-input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Address</label>
          <input value={form.company_address} onChange={(e) => set("company_address", e.target.value)} className={fieldClass} data-testid="company-address-input" />
        </div>
        <div>
          <label className={labelClass}>Registration Nr.</label>
          <input value={form.registration_nr} onChange={(e) => set("registration_nr", e.target.value)} className={fieldClass} data-testid="registration-nr-input" />
        </div>
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Representative / Signatory</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Full Name</label>
            <input value={form.rep_name} onChange={(e) => set("rep_name", e.target.value)} className={fieldClass} data-testid="rep-name-input" />
          </div>
          <div>
            <label className={labelClass}>Title / Position</label>
            <input value={form.rep_title} onChange={(e) => set("rep_title", e.target.value)} className={fieldClass} data-testid="rep-title-input" />
          </div>
          <div>
            <label className={labelClass}>Passport No.</label>
            <input value={form.rep_passport} onChange={(e) => set("rep_passport", e.target.value)} className={fieldClass} data-testid="rep-passport-input" />
          </div>
          <div>
            <label className={labelClass}>Passport Country</label>
            <input value={form.rep_passport_country} onChange={(e) => set("rep_passport_country", e.target.value)} className={fieldClass} data-testid="rep-passport-country-input" />
          </div>
          <div>
            <label className={labelClass}>Issue Date</label>
            <input value={form.rep_passport_issue} onChange={(e) => set("rep_passport_issue", e.target.value)} className={fieldClass} data-testid="rep-passport-issue-input" />
          </div>
          <div>
            <label className={labelClass}>Expiry Date</label>
            <input value={form.rep_passport_expiry} onChange={(e) => set("rep_passport_expiry", e.target.value)} className={fieldClass} data-testid="rep-passport-expiry-input" />
          </div>
        </div>
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bank & Account Details</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Bank Name</label>
            <input value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} className={fieldClass} data-testid="bank-name-input" />
          </div>
          <div>
            <label className={labelClass}>Bank Address</label>
            <input value={form.bank_address} onChange={(e) => set("bank_address", e.target.value)} className={fieldClass} data-testid="bank-address-input" />
          </div>
          <div>
            <label className={labelClass}>Account Name *</label>
            <input value={form.account_name} onChange={(e) => set("account_name", e.target.value)} className={fieldClass} required data-testid="account-name-input" />
          </div>
          <div>
            <label className={labelClass}>Account No.</label>
            <input value={form.account_no} onChange={(e) => set("account_no", e.target.value)} className={fieldClass} data-testid="account-no-input" />
          </div>
          <div>
            <label className={labelClass}>IBAN *</label>
            <input value={form.iban} onChange={(e) => set("iban", e.target.value)} className={fieldClass} required data-testid="iban-input" />
          </div>
          <div>
            <label className={labelClass}>SWIFT / BIC Code</label>
            <input value={form.swift_code} onChange={(e) => set("swift_code", e.target.value)} className={fieldClass} data-testid="swift-code-input" />
          </div>
        </div>
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Initial Balance</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Balance EUR</label>
            <input type="number" step="0.01" value={form.balance_eur} onChange={(e) => set("balance_eur", e.target.value)} className={fieldClass} data-testid="balance-eur-input" />
          </div>
          <div>
            <label className={labelClass}>Balance USD</label>
            <input type="number" step="0.01" value={form.balance_usd} onChange={(e) => set("balance_usd", e.target.value)} className={fieldClass} data-testid="balance-usd-input" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-add-account">Cancel</Button>
        <Button type="submit" className="bg-[#DB0011] hover:bg-[#B3000E]" disabled={saving} data-testid="submit-add-account">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Account
        </Button>
      </div>
    </form>
  );
};

// ============ ACCOUNT BALANCE DASHBOARD ============
const AccountBalanceDashboard = ({ account }) => {
  const eurBal = account.balance_eur || 0;
  const usdBal = account.balance_usd || 0;
  const totalEur = eurBal + (usdBal / 1.08);
  const eurPct = totalEur > 0 ? (eurBal / totalEur) * 100 : 0;
  const usdPct = totalEur > 0 ? ((usdBal / 1.08) / totalEur) * 100 : 0;

  const fmt = (val, cur) =>
    new Intl.NumberFormat(cur === "EUR" ? "de-DE" : "en-US", {
      style: "currency", currency: cur, minimumFractionDigits: 2,
    }).format(val);

  return (
    <div className="mb-4" data-testid={`account-balance-dashboard-${account.id}`}>
      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-4 border border-blue-700/40">
          <div className="flex items-center gap-2 mb-2">
            <Euro className="w-4 h-4 text-blue-300" />
            <span className="text-[10px] text-blue-300 uppercase tracking-widest font-semibold">EUR Balance</span>
          </div>
          <p className="text-lg font-bold text-white font-mono leading-tight">{fmt(eurBal, "EUR")}</p>
          <div className="mt-2 h-1.5 bg-blue-950 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${eurPct}%` }} />
          </div>
          <p className="text-[10px] text-blue-400 mt-1">{eurPct.toFixed(1)}% of total</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-lg p-4 border border-emerald-700/40">
          <div className="flex items-center gap-2 mb-2">
            <CircleDollarSign className="w-4 h-4 text-emerald-300" />
            <span className="text-[10px] text-emerald-300 uppercase tracking-widest font-semibold">USD Balance</span>
          </div>
          <p className="text-lg font-bold text-white font-mono leading-tight">{fmt(usdBal, "USD")}</p>
          <div className="mt-2 h-1.5 bg-emerald-950 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${usdPct}%` }} />
          </div>
          <p className="text-[10px] text-emerald-400 mt-1">{usdPct.toFixed(1)}% of total</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 border border-[#DB0011]/30">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-[#DB0011]" />
            <span className="text-[10px] text-slate-300 uppercase tracking-widest font-semibold">Total (EUR equiv.)</span>
          </div>
          <p className="text-lg font-bold text-white font-mono leading-tight">{fmt(totalEur, "EUR")}</p>
          <div className="mt-2 flex gap-1 h-1.5">
            <div className="bg-blue-400 rounded-full" style={{ width: `${eurPct}%` }} />
            <div className="bg-emerald-400 rounded-full" style={{ width: `${usdPct}%` }} />
          </div>
          <div className="flex gap-3 mt-1">
            <span className="text-[10px] text-blue-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />EUR</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />USD</span>
          </div>
        </div>
      </div>

      {/* Account Quick Info Bar */}
      <div className="flex items-center gap-4 text-[10px] text-gray-500 bg-gray-100 rounded px-3 py-2">
        <span><strong className="text-gray-700">IBAN:</strong> <span className="font-mono">{account.iban}</span></span>
        <span className="text-gray-300">|</span>
        <span><strong className="text-gray-700">SWIFT:</strong> <span className="font-mono">{account.swift_code}</span></span>
        {account.account_no && <><span className="text-gray-300">|</span><span><strong className="text-gray-700">Acct#:</strong> <span className="font-mono">{account.account_no}</span></span></>}
        <span className="text-gray-300">|</span>
        <span><strong className="text-gray-700">Bank:</strong> {account.bank_name}</span>
      </div>
    </div>
  );
};

// ============ ACCOUNT ROW ============
const AccountRow = ({ account, onDelete, expanded, onToggle }) => {
  const rep = account.representative || {};
  const officer = account.bank_officer || {};

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden" data-testid={`account-row-${account.id}`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${account.account_type === "individual" ? "bg-purple-50" : "bg-blue-50"}`}>
            {account.account_type === "individual" ? (
              <UserCircle className="w-5 h-5 text-purple-600" />
            ) : (
              <Building2 className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{account.company_name}</p>
            <p className="text-xs text-gray-500">{account.iban}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-mono font-medium text-gray-900">
              {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(account.balance_eur || 0)}
            </p>
            <p className="text-xs font-mono text-gray-500">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(account.balance_usd || 0)}
            </p>
          </div>
          <Badge variant="outline" className={account.status === "ACTIVE" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}>
            {account.status || "ACTIVE"}
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-5 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Company Info */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700 uppercase tracking-wider text-[11px] border-b border-gray-200 pb-1">Company / Client Info</h4>
              <div><span className="text-gray-500">Type:</span> <span className="text-gray-900 font-medium">{account.account_type === "individual" ? "Individual" : "Company"}</span></div>
              {account.company_address && <div><span className="text-gray-500">Address:</span> <span className="text-gray-900">{account.company_address}</span></div>}
              {account.registration_nr && <div><span className="text-gray-500">Reg. Nr:</span> <span className="text-gray-900 font-mono">{account.registration_nr}</span></div>}
              {account.place_of_incorporation && <div><span className="text-gray-500">Incorporated:</span> <span className="text-gray-900">{account.place_of_incorporation}</span></div>}
              {account.date_established && <div><span className="text-gray-500">Established:</span> <span className="text-gray-900">{account.date_established}</span></div>}
            </div>

            {/* Representative */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700 uppercase tracking-wider text-[11px] border-b border-gray-200 pb-1">Representative / Signatory</h4>
              <div><span className="text-gray-500">Name:</span> <span className="text-gray-900 font-medium">{rep.name}</span></div>
              {rep.title_position && <div><span className="text-gray-500">Position:</span> <span className="text-gray-900">{rep.title_position}</span></div>}
              <div><span className="text-gray-500">Passport:</span> <span className="text-gray-900 font-mono">{rep.passport_no}</span></div>
              {(rep.passport_issue_place || rep.passport_issue_country) && (
                <div><span className="text-gray-500">Issue Place:</span> <span className="text-gray-900">{rep.passport_issue_place || rep.passport_issue_country}</span></div>
              )}
              {rep.passport_issue_date && <div><span className="text-gray-500">Issued:</span> <span className="text-gray-900">{rep.passport_issue_date}</span></div>}
              {rep.passport_expiry_date && <div><span className="text-gray-500">Expires:</span> <span className="text-gray-900">{rep.passport_expiry_date}</span></div>}
              {rep.place_of_birth && <div><span className="text-gray-500">Birth Place:</span> <span className="text-gray-900">{rep.place_of_birth}</span></div>}
            </div>

            {/* Bank Details */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700 uppercase tracking-wider text-[11px] border-b border-gray-200 pb-1">Bank & Account Details</h4>
              <div><span className="text-gray-500">Bank:</span> <span className="text-gray-900 font-medium">{account.bank_name}</span></div>
              <div><span className="text-gray-500">Address:</span> <span className="text-gray-900">{account.bank_address}</span></div>
              <div><span className="text-gray-500">Account Name:</span> <span className="text-gray-900">{account.account_name}</span></div>
              {account.account_no && <div><span className="text-gray-500">Account No:</span> <span className="text-gray-900 font-mono">{account.account_no}</span></div>}
              <div><span className="text-gray-500">IBAN:</span> <span className="text-gray-900 font-mono">{account.iban}</span></div>
              <div><span className="text-gray-500">SWIFT:</span> <span className="text-gray-900 font-mono">{account.swift_code}</span></div>
              {account.gpi_code && <div><span className="text-gray-500">GPI Code:</span> <span className="text-gray-900 font-mono">{account.gpi_code}</span></div>}
              {account.further_credit && <div><span className="text-gray-500">For Credit To:</span> <span className="text-gray-900">{account.further_credit}</span></div>}
              {account.reference && <div><span className="text-gray-500">Reference:</span> <span className="text-gray-900">{account.reference}</span></div>}
              {officer.name && officer.name !== "TBA" && (
                <>
                  <div className="border-t border-gray-200 pt-1 mt-1"><span className="text-gray-500">Bank Officer:</span> <span className="text-gray-900">{officer.name}</span></div>
                  {officer.tel && <div><span className="text-gray-500">Tel:</span> <span className="text-gray-900">{officer.tel}</span></div>}
                  {officer.email && <div><span className="text-gray-500">Email:</span> <span className="text-gray-900">{officer.email}</span></div>}
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-3 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 border-red-200"
              onClick={(e) => { e.stopPropagation(); onDelete(account.id); }}
              data-testid={`delete-account-${account.id}`}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Remove Account
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ MAIN PAGE ============
export default function AdminPanel() {
  const [accounts, setAccounts] = useState([]);
  const [balance, setBalance] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accRes, balRes] = await Promise.all([
        axios.get(`${API}/accounts`),
        axios.get(`${API}/accounts-balance`),
      ]);
      setAccounts(accRes.data);
      setBalance(balRes.data);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await axios.get(`${API}/server-terminal`);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this account?")) return;
    try {
      await axios.delete(`${API}/accounts/${id}`);
      toast.success("Account removed");
      fetchData();
    } catch {
      toast.error("Failed to remove account");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#DB0011]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="admin-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">
            HSBC Continental Europe S.A., Germany &mdash; SWIFT/BIC: TUBDDEDDXXX
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Globe className="w-4 h-4" />
          <span>Hansallee 3, 40549 Dusseldorf</span>
          <span className="text-gray-300">|</span>
          <span>Branches: Dusseldorf, Berlin, Frankfurt, Munich, Dortmund</span>
        </div>
      </div>

      {/* Balance Cards */}
      <BalanceSection balance={balance} />

      {/* Accounts Section */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#DB0011]" />
            Registered Accounts ({accounts.length})
          </CardTitle>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button className="bg-[#DB0011] hover:bg-[#B3000E]" size="sm" data-testid="add-account-button">
                <PlusCircle className="w-4 h-4 mr-2" /> Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
              </DialogHeader>
              <AddAccountForm onCreated={fetchData} onClose={() => setShowAdd(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {accounts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No accounts found. Seed data or add a new account.
            </div>
          ) : (
            accounts.map((acc) => (
              <AccountRow
                key={acc.id}
                account={acc}
                expanded={expandedId === acc.id}
                onToggle={() => setExpandedId(expandedId === acc.id ? null : acc.id)}
                onDelete={handleDelete}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Server Terminal */}
      <ServerTerminal logs={logs} loading={logsLoading} />
    </div>
  );
}
