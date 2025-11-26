import type {
  ReactNode} from "react";
import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import type { Campaign } from "@shared/schema";

// Centralized app state to reduce prop drilling
interface AppState {
  // UI State
  isLoading: boolean;
  selectedCampaign: Campaign | null;
  isModalOpen: boolean;

  // Filter State
  filters: {
    startDate: string;
    endDate: string;
    location: string;
    availability: string;
  };

  // Campaign Data
  campaigns: Campaign[];
  filteredCampaigns: Campaign[];
  totalCampaigns: number;
}

interface AppContextType extends AppState {
  // UI Actions
  setIsLoading: (loading: boolean) => void;
  setSelectedCampaign: (campaign: Campaign | null) => void;
  setIsModalOpen: (open: boolean) => void;

  // Filter Actions
  updateFilters: (filters: Partial<AppState["filters"]>) => void;
  clearFilters: () => void;

  // Campaign Actions
  setCampaigns: (campaigns: Campaign[]) => void;
  setFilteredCampaigns: (campaigns: Campaign[]) => void;

  // Computed Values
  getMaxDate: () => string;
  getUniqueLocations: () => string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultFilters = {
  startDate: "",
  endDate: "",
  location: "all",
  availability: "all",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);

  const updateFilters = useCallback(
    (newFilters: Partial<AppState["filters"]>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Computed values
  const getMaxDate = useCallback(() => {
    if (campaigns.length === 0) return "";

    const maxDate = campaigns.reduce((latest: Date, campaign: Campaign) => {
      const [day, month, year] = campaign.date.split("/");
      const campaignDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
      );
      return campaignDate > latest ? campaignDate : latest;
    }, new Date(0));

    return maxDate.toISOString().split("T")[0];
  }, [campaigns]);

  const getUniqueLocations = useCallback(() => {
    const locations = new Set<string>();
    campaigns.forEach((campaign) => {
      const campaignName = campaign.campaign.trim();
      if (campaignName) {
        locations.add(campaignName);
      }
    });
    return Array.from(locations).sort();
  }, [campaigns]);

  const value: AppContextType = {
    // State
    isLoading,
    selectedCampaign,
    isModalOpen,
    filters,
    campaigns,
    filteredCampaigns,
    totalCampaigns: campaigns.length,

    // Actions
    setIsLoading,
    setSelectedCampaign,
    setIsModalOpen,
    updateFilters,
    clearFilters,
    setCampaigns,
    setFilteredCampaigns,

    // Computed Values
    getMaxDate,
    getUniqueLocations,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
