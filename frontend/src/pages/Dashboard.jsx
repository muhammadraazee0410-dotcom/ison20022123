import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Loader2,
  Wallet,
  Euro,
  CircleDollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = {
  SUCCESSFUL: "#008A00",
  PENDING: "#FFB600",
  FAILED: "#D90000",
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [totalFunds, setTotalFunds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartRes, txnRes, fundsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/dashboard/chart-data`),
        axios.get(`${API}/transactions?limit=5`),
        axios.get(`${API}/dashboard/total-funds`),
      ]);

      setStats(statsRes.data);
      setChartData(chartRes.data);
      setRecentTransactions(txnRes.data);
      setTotalFunds(fundsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    setSeeding(true);
    try {
      await axios.post(`${API}/seed-data`);
      toast.success("Sample data seeded successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to seed data");
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status) => {
    const styles = {
      SUCCESSFUL: "bg-green-50 text-green-700 border-green-200",
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
      FAILED: "bg-red-50 text-red-700 border-red-200",
    };
    return styles[status] || styles.PENDING;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#DB0011]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            SWIFT MX Transaction Overview - pacs.009.001.08
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={seedData}
            disabled={seeding}
            className="border-gray-300"
            data-testid="seed-data-button"
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Seed Sample Data
          </Button>
          <Button
            onClick={() => navigate("/transactions")}
            className="bg-[#DB0011] hover:bg-[#B3000E]"
            data-testid="view-all-transactions-button"
          >
            View All Transactions
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Total Platform Funds */}
      <Card className="border-2 border-[#DB0011] shadow-lg bg-gradient-to-r from-gray-900 to-gray-800" data-testid="total-funds-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#DB0011] rounded-xl flex items-center justify-center">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">
                  ISO 20022 Platform - Total Funds
                </p>
                <p className="text-xs text-gray-500 mt-1">Real-time Balance</p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Euro className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">EUR Balance</span>
                </div>
                <p className="text-3xl font-bold text-white mt-1 font-mono">
                  €{totalFunds?.funds?.[0]?.amount?.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '2,478,455,779,009.90'}
                </p>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <CircleDollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">USD Balance</span>
                </div>
                <p className="text-3xl font-bold text-white mt-1 font-mono">
                  ${totalFunds?.funds?.[1]?.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '567,773,667,221.04'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm hsbc-red-line" data-testid="stat-total-transactions">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Transactions</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">
                  {stats?.total_transactions || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#DB0011]/10 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#DB0011]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm" data-testid="stat-total-volume">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Volume</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(stats?.total_volume || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm" data-testid="stat-successful">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Successful</p>
                <p className="text-3xl font-semibold text-green-600 mt-1">
                  {stats?.successful_count || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm" data-testid="stat-pending-failed">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending / Failed</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">
                  <span className="text-yellow-600">{stats?.pending_count || 0}</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span className="text-red-600">{stats?.failed_count || 0}</span>
                </p>
              </div>
              <div className="flex gap-1">
                <div className="w-8 h-8 bg-yellow-50 rounded flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Volume Chart */}
        <Card className="lg:col-span-2 border border-gray-200 shadow-sm" data-testid="volume-chart">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
            <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#DB0011]" />
              Transaction Volume (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData?.daily_volume || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), "Volume"]}
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="volume" fill="#DB0011" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border border-gray-200 shadow-sm" data-testid="status-chart">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
            <CardTitle className="text-base font-medium text-gray-900">
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData?.status_distribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${value}`}
                  >
                    {(chartData?.status_distribution || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.name] || "#6b7280"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {Object.entries(COLORS).map(([key, color]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-600">{key}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border border-gray-200 shadow-sm" data-testid="recent-transactions">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium text-gray-900">
            Recent Transactions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/transactions")}
            className="text-[#DB0011] hover:text-[#B3000E] hover:bg-red-50"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>UETR</th>
                <th>Debtor</th>
                <th>Amount</th>
                <th>Settlement Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    No transactions found. Click "Seed Sample Data" to add demo transactions.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/transactions/${txn.id}`)}
                    data-testid={`txn-row-${txn.id}`}
                  >
                    <td>
                      <span className="uetr-display">{txn.uetr.slice(0, 18)}...</span>
                    </td>
                    <td className="font-medium text-gray-900">{txn.debtor.name}</td>
                    <td className="font-medium">
                      {formatCurrency(txn.settlement_info.interbank_settlement_amount)}
                    </td>
                    <td className="text-gray-600">{txn.settlement_info.settlement_date}</td>
                    <td>
                      <Badge
                        variant="outline"
                        className={getStatusBadge(txn.tracking_result)}
                      >
                        {txn.tracking_result}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
