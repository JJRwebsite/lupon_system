// Utility functions for filtering and sorting data

export interface FilterOptions {
  searchQuery: string;
  statusFilter: string;
  dateFilter: string;
  sortBy: string;
}

// Base interface that all searchable objects must implement
export type BaseSearchableObject = {
  id?: number | string;
  case_title?: string;
  status?: string;
  date_filed?: string | Date | null;
  [key: string]: unknown; // Allow any additional string-keyed properties
};

// Type guard to check if value is an object with a name property
function hasName(obj: unknown): obj is { name: string } {
  return typeof obj === 'object' && obj !== null && 'name' in obj && typeof (obj as { name: unknown }).name === 'string';
}

// Type guard to check if value is a string
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Type guard to check if value is a valid date string or Date object
function isDateLike(value: unknown): value is string | Date {
  if (value === null || value === undefined || value === '') return false;
  if (value instanceof Date) return true;
  if (typeof value === 'string') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
}

export function applyFiltersAndSort<T extends BaseSearchableObject>(
  data: T[],
  options: FilterOptions,
  searchFields: (keyof T)[],
  dateField: keyof T = 'date_filed' as keyof T
): T[] {
  let result = [...data];

  // Apply search filter
  if (options.searchQuery) {
    const searchTerm = options.searchQuery.toLowerCase();
    
    result = result.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        
        // Handle string values
        if (isString(value)) {
          return value.toLowerCase().includes(searchTerm);
        }
        
        // Handle arrays of searchable values
        if (Array.isArray(value)) {
          return value.some((v) => {
            if (isString(v)) {
              return v.toLowerCase().includes(searchTerm);
            }
            if (hasName(v)) {
              return v.name.toLowerCase().includes(searchTerm);
            }
            return false;
          });
        }
        
        // Handle object with name property
        if (hasName(value)) {
          return value.name.toLowerCase().includes(searchTerm);
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
    
    // Helper function to safely get date from item
    const getItemDate = (item: T, field: keyof T): Date | null => {
      const value = item[field];
      if (!value) return null;
      
      if (value instanceof Date) {
        return value;
      }
      
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      }
      
      return null;
    };
    
    switch (options.dateFilter) {
      case "today":
        filterDate.setHours(0, 0, 0, 0);
        result = result.filter((item) => {
          const itemDate = getItemDate(item, dateField);
          return itemDate ? itemDate >= filterDate : false;
        });
        break;
        
      case "week":
        filterDate.setDate(now.getDate() - 7);
        result = result.filter((item) => {
          const itemDate = getItemDate(item, dateField);
          return itemDate ? itemDate >= filterDate : false;
        });
        break;
        
      case "month":
        filterDate.setMonth(now.getMonth() - 1);
        result = result.filter((item) => {
          const itemDate = getItemDate(item, dateField);
          return itemDate ? itemDate >= filterDate : false;
        });
        break;
    }
  }
  
  // Apply sorting with proper type safety
  switch (options.sortBy) {
    case "date_desc":
      result.sort((a, b) => {
        const dateA = a[dateField];
        const dateB = b[dateField];
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        const timeA = isDateLike(dateA) ? new Date(dateA as string | Date).getTime() : 0;
        const timeB = isDateLike(dateB) ? new Date(dateB as string | Date).getTime() : 0;
        
        return timeB - timeA;
      });
      break;
      
    case "date_asc":
      result.sort((a, b) => {
        const dateA = a[dateField];
        const dateB = b[dateField];
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return -1;
        if (!dateB) return 1;
        
        const timeA = isDateLike(dateA) ? new Date(dateA as string | Date).getTime() : 0;
        const timeB = isDateLike(dateB) ? new Date(dateB as string | Date).getTime() : 0;
        
        return timeA - timeB;
      });
      break;
    case "title_asc":
      result.sort((a, b) => {
        const titleA = typeof a.case_title === 'string' ? a.case_title : '';
        const titleB = typeof b.case_title === 'string' ? b.case_title : '';
        return titleA.localeCompare(titleB);
      });
      break;
    case "title_desc":
      result.sort((a, b) => {
        const titleA = typeof a.case_title === 'string' ? a.case_title : '';
        const titleB = typeof b.case_title === 'string' ? b.case_title : '';
        return titleB.localeCompare(titleA);
      });
      break;
    case "status":
      result.sort((a, b) => {
        const statusA = typeof a.status === 'string' ? a.status : '';
        const statusB = typeof b.status === 'string' ? b.status : '';
        return statusA.localeCompare(statusB);
      });
      break;
    default:
      result.sort((a, b) => {
        const idA = typeof a.id === 'number' ? a.id : 
                   typeof a.id === 'string' ? parseInt(a.id, 10) || 0 : 0;
        const idB = typeof b.id === 'number' ? b.id : 
                   typeof b.id === 'string' ? parseInt(b.id, 10) || 0 : 0;
        return idB - idA;
      });
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
