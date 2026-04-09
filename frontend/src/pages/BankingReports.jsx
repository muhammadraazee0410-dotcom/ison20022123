import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import {
  Loader2, Download, TrendingUp, Shield, DollarSign, Activity,
  CheckCircle2, AlertTriangle, BarChart3, Globe, FileText, Printer,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ["#DB0011", "#1a3c6e", "#008A00", "#FFB600", "#6366f1", "#ec4899", "#14b8a6", "#f97316"];

const formatAmount = (a) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(a);
const formatCompact = (a) => {
  if (a >= 1e12) return `${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${(a / 1e3).toFixed(1)}K`;
  return a.toFixed(2);
};

// Barcode Component
const Barcode = ({ value }) => {
  const bars = value.split('').map((c) => {
    const code = c.charCodeAt(0);
    return [(code % 4) + 1, ((code * 2) % 3) + 1, ((code * 3) % 4) + 1];
  }).flat();
  return (
    <div className="flex justify-center items-center py-2">
      <div className="flex h-8">
        {bars.slice(0, 60).map((w, i) => (
          <div key={i} className={`h-8 ${i % 2 === 0 ? 'bg-black' : 'bg-white'}`} style={{ width: `${w}px` }} />
        ))}
      </div>
    </div>
  );
};

export default function BankingReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/analytics/reports`);
        setData(res.data);
      } catch (e) {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePrint = () => {
    const fixedElements = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
    const hidden = [];
    fixedElements.forEach(el => {
      if (el.style.display !== 'none') {
        hidden.push({ el, prev: el.style.display });
        el.style.display = 'none';
      }
    });
    window.print();
    hidden.forEach(({ el, prev }) => { el.style.display = prev; });
  };

  const handleExportPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      if (!element) return;
      await html2pdf().set({
        margin: [8, 8, 8, 8],
        filename: `Banking_Report_${data?.report_id || 'RPT'}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }).from(element).save();
      toast.success("Report exported as PDF");
    } catch (e) {
      toast.error("PDF export failed");
    }
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-[#DB0011]" /></div>;
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-500">No analytics data available</div>;
  }

  const { summary, currency_distribution, monthly_volume, nostro_positions, settlement_methods, compliance, top_counterparties, daily_settlement } = data;

  const statusPieData = [
    { name: "Successful", value: summary.successful, color: "#008A00" },
    { name: "Pending", value: summary.pending, color: "#FFB600" },
    { name: "Failed", value: summary.failed, color: "#D90000" },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6" data-testid="banking-reports">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <img src="/iso-logo.png" alt="ISO 20022" className="w-14 h-14 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced Banking Reports</h1>
            <p className="text-sm text-gray-500">ISO 20022 | SWIFT Transfer Platform Analytics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="border-gray-300" data-testid="print-report-btn">
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          <Button onClick={handleExportPDF} className="bg-[#DB0011] hover:bg-[#B3000E]" data-testid="export-report-pdf-btn">
            <Download className="w-4 h-4 mr-2" />Export PDF
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        {/* Report ID and Barcode */}
        <div className="bg-white border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/iso-logo.png" alt="ISO 20022" className="w-12 h-12 object-contain" />
            <div>
              <div className="font-bold text-gray-900">REPORT ID: {data.report_id}</div>
              <div className="text-xs text-gray-500">Generated: {new Date(data.report_generated).toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Barcode value={data.report_id} />
            <div className="bg-white p-1 border border-gray-300">
              <QRCodeSVG value={`REPORT:${data.report_id}`} size={60} level="H" bgColor="#FFFFFF" fgColor="#000000" />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Transactions</p>
                  <p className="text-2xl font-bold">{summary.total_transactions}</p>
                </div>
                <Activity className="w-8 h-8 text-[#DB0011]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Volume</p>
                  <p className="text-2xl font-bold">{formatCompact(summary.total_volume)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-[#1a3c6e]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Success Rate</p>
                  <p className="text-2xl font-bold text-green-700">{((summary.successful / Math.max(summary.total_transactions, 1)) * 100).toFixed(1)}%</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Avg Transaction</p>
                  <p className="text-2xl font-bold">{formatCompact(summary.avg_transaction)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#FFB600]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Volume Chart + Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#DB0011]" />
                Monthly Transaction Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthly_volume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompact(v)} />
                  <Tooltip formatter={(v) => formatAmount(v)} />
                  <Area type="monotone" dataKey="volume" stroke="#DB0011" fill="#DB001120" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Settlement Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {statusPieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                    </div>
                    <span className="font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Settlement + Currency Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1a3c6e]" />
                Daily Settlement Flow (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={daily_settlement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} />
                  <Tooltip formatter={(v) => formatAmount(v)} />
                  <Bar dataKey="volume" fill="#1a3c6e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#DB0011]" />
                Currency Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={currency_distribution} cx="50%" cy="50%" outerRadius={80} dataKey="volume" nameKey="currency" label={({ currency, percent }) => `${currency} ${(percent * 100).toFixed(0)}%`}>
                    {currency_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatAmount(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {currency_distribution.map((d, i) => (
                  <div key={d.currency} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-bold">{d.currency}</span>
                    </div>
                    <span>{d.count} txns | {formatCompact(d.volume)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nostro/Vostro Positions */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#DB0011]" />
                Nostro / Vostro Position Summary
              </CardTitle>
              <div className="flex items-center gap-2">
                <Barcode value="NOSTRO-POS-RPT" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" data-testid="nostro-table">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-50">
                    <th className="text-left p-2 font-semibold">Institution</th>
                    <th className="text-left p-2 font-semibold">BIC</th>
                    <th className="text-right p-2 font-semibold">EUR Balance</th>
                    <th className="text-right p-2 font-semibold">USD Balance</th>
                    <th className="text-center p-2 font-semibold">Status</th>
                    <th className="text-center p-2 font-semibold">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {nostro_positions.map((pos, i) => (
                    <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-2 font-medium">{pos.bank}</td>
                      <td className="p-2 font-mono text-gray-600">{pos.bic}</td>
                      <td className="p-2 text-right font-mono">{formatAmount(pos.eur_balance)}</td>
                      <td className="p-2 text-right font-mono">{formatAmount(pos.usd_balance)}</td>
                      <td className="p-2 text-center">
                        <Badge className="bg-green-100 text-green-800 text-xs">{pos.status}</Badge>
                      </td>
                      <td className="p-2 text-center">
                        <div className="inline-block bg-white p-1 border border-gray-200">
                          <QRCodeSVG value={`NOSTRO:${pos.bic}:${pos.eur_balance}`} size={30} level="L" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Counterparties + Compliance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1a3c6e]" />
                Top Counterparties by Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {top_counterparties.map((cp, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border border-gray-100 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                      <span className="text-xs font-medium">{cp.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-500">{cp.count} txns</span>
                      <span className="font-bold font-mono">{formatCompact(cp.volume)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  Compliance & AML Screening
                </CardTitle>
                <div className="bg-white p-1 border border-gray-200">
                  <QRCodeSVG value={`COMPLIANCE:${data.report_id}`} size={40} level="L" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  ["Total Screened", compliance.total_screened, "text-gray-900"],
                  ["Sanctions Cleared", compliance.sanctions_cleared, "text-green-700"],
                  ["AML/CFT Passed", compliance.aml_passed, "text-green-700"],
                  ["KYC Verified", compliance.kyc_verified, "text-green-700"],
                  ["PEP Cleared", compliance.pep_cleared, "text-green-700"],
                  ["OFAC Cleared", compliance.ofac_cleared, "text-green-700"],
                  ["EU Sanctions Cleared", compliance.eu_sanctions_cleared, "text-green-700"],
                  ["False Positives", compliance.false_positives, "text-yellow-600"],
                ].map(([label, value, color]) => (
                  <div key={label} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded">
                    <span className="text-xs">{label}</span>
                    <span className={`text-xs font-bold ${color}`}>{value}</span>
                  </div>
                ))}
                <div className="bg-green-50 border border-green-200 p-3 text-center rounded mt-3">
                  <div className="text-green-800 font-bold text-sm">COMPLIANCE RATE: {compliance.compliance_rate}%</div>
                  <div className="text-green-600 text-xs mt-1">All transactions fully compliant</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settlement Methods Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#DB0011]" />
                Settlement Method Distribution
              </CardTitle>
              <Barcode value="SETTLE-METHOD-RPT" />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={settlement_methods} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="method" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#DB0011" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Transaction Trend with Barcode */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1a3c6e]" />
                Monthly Transaction Count & Success Rate
              </CardTitle>
              <div className="bg-white p-1 border border-gray-200">
                <QRCodeSVG value={`MONTHLY-TREND:${data.report_id}`} size={40} level="L" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthly_volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="successful" fill="#008A00" name="Successful" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" fill="#D90000" name="Failed" stackId="a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Report Footer with Barcode and QR */}
        <div className="bg-white border border-gray-200 p-4 text-center">
          <div className="flex items-center justify-between mb-3">
            <img src="/iso-logo.png" alt="ISO 20022" className="w-12 h-12 object-contain" />
            <div>
              <div className="font-bold text-xs text-gray-700">END OF ADVANCED BANKING REPORT</div>
              <div className="text-xs text-gray-500">Report ID: {data.report_id} | CONFIDENTIAL</div>
            </div>
            <div className="bg-white p-1 border border-gray-200">
              <QRCodeSVG value={`REPORT-END:${data.report_id}`} size={50} level="H" />
            </div>
          </div>
          <Barcode value={`END-RPT-${data.report_id}`} />
          <div className="text-xs text-gray-400 mt-2">SWIFT Alliance Access System v2.5.4 | ISO 20022 SWIFT Transfer Platform</div>
        </div>
      </div>
    </div>
  );
}
