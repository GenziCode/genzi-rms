import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { Search, X, Loader2, ChevronDown, Check } from 'lucide-react';

export interface AutocompleteOption {
  value: string;
  label: string;
  [key: string]: any; // Allow additional properties
}

export interface AutocompleteProps<T extends AutocompleteOption> {
  /**
   * Options to display
   */
  options: T[];
  
  /**
   * Current value
   */
  value?: string;
  
  /**
   * Callback when value changes
   */
  onChange: (value: string) => void;
  
  /**
   * Callback when option is selected
   */
  onSelect?: (option: T) => void;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Whether the component is loading
   */
  isLoading?: boolean;
  
  /**
   * Whether the component is disabled
   */
  disabled?: boolean;
  
  /**
   * Debounce delay in milliseconds (default: 300)
   */
  debounceMs?: number;
  
  /**
   * Minimum characters before searching (default: 2)
   */
  minChars?: number;
  
  /**
   * Custom render function for options
   */
  renderOption?: (option: T) => React.ReactNode;
  
  /**
   * Custom render function for selected value display
   */
  renderValue?: (option: T | null) => React.ReactNode;
  
  /**
   * Maximum number of options to display
   */
  maxOptions?: number;
  
  /**
   * Show clear button
   */
  showClear?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
  
  /**
   * Empty state message
   */
  emptyMessage?: string;
  
  /**
   * Loading message
   */
  loadingMessage?: string;
}

/**
 * Autocomplete Component
 * 
 * Features:
 * - Debounced search input
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Click outside to close
 * - Loading states
 * - Customizable rendering
 */
export default function Autocomplete<T extends AutocompleteOption>({
  options,
  value = '',
  onChange,
  onSelect,
  placeholder = 'Type to search...',
  isLoading = false,
  disabled = false,
  debounceMs = 300,
  minChars = 2,
  renderOption,
  renderValue,
  maxOptions = 10,
  showClear = true,
  className = '',
  emptyMessage = 'No results found',
  loadingMessage = 'Searching...',
}: AutocompleteProps<T>) {
  const [inputValue, setInputValue] = useState(value);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedOption, setSelectedOption] = useState<T | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounce input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, debounceMs]);

  // Trigger onChange when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue]);

  // Find selected option based on value
  useEffect(() => {
    if (value) {
      const option = options.find(opt => opt.value === value);
      setSelectedOption(option || null);
      if (option) {
        setInputValue(option.label);
      }
    } else {
      setSelectedOption(null);
    }
  }, [value, options]);

  // Filter options based on input
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(debouncedValue.toLowerCase()) ||
    option.value.toLowerCase().includes(debouncedValue.toLowerCase())
  ).slice(0, maxOptions);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // Clear selection if input changes
    if (selectedOption && newValue !== selectedOption.label) {
      setSelectedOption(null);
      onChange('');
    }
  };

  const handleSelect = (option: T) => {
    setInputValue(option.label);
    setSelectedOption(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange(option.value);
    onSelect?.(option);
  };

  const handleClear = () => {
    setInputValue('');
    setDebouncedValue('');
    setSelectedOption(null);
    setIsOpen(false);
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen && filteredOptions.length > 0) {
          setIsOpen(true);
        }
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  };

  const shouldShowOptions = isOpen && debouncedValue.length >= minChars && !disabled;
  const displayOptions = shouldShowOptions ? filteredOptions : [];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (debouncedValue.length >= minChars) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2 border rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${selectedOption ? 'bg-blue-50 border-blue-300' : 'bg-white'}
          `}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          )}
          {showClear && inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {!isLoading && !inputValue && (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {shouldShowOptions && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {loadingMessage}
            </div>
          ) : displayOptions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            <ul ref={listRef} className="py-1">
              {displayOptions.map((option, index) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`
                    px-4 py-2 cursor-pointer transition-colors
                    ${index === highlightedIndex
                      ? 'bg-blue-50 text-blue-900'
                      : 'hover:bg-gray-50'
                    }
                    ${selectedOption?.value === option.value ? 'bg-blue-100' : ''}
                  `}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <>
                        <span className="flex-1">{option.label}</span>
                        {selectedOption?.value === option.value && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

