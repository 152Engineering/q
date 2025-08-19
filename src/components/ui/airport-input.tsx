import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Airport {
  id: string;
  ident: string;
  name: string | null;
  type: string | null;
  iso_country: string | null;
  elevation_ft: number | null;
}

interface AirportInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onAirportFound?: (airport: Airport | null) => void;
  placeholder?: string;
  className?: string;
}

export const AirportInput = ({ value = "", onChange, onAirportFound, placeholder, className }: AirportInputProps) => {
  const [searchResults, setSearchResults] = useState<Airport[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAirports = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      onAirportFound?.(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("airport_ident")
        .select("id, ident, name, type, iso_country, elevation_ft")
        .ilike("ident", `%${query}%`)
        .order("ident")
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
      setShowDropdown(true);

      // Check for exact match and notify parent
      const exactMatch = data?.find(airport => airport.ident.toLowerCase() === query.toLowerCase());
      onAirportFound?.(exactMatch || null);
    } catch (error) {
      console.error("Error searching airports:", error);
      setSearchResults([]);
      setShowDropdown(false);
      onAirportFound?.(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setInputValue(newValue);
    onChange?.(newValue);
    searchAirports(newValue);
  };

  const handleSelectAirport = (airport: Airport) => {
    setInputValue(airport.ident);
    onChange?.(airport.ident);
    onAirportFound?.(airport);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      
      {showDropdown && searchResults.length > 0 && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute top-full left-0 right-0 z-50 mt-1",
            "bg-popover border border-border rounded-md shadow-md",
            "max-h-48 overflow-y-auto"
          )}
        >
          {searchResults.map((airport) => (
            <div
              key={airport.id}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground",
                "border-b border-border last:border-0",
                "text-sm"
              )}
              onClick={() => handleSelectAirport(airport)}
            >
              <div className="font-semibold">{airport.ident}</div>
              {airport.name && (
                <div className="text-muted-foreground text-xs truncate">
                  {airport.name}
                  {airport.iso_country && ` • ${airport.iso_country}`}
                  {airport.type && ` • ${airport.type}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};