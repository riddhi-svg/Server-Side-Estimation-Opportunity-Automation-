import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { SelectItem } from '../../types/gtm.types';

interface SearchableSelectProps {
  items: SelectItem[];
  value: SelectItem | null;
  onChange: (item: SelectItem | null) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingMessage?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  items,
  value,
  onChange,
  placeholder = 'Select Option',
  disabled = false,
  loading = false,
  loadingMessage = 'Loading...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.publicId && item.publicId.toLowerCase().includes(q))
    );
  }, [items, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (disabled || loading) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSelect = (item: SelectItem) => {
    onChange(item);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredItems.length) {
        handleSelect(filteredItems[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled || loading}
        className={`w-full min-h-[46px] px-3.5 py-2 rounded-lg border text-left flex items-center justify-between gap-2 transition duration-150 ${
          disabled || loading
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white text-slate-900'
            : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
        }`}
      >
        <div className="flex flex-col truncate">
          <span className={`text-sm ${value ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
            {loading ? loadingMessage : value ? value.name : placeholder}
          </span>
          {value?.publicId && (
            <span className="text-[10px] font-mono font-semibold text-emerald-700">{value.publicId}</span>
          )}
          {!value?.publicId && value?.id && (
            <span className="text-[10px] font-mono text-slate-400">ID: {value.id}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by name or ID..."
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="px-3 py-1 bg-slate-50/50 text-[11px] font-medium text-slate-400 border-b border-slate-100">
            {filteredItems.length} of {items.length} items
          </div>

          <ul className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50">
            {filteredItems.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-slate-400">No items found</li>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = value?.id === item.id;
                const isActive = idx === activeIndex;
                return (
                  <li
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 truncate">
                      <span className="truncate">{item.name}</span>
                      <div className="flex items-center gap-1.5">
                        {item.publicId && (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-mono">
                            {item.publicId}
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                          ID: {item.id}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
