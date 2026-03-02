import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import AppHeader from '@/components/AppHeader';
import RiskBadge from '@/components/RiskBadge';
import { formatDate } from '@/lib/helpers';

const Confirmation = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { riskResult, selectedClinic, bookingDetails, clearAll } = useApp();

  useEffect(() => {
    if (!riskResult || !selectedClinic || !bookingDetails) {
      navigate('/');
    }
  }, [riskResult, selectedClinic, bookingDetails, navigate]);

  if (!riskResult || !selectedClinic || !bookingDetails) return null;

  const timeLabel = {
    Morning: t('morning'),
    Afternoon: t('afternoon'),
    Evening: t('evening'),
  }[bookingDetails.preferredTime] || bookingDetails.preferredTime;

  const shareText = `🏥 TB Appointment Booked via AwaazSehat\n\nClinic: ${selectedClinic.name}\nAddress: ${selectedClinic.address}\nDate: ${formatDate(bookingDetails.preferredDate)}\nTime: ${bookingDetails.preferredTime}\n\nHelpline: 1800-11-6666`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <AppHeader showLogo />

      <div className="app-container py-8 space-y-6">
        {/* Success animation */}
        <div className="text-center">
          <div className="text-7xl animate-scale-in mb-3">✅</div>
          <h2 className="text-2xl font-bold text-primary">{t('bookingSuccess')}</h2>
        </div>

        {/* Summary Card */}
        <div className="bg-card border-2 border-primary rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-primary text-lg">{t('appointmentDetails')}</h3>
          <div className="space-y-2 text-base">
            <div className="flex gap-2"><span>🏥</span><span className="font-semibold">{selectedClinic.name}</span></div>
            <div className="flex gap-2"><span>📍</span><span className="text-muted-foreground">{selectedClinic.address}</span></div>
            <div className="flex gap-2"><span>👤</span><span>{bookingDetails.patientName}</span></div>
            <div className="flex gap-2"><span>📅</span><span>{formatDate(bookingDetails.preferredDate)}</span></div>
            <div className="flex gap-2"><span>🕐</span><span>{timeLabel}</span></div>
            <div className="flex gap-2 items-center"><span>⚠️</span><RiskBadge level={riskResult.level} /></div>
          </div>
        </div>

        {/* Show at clinic */}
        <div className="bg-accent/20 border border-accent rounded-lg p-3 text-center">
          <p className="font-bold text-sm">⚠️ {t('showAtClinic')}</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.print()}
            className="w-full h-12 bg-card border border-border rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:bg-muted"
          >
            📸 {t('takeScreenshot')}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 bg-card border border-border rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:bg-muted"
          >
            💬 {t('shareWhatsApp')}
          </a>
          <button
            onClick={() => { clearAll(); navigate('/'); }}
            className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-bold text-lg transition-all hover:opacity-90"
          >
            🏠 {t('backToHome')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
