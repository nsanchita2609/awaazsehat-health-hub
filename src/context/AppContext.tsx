import React, { createContext, useContext, useState } from 'react';

export interface RiskResult {
  level: 'Low' | 'Medium' | 'High';
  response: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  phone: string | null;
  hours: string | null;
}

export interface BookingDetails {
  patientName: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
}

interface AppContextType {
  transcript: string;
  setTranscript: (t: string) => void;
  riskResult: RiskResult | null;
  setRiskResult: (r: RiskResult | null) => void;
  selectedClinic: Clinic | null;
  setSelectedClinic: (c: Clinic | null) => void;
  userPincode: string;
  setUserPincode: (p: string) => void;
  bookingDetails: BookingDetails | null;
  setBookingDetails: (b: BookingDetails | null) => void;
  clearAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transcript, setTranscript] = useState('');
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [userPincode, setUserPincode] = useState('');
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

  const clearAll = () => {
    setTranscript('');
    setRiskResult(null);
    setSelectedClinic(null);
    setUserPincode('');
    setBookingDetails(null);
  };

  return (
    <AppContext.Provider value={{
      transcript, setTranscript,
      riskResult, setRiskResult,
      selectedClinic, setSelectedClinic,
      userPincode, setUserPincode,
      bookingDetails, setBookingDetails,
      clearAll,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
