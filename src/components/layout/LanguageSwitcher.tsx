import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal';
  className?: string;
}

const LanguageSwitcher = ({ variant = 'default', className = '' }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' },
  ];

  // Update document direction when language changes
  useEffect(() => {
    const lang = languages.find(l => l.code === i18n.language);
    if (lang) {
      document.documentElement.dir = lang.dir;
      document.documentElement.lang = lang.code;
    }
  }, [i18n.language]);

  const buttonStyles = variant === 'minimal' 
    ? 'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary/80 text-muted-foreground'
    : 'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary';

  return (
    <div className={`relative group ${className}`}>
      <button
        type="button"
        className={buttonStyles}
      >
        <Globe className="h-4 w-4" />
        <span>{languages.find(lang => lang.code === i18n.language)?.name || 'Français'}</span>
      </button>
      <div className="absolute right-0 top-full z-50 mt-1 hidden min-w-[150px] overflow-hidden rounded-md border bg-card shadow-md group-hover:block">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => {
              i18n.changeLanguage(lang.code);
              document.documentElement.dir = lang.dir;
              document.documentElement.lang = lang.code;
            }}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary ${
              i18n.language === lang.code ? 'bg-primary/10 font-medium text-primary' : ''
            }`}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
