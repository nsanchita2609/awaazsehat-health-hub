import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import AppHeader from '@/components/AppHeader';
import { Language } from '@/translations';

const languageOptions: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <AppHeader showLogo />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-light to-background px-4 py-10 text-center">
        <div className="text-[64px] leading-none mb-4">🫁</div>
        <h1 className="text-[28px] font-bold text-foreground mb-2 leading-tight">
          {t('heroHeadline')}
        </h1>
        <p className="text-base text-muted-foreground">{t('tagline')}</p>
      </div>

      <div className="app-container pb-8">
        {/* Language Selector */}
        <div className="mt-6">
          <p className="text-sm text-muted-foreground text-center mb-3">{t('chooseLanguage')}</p>
          <div className="grid grid-cols-2 gap-3">
            {languageOptions.map((opt) => (
              <button
                key={opt.code}
                onClick={() => setLanguage(opt.code)}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-full border-2 text-base transition-all duration-200 ${
                  language === opt.code
                    ? 'border-primary bg-primary-light text-primary font-bold'
                    : 'border-border bg-card text-foreground hover:border-primary/50'
                }`}
              >
                <span>{opt.flag}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 mt-6 text-[13px] text-muted-foreground">
          <span>✅ {t('free')}</span>
          <span className="text-border">|</span>
          <span>🔒 {t('noLogin')}</span>
          <span className="text-border">|</span>
          <span>🏥 {t('trusted')}</span>
        </div>

        {/* Start Button */}
        <button
          onClick={() => navigate('/screener')}
          className="w-full mt-6 h-14 bg-primary text-primary-foreground font-bold text-lg rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
        >
          {t('startScreening')}
        </button>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">{t('disclaimer')}</p>
          <a href="tel:1800116666" className="text-primary text-sm font-semibold mt-1 inline-block">
            📞 {t('nationalHelpline')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Landing;
