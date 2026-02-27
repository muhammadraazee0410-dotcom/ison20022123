import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Download,
  Loader2,
  RefreshCw,
  Building2,
  PlusCircle,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const navigate = useNavigate();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await axios.get(`${API}/transactions?${params.toString()}`);
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== "") {
        fetchTransactions();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getStatusBadge = (status) => {
    const styles = {
      SUCCESSFUL: "bg-green-50 text-green-700 border-green-200",
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
      FAILED: "bg-red-50 text-red-700 border-red-200",
    };
    return styles[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getPriorityBadge = (priority) => {
    return priority === "HIGH"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-gray-50 text-gray-600 border-gray-200";
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aVal, bVal;
    
    if (sortField === "amount") {
      aVal = a.settlement_info.interbank_settlement_amount;
      bVal = b.settlement_info.interbank_settlement_amount;
    } else if (sortField === "date") {
      aVal = a.settlement_info.settlement_date;
      bVal = b.settlement_info.settlement_date;
    } else {
      aVal = a.created_at;
      bVal = b.created_at;
    }

    if (sortDir === "asc") {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  return (
    <div className="p-6 space-y-6" data-testid="transactions-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">
            SWIFT MX pacs.009.001.08 - Financial Institution Credit Transfers
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchTransactions}
            className="border-gray-300"
            data-testid="refresh-button"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => navigate("/transactions/new")}
            className="bg-[#DB0011] hover:bg-[#B3000E]"
            data-testid="new-transaction-button"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by UETR, debtor, creditor, or BIC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300"
                data-testid="search-input"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] border-gray-300" data-testid="status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger className="w-[140px] border-gray-300" data-testid="sort-field">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="date">Settlement Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                className="border-gray-300"
                data-testid="sort-direction"
              >
                {sortDir === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border border-gray-200 shadow-sm" data-testid="transactions-table">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#DB0011]" />
            </div>
          ) : sortedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your filters or seed sample data from the dashboard
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>UETR</th>
                    <th>Message Type</th>
                    <th>Instructing Agent</th>
                    <th>Debtor</th>
                    <th>Amount</th>
                    <th>Settlement Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((txn, index) => (
                    <tr
                      key={txn.id}
                      className="cursor-pointer hover:bg-gray-50/80 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                      onClick={() => navigate(`/transactions/${txn.id}`)}
                      data-testid={`transaction-row-${txn.id}`}
                    >
                      <td>
                        <span className="uetr-display font-mono text-xs">
                          {txn.uetr.slice(0, 8)}...
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {txn.message_type}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {txn.instructing_agent.bic}
                          </p>
                          <p className="text-xs text-gray-500">
                            {txn.instructing_agent.name.slice(0, 20)}...
                          </p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {txn.debtor.name.slice(0, 20)}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {txn.debtor.iban.slice(0, 12)}...
                          </p>
                        </div>
                      </td>
                      <td className="font-semibold text-gray-900">
                        {formatCurrency(txn.settlement_info.interbank_settlement_amount)}
                      </td>
                      <td className="text-gray-600">
                        {txn.settlement_info.settlement_date}
                      </td>
                      <td>
                        <Badge
                          variant="outline"
                          className={getPriorityBadge(txn.settlement_info.priority)}
                        >
                          {txn.settlement_info.priority}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          variant="outline"
                          className={getStatusBadge(txn.tracking_result)}
                        >
                          {txn.tracking_result}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#DB0011] hover:text-[#B3000E] hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/transactions/${txn.id}`);
                          }}
                          data-testid={`view-txn-${txn.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Count */}
      {!loading && sortedTransactions.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {sortedTransactions.length} transaction(s)
        </div>
      )}
    </div>
  );
}
