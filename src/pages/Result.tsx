import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Square, Play, Share2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import AppHeader from '@/components/AppHeader';
import RiskBadge from '@/components/RiskBadge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Result = () => {
  const navigate = useNavigate();
  const { t, langCode } = useLanguage();
  const { riskResult } = useApp();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!riskResult) {
      navigate('/screener');
      return;
    }
    speakResult();
    return () => window.speechSynthesis.cancel();
  }, []);

  const speakResult = () => {
    if (!riskResult) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(riskResult.response);
    u.lang = langCode;
    u.rate = 0.85;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    utteranceRef.current = u;
    setIsSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (!riskResult) return null;

  const riskEmoji = { High: '🔴', Medium: '🟡', Low: '🟢' }[riskResult.level];
  const riskBg = { High: 'bg-risk-high', Medium: 'bg-risk-medium', Low: 'bg-risk-low' }[riskResult.level];

  const tbFaqKeys = [
    ['whatIsTb', 'whatIsTbAnswer'],
    ['howTbSpreads', 'howTbSpreadsAnswer'],
    ['isTbCurable', 'isTbCurableAnswer'],
    ['tbSymptoms', 'tbSymptomsAnswer'],
    ['whatIsDots', 'whatIsDotsAnswer'],
    ['whenToTest', 'whenToTestAnswer'],
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <AppHeader title={t('yourResult')} />

      <div className="app-container py-6 space-y-5">
        {/* Risk Card */}
        <div className={`${riskBg} rounded-2xl p-6 text-center text-primary-foreground`}>
          <div className="text-5xl mb-2">{riskEmoji}</div>
          <div className="text-4xl font-bold">
            {riskResult.level === 'High' ? t('highRisk') : riskResult.level === 'Medium' ? t('mediumRisk') : t('lowRisk')}
          </div>
          <p className="text-sm opacity-85 mt-1">TB Risk Assessment</p>
        </div>

        {/* Voice readback */}
        <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
          <Volume2 className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="text-sm text-muted-foreground flex-1">
            {isSpeaking ? t('readingAloud') : t('replayAudio')}
          </span>
          {isSpeaking ? (
            <button onClick={stopSpeaking} className="p-2 rounded-lg hover:bg-border transition-colors">
              <Square className="w-4 h-4 text-foreground" />
            </button>
          ) : (
            <button onClick={speakResult} className="p-2 rounded-lg hover:bg-border transition-colors">
              <Play className="w-4 h-4 text-foreground" />
            </button>
          )}
        </div>

        {/* AI Response */}
        <div className="bg-card rounded-xl border-l-4 border-primary p-4">
          <h3 className="text-lg font-bold text-primary mb-2">{t('nextSteps')}</h3>
          <p className="text-base text-foreground leading-relaxed whitespace-pre-line">{riskResult.response}</p>
        </div>

        {/* Actions */}
        <button
          onClick={() => navigate('/clinics')}
          className="w-full h-14 bg-primary text-primary-foreground font-bold text-lg rounded-xl transition-all duration-200 hover:opacity-90"
        >
          {t('findClinic')}
        </button>
        <button
          onClick={() => navigate('/screener')}
          className="w-full h-14 bg-card border-2 border-primary text-secondary-foreground font-bold text-lg rounded-xl transition-all duration-200 hover:bg-primary-light"
        >
          {t('takeAgain')}
        </button>

        {/* TB Education */}
        <div className="mt-4">
          <h3 className="text-lg font-bold text-foreground mb-2">{t('tbEducation')}</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {tbFaqKeys.map(([q, a], i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-card rounded-xl border border-border px-4">
                <AccordionTrigger className="text-base font-semibold text-foreground py-3">
                  {t(q)}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-3 leading-relaxed">
                  {t(a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default Result;
