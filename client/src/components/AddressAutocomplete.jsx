import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

const AddressAutocomplete = ({
  value,
  onChange,
  wilaya,
  commune,
  disabled,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (disabled || !wilaya || !commune || value.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const query = `${value}, ${commune}, ${wilaya}, Algeria`;

        const params = new URLSearchParams({
          q: query,
          format: "json",
          addressdetails: "1",
          limit: "6",
          countrycodes: "dz",
          "accept-language": "fr",
        });

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        );

        const data = await res.json();

        const cleanSuggestions = data
          .map((item) => ({
            id: item.place_id,
            label: item.display_name,
            lat: item.lat,
            lon: item.lon,
          }))
          .filter(
            (item, index, self) =>
              index === self.findIndex((s) => s.label === item.label),
          );

        setSuggestions(cleanSuggestions);
        setIsOpen(cleanSuggestions.length > 0);
      } catch (error) {
        console.log("Address autocomplete error:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [value, wilaya, commune, disabled]);

  const handleSelect = (suggestion) => {
    onChange(suggestion.label);
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          required
          className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 pr-11 outline-none focus:border-stone-900 disabled:cursor-not-allowed disabled:bg-stone-100"
          placeholder={
            disabled
              ? "Choose commune first..."
              : `Search street or address in ${commune}...`
          }
        />

        <div className="absolute right-4 top-1/2 translate-y-[-35%] text-stone-400">
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <MapPin size={18} />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-stone-100 bg-white shadow-xl">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onMouseDown={() => handleSelect(suggestion)}
              className="flex w-full gap-3 px-4 py-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
            >
              <MapPin size={18} className="mt-0.5 shrink-0 text-stone-400" />

              <span className="line-clamp-2">{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}

      {!disabled && value.trim().length > 0 && value.trim().length < 3 && (
        <p className="mt-2 text-xs text-stone-400">
          Type at least 3 letters to search address.
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
