import React, { useEffect, useState } from 'react';
import { getAvailableCountries, getCountryName } from '@/services/countryDataService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

interface CountrySelectorProps {
  selectedCountry: string;
  onCountryChange: (countryCode: string) => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ 
  selectedCountry, 
  onCountryChange 
}) => {
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const availableCountries = await getAvailableCountries();
        setCountries(availableCountries);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load countries:', error);
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <span>Country Selection</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Select a country to view its stores, suppliers, and clusters.
          </p>
          <Select 
            value={selectedCountry} 
            onValueChange={onCountryChange}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((countryCode) => (
                <SelectItem key={countryCode} value={countryCode}>
                  {getCountryName(countryCode)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default CountrySelector;