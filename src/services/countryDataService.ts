import { Store, Supplier, Cluster } from '@/types';

// Define the structure of country data
export interface CountryData {
  country: string;
  stores: Store[];
  suppliers: Supplier[];
  alternateSuppliers: Supplier[];
  clusters: Cluster[];
}

// Cache for loaded country data
const countryDataCache: Record<string, CountryData> = {};

/**
 * Load country data from JSON file
 * @param countryCode The country code (usa, canada, mexico, uk, india, china)
 * @returns Promise with the country data
 */
export const loadCountryData = async (countryCode: string): Promise<CountryData> => {
  // Return from cache if available
  if (countryDataCache[countryCode]) {
    return countryDataCache[countryCode];
  }
  
  try {
    // Dynamic import of the country JSON file
    const { default: rawCountryData } = await import(`@/data/countries/${countryCode.toLowerCase()}.json`);

     // Map raw data to Store and Supplier interfaces, converting latitude/longitude to coordinates array
     const processedCountryData: CountryData = {
       country: rawCountryData.country || countryCode,
       alternateSuppliers: rawCountryData.alternateSuppliers?.map((supplier: any) => ({
         ...supplier,
         coordinates: supplier.coordinates // Use as-is from JSON
       })) || [],
       clusters: rawCountryData.clusters || [],
       stores: rawCountryData.stores.map((store: any) => ({
         ...store,
         coordinates: store.coordinates // Use as-is from JSON
       })),
       suppliers: rawCountryData.suppliers.map((supplier: any) => ({
         ...supplier,
         coordinates: supplier.coordinates // Use as-is from JSON
       }))
     };

     // Cache the processed data
     countryDataCache[countryCode] = processedCountryData;

     return processedCountryData;
  } catch (error) {
    console.error(`Failed to load country data for ${countryCode}:`, error);
    throw new Error(`Country data for ${countryCode} not found or invalid`);
  }
};

/**
 * Get list of available countries
 * @returns Array of country codes
 */
export const getAvailableCountries = async (): Promise<string[]> => {
  // This is a static list since we know the available countries
  return ['US', 'IN', 'MX', 'CA'];
};

/**
 * Get formatted country name from country code
 * @param countryCode The country code
 * @returns Formatted country name
 */
export const getCountryName = (countryCode: string): string => {
  const countryNames: Record<string, string> = {
    usa: 'United States',
    canada: 'Canada',
    mexico: 'Mexico',
    uk: 'United Kingdom',
    india: 'India',
    china: 'China'
  };
  
  return countryNames[countryCode.toLowerCase()] || countryCode;
};