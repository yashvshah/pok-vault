import { useState, useRef, useEffect } from "react";
import Fuse from "fuse.js";

interface MarketAutocompleteProps {
  questions: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarketAutocomplete({
  questions,
  value,
  onChange,
  placeholder = "Search market questions...",
}: MarketAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useRef(
    new Fuse(questions, {
      threshold: 0.3,
      keys: [""],
      includeScore: true,
      minMatchCharLength: 2,
    })
  );

  useEffect(() => {
    fuse.current.setCollection(questions);
  }, [questions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    if (newValue.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const results = fuse.current.search(newValue);
    const matchedQuestions = results.slice(0, 5).map((result) => result.item);
    setSuggestions(matchedQuestions);
    setIsOpen(matchedQuestions.length > 0);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (suggestions[highlightedIndex]) {
          onChange(suggestions[highlightedIndex]);
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-full sm:min-w-60">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (value.trim().length >= 2 && suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        className="w-full rounded-xl bg-black/40 px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-primary"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-black/95 border border-white/10 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                index === highlightedIndex
                  ? "bg-primary/20 text-white"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <div className="line-clamp-2">{suggestion}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
