import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import AppHeader from '@/components/AppHeader';
import RiskBadge from '@/components/RiskBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Booking = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { selectedClinic, riskResult, setBookingDetails } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (!selectedClinic) navigate('/clinics');
  }, [selectedClinic, navigate]);

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const validatePhone = (val: string) => {
    const valid = /^[6-9]\d{9}$/.test(val);
    setPhoneError(val.length > 0 && !valid ? t('invalidPhone') : '');
    return valid;
  };

  const isValid = name.trim().length >= 2 && validatePhone(phone) && date && time;

  const handleSubmit = async () => {
    if (!isValid || !selectedClinic || !riskResult || loading) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('appointments').insert({
        patient_name: name.trim(),
        phone,
        clinic_id: selectedClinic.id,
        clinic_name: selectedClinic.name,
        preferred_date: date,
        preferred_time: time,
        risk_level: riskResult.level,
        status: 'Pending',
      });

      if (error) throw error;

      setBookingDetails({ patientName: name.trim(), phone, preferredDate: date, preferredTime: time });
      navigate('/confirmation');
    } catch (err) {
      console.error(err);
      toast.error(t('bookingFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!selectedClinic) return null;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <AppHeader title={t('bookAppointment')} showBack backRoute="/clinics" />

      <div className="app-container py-6 space-y-5">
        {/* Clinic info */}
        <div className="bg-primary-light rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">🏥</span>
          <div className="flex-1">
            <p className="font-bold text-primary">{selectedClinic.name}</p>
            {riskResult && <RiskBadge level={riskResult.level} />}
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">{t('yourName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full h-12 bg-card border border-border rounded-xl px-4 text-base outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">{t('yourPhone')}</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setPhone(val);
                if (val.length === 10) validatePhone(val);
              }}
              onBlur={() => validatePhone(phone)}
              placeholder="10-digit mobile number"
              className="w-full h-12 bg-card border border-border rounded-xl px-4 text-base outline-none focus:border-primary transition-colors"
            />
            {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">{t('preferredDate')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              max={maxDate}
              className="w-full h-12 bg-card border border-border rounded-xl px-4 text-base outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">{t('preferredTime')}</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full h-12 bg-card border border-border rounded-xl px-4 text-base outline-none focus:border-primary transition-colors"
            >
              <option value="">{t('preferredTime')}</option>
              <option value="Morning">{t('morning')}</option>
              <option value="Afternoon">{t('afternoon')}</option>
              <option value="Evening">{t('evening')}</option>
            </select>
          </div>
        </div>

        {/* Privacy */}
        <p className="text-xs text-muted-foreground text-center">{t('privacyNote')}</p>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className={`w-full h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${
            isValid && !loading
              ? 'bg-primary text-primary-foreground hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {loading ? <><LoadingSpinner className="w-5 h-5" /> Booking...</> : t('confirmAppointment')}
        </button>
      </div>
    </div>
  );
};

export default Booking;
