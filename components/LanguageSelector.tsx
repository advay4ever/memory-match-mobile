import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { useState, useEffect, useRef } from 'react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  { code: 'yo', name: 'Yorùbá', flag: '🇳🇬' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset focused index when opening dropdown
  useEffect(() => {
    if (isOpen) {
      const currentIndex = languages.findIndex(lang => lang.code === currentLanguage.code);
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, currentLanguage.code]);

  // Keyboard navigation for main button
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'ArrowDown' && !isOpen) {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  // Keyboard navigation for dropdown
  const handleDropdownKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % languages.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + languages.length) % languages.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      changeLanguage(languages[focusedIndex].code);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
    } else if (event.key === 'Tab') {
      // Allow default Tab behavior to move focus away
      setIsOpen(false);
    }
  };

  return (
    <div className="relative max-w-md" ref={dropdownRef}>
      <label className="block text-center text-gray-700 font-bold text-xl mb-3">
        🌍 Select Your Language
      </label>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-label="Select language"
        aria-expanded={isOpen}
        className="rounded-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 active:scale-95 text-white shadow-2xl hover:shadow-2xl transition-all duration-150 px-10 py-8 border-4 border-gray-900 ring-4 ring-blue-300 ring-opacity-50 animate-pulse focus:outline-none focus:ring-4 focus:ring-blue-500"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black w-12 text-center bg-white text-blue-700 rounded-lg px-2 py-1">
            {currentLanguage.code.toUpperCase()}
          </span>
          <span className="font-bold text-2xl">{currentLanguage.name}</span>
        </div>
      </Button>

      {isOpen && (
        <div 
          role="listbox" 
          onKeyDown={handleDropdownKeyDown}
          className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto"
        >
          {languages.map((lang, index) => (
            <button
              key={lang.code}
              role="option"
              aria-selected={currentLanguage.code === lang.code}
              tabIndex={focusedIndex === index ? 0 : -1}
              onClick={() => changeLanguage(lang.code)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  changeLanguage(lang.code);
                }
              }}
              onFocus={() => setFocusedIndex(index)}
              ref={(el) => {
                if (focusedIndex === index && el) {
                  el.focus();
                }
              }}
              className={`w-full px-8 py-5 text-left hover:bg-gray-100 active:bg-blue-200 active:scale-[0.98] transition-all duration-150 flex items-center gap-4 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:bg-blue-50 ${
                currentLanguage.code === lang.code ? 'bg-blue-100 border-l-4 border-blue-600' : ''
              } ${focusedIndex === index ? 'bg-blue-50' : ''}`}
            >
              <span className="text-2xl font-black w-12 text-center bg-gray-100 text-gray-700 rounded px-2 py-1">
                {lang.code.toUpperCase()}
              </span>
              <span className="text-xl">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
