"use client";

interface SearchAndSortProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  searchPlaceholder?: string;
  statusOptions?: { value: string; label: string }[];
  sortOptions?: { value: string; label: string }[];
  showDateFilter?: boolean;
  totalCount?: number;
  title?: string;
}

const defaultStatusOptions = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "ongoing", label: "Ongoing" },
  { value: "for_mediation", label: "For Mediation" },
  { value: "for_conciliation", label: "For Conciliation" },
  { value: "for_arbitration", label: "For Arbitration" },
  { value: "settled", label: "Settled" },
  { value: "resolved", label: "Resolved" },
  { value: "withdrawn", label: "Withdrawn" },
];

const defaultSortOptions = [
  { value: "date_desc", label: "Date Filed (Newest)" },
  { value: "date_asc", label: "Date Filed (Oldest)" },
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "title_desc", label: "Title (Z-A)" },
  { value: "status", label: "Status" },
];

export default function SearchAndSort({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  sortBy,
  setSortBy,
  searchPlaceholder = "Search by case title, complainant, or respondent...",
  statusOptions = defaultStatusOptions,
  sortOptions = defaultSortOptions,
  showDateFilter = true
}: SearchAndSortProps) {
  
  const hasActiveFilters = searchQuery || statusFilter !== "all" || dateFilter !== "all" || sortBy !== "date_desc";
  const activeFilterCount = [searchQuery, statusFilter !== "all", dateFilter !== "all", sortBy !== "date_desc"].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("all");
    setSortBy("date_desc");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      {/* Main Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search Input - Takes up more space */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Compact Filters */}
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[120px] transition-colors"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          {showDateFilter && (
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[110px] transition-colors"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          )}

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[130px] transition-colors"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Status and Clear Button */}
      {hasActiveFilters && (
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </span>
          </div>
          
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
