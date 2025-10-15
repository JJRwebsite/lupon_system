// Utility functions for filtering and sorting data

export interface FilterOptions {
  searchQuery: string;
  statusFilter: string;
  dateFilter: string;
  sortBy: string;
}

export function applyFiltersAndSort<T extends Record<string, any>>(
  data: T[],
  options: FilterOptions,
  searchFields: (keyof T)[],
  dateField: keyof T = 'date_filed' as keyof T
): T[] {
  let result = [...data];

  // Apply search filter
  if (options.searchQuery) {
    result = result.filter((item) => {
      return searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(options.searchQuery.toLowerCase());
        }
        if (Array.isArray(value)) {
          return value.some((v: any) => {
            if (typeof v === 'string') {
              return v.toLowerCase().includes(options.searchQuery.toLowerCase());
            }
            if (v && typeof v === 'object' && v.name) {
              return v.name.toLowerCase().includes(options.searchQuery.toLowerCase());
            }
            return false;
          });
        }
        if (value && typeof value === 'object' && value.name) {
          return value.name.toLowerCase().includes(options.searchQuery.toLowerCase());
        }
        return false;
      });
    });
  }

  // Apply status filter
  if (options.statusFilter !== "all") {
    result = result.filter((item) => {
      const itemStatus = item.status?.toLowerCase() || '';
      const filterStatus = options.statusFilter.toLowerCase();
      
      // Handle different status format variations
      switch (filterStatus) {
        case 'mediation':
          return itemStatus.includes('mediation') || itemStatus === 'for_mediation';
        case 'conciliation':
          return itemStatus.includes('conciliation') || itemStatus === 'for_conciliation';
        case 'arbitration':
          return itemStatus.includes('arbitration') || itemStatus === 'for_arbitration';
        case 'settled':
          return itemStatus === 'settled';
        case 'withdrawn':
          return itemStatus === 'withdrawn';
        default:
          return itemStatus === filterStatus;
      }
    });
  }

  // Apply date filter
  if (options.dateFilter !== "all") {
    const now = new Date();
    const filterDate = new Date(now);
    
    switch (options.dateFilter) {
      case "today":
        filterDate.setHours(0, 0, 0, 0);
        result = result.filter((item) => {
          const itemDate = new Date(item[dateField] || '');
          return itemDate >= filterDate;
        });
        break;
      case "week":
        filterDate.setDate(now.getDate() - 7);
        result = result.filter((item) => {
          const itemDate = new Date(item[dateField] || '');
          return itemDate >= filterDate;
        });
        break;
      case "month":
        filterDate.setMonth(now.getMonth() - 1);
        result = result.filter((item) => {
          const itemDate = new Date(item[dateField] || '');
          return itemDate >= filterDate;
        });
        break;
    }
  }
  
  // Apply sorting
  switch (options.sortBy) {
    case "date_desc":
      result.sort((a, b) => new Date(b[dateField] || '').getTime() - new Date(a[dateField] || '').getTime());
      break;
    case "date_asc":
      result.sort((a, b) => new Date(a[dateField] || '').getTime() - new Date(b[dateField] || '').getTime());
      break;
    case "title_asc":
      result.sort((a, b) => (a.case_title || '').localeCompare(b.case_title || ''));
      break;
    case "title_desc":
      result.sort((a, b) => (b.case_title || '').localeCompare(a.case_title || ''));
      break;
    case "status":
      result.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
      break;
    default:
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
  }
  
  return result;
}

// Status options for different page types
export const complaintStatusOptions = [
  { value: "all", label: "All Status" },
  { value: "mediation", label: "Mediation" },
  { value: "conciliation", label: "Conciliation" },
  { value: "arbitration", label: "Arbitration" },
  { value: "settled", label: "Settled" },
  { value: "withdrawn", label: "Withdrawn" },
];

export const referralStatusOptions = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "transferred", label: "Transferred" },
  { value: "completed", label: "Completed" },
];

export const mediationStatusOptions = [
  { value: "all", label: "All Status" },
  { value: "for_mediation", label: "For Mediation" },
  { value: "ongoing", label: "Ongoing" },
  { value: "settled", label: "Settled" },
  { value: "failed", label: "Failed" },
];
