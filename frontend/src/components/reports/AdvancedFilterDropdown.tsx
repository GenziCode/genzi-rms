import { useState, useRef, useEffect } from 'react';
import { Filter, X, Check, ChevronDown } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  value: any;
}

interface AdvancedFilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  multiSelect?: boolean;
  searchable?: boolean;
}

export default function AdvancedFilterDropdown({
  label,
  options,
  selectedValues,
  onSelectionChange,
  multiSelect = true,
  searchable = true,
}: AdvancedFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (optionId: string) => {
    if (multiSelect) {
      if (selectedValues.includes(optionId)) {
        onSelectionChange(selectedValues.filter((id) => id !== optionId));
      } else {
        onSelectionChange([...selectedValues, optionId]);
      }
    } else {
      onSelectionChange([optionId]);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onSelectionChange([]);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 bg-white border-2 rounded-lg font-medium text-sm
          transition-all duration-200
          ${
            isOpen || selectedValues.length > 0
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:border-gray-400'
          }
        `}
      >
        <Filter className="w-4 h-4" />
        <span>{label}</span>
        {selectedValues.length > 0 && (
          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
            {selectedValues.length}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
          {/* Search */}
          {searchable && (
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleToggle(option.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm
                    transition-colors
                    ${
                      selectedValues.includes(option.id)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center
                      ${
                        selectedValues.includes(option.id)
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }
                    `}
                  >
                    {selectedValues.includes(option.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="flex-1">{option.label}</span>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {selectedValues.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleClear}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

