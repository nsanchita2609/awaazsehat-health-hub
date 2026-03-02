import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '@/context/LanguageContext';
import { useApp, Clinic } from '@/context/AppContext';
import AppHeader from '@/components/AppHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { getDistanceKm } from '@/lib/helpers';

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ClinicFinder = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setSelectedClinic, userPincode, setUserPincode } = useApp();
  const [clinics, setClinics] = useState<(Clinic & { distance?: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [pincode, setPincode] = useState(userPincode);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchClinics = async (pin?: string, loc?: { lat: number; lng: number }) => {
    setLoading(true);
    try {
      let query = supabase.from('clinics').select('*');
      if (pin && pin.length >= 3) {
        query = query.like('pincode', `${pin.slice(0, 3)}%`);
      }
      const { data, error } = await query.order('name').limit(10);
      if (error) throw error;

      let results = (data || []) as Clinic[];
      if (loc) {
        results = results.map(c => ({
          ...c,
          distance: getDistanceKm(loc.lat, loc.lng, c.lat, c.lng),
        })).sort((a, b) => (a as any).distance - (b as any).distance);
      }
      setClinics(results as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (pincode.length >= 3) {
      setUserPincode(pincode);
      fetchClinics(pincode, userLocation || undefined);
    }
  };

  const handleUseLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        fetchClinics(undefined, loc);
      },
      () => {
        fetchClinics();
      }
    );
  };

  useEffect(() => {
    fetchClinics(userPincode || undefined);
  }, []);

  const selectClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    navigate('/book');
  };

  const mapCenter: [number, number] = clinics.length > 0
    ? [clinics[0].lat, clinics[0].lng]
    : [20.5937, 78.9629];
  const mapZoom = clinics.length > 0 ? 12 : 5;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <AppHeader title={t('clinicsNearYou')} showBack backRoute="/result" />

      <div className="app-container py-4 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder={t('enterPincode')}
            className="flex-1 h-12 bg-card border border-border rounded-xl px-4 text-base outline-none focus:border-primary transition-colors"
          />
          <button onClick={handleSearch} className="h-12 px-5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm">
            {t('search')}
          </button>
        </div>
        <button onClick={handleUseLocation} className="flex items-center gap-2 text-sm text-primary font-semibold">
          <MapPin className="w-4 h-4" /> {t('useLocation')}
        </button>

        {/* Map */}
        <div className="rounded-xl overflow-hidden border border-border" style={{ height: 280 }}>
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} key={`${mapCenter[0]}-${mapCenter[1]}`}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {clinics.map((c) => (
              <Marker key={c.id} position={[c.lat, c.lng]}>
                <Popup>
                  <strong>{c.name}</strong>
                  <br />
                  <button
                    onClick={() => selectClinic(c)}
                    className="mt-1 text-sm text-primary font-semibold underline"
                  >
                    {t('bookAppointment')}
                  </button>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Clinics List */}
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner className="w-8 h-8" /></div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{t('noClinics')}</p>
            <a href="tel:1800116666" className="inline-block bg-primary text-primary-foreground rounded-xl px-6 py-3 font-bold">
              📞 {t('nationalHelpline')}
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {clinics.map((c) => (
              <div key={c.id} className="bg-card rounded-xl p-4 card-shadow">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-foreground">{c.name}</h3>
                  {c.distance !== undefined && (
                    <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                      {c.distance.toFixed(1)} km
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{c.address}</p>
                {c.hours && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {c.hours}
                  </p>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="text-xs text-primary mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {c.phone}
                  </a>
                )}
                <button
                  onClick={() => selectClinic(c)}
                  className="w-full mt-3 h-11 bg-primary text-primary-foreground rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                >
                  {t('bookAppointment')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicFinder;
