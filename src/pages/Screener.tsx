import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import AppHeader from '@/components/AppHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Screener = () => {
  const navigate = useNavigate();
  const { t, language, langCode, langName } = useLanguage();
  const { transcript, setTranscript, setRiskResult } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const recognitionRef = useRef<any>(null);

  const hasSpeechSupport = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  const toggleRecording = useCallback(() => {
    if (!hasSpeechSupport) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = langCode;

    let accumulated = transcript;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        accumulated += ' ' + finalTranscript;
        setTranscript(accumulated.trim());
      } else if (interimTranscript) {
        setTranscript((accumulated + ' ' + interimTranscript).trim());
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, langCode, transcript, setTranscript, hasSpeechSupport]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleAnalyze = async () => {
    if (wordCount < 5 || isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const response = await supabase.functions.invoke('tb-screen', {
        body: { transcript, language, languageName: langName },
      });

      if (response.error) throw new Error(response.error.message);

      const data = response.data;
      setRiskResult({ level: data.riskLevel, response: data.aiResponse });

      // Save screening to DB
      await supabase.from('screenings').insert({
        language,
        transcript,
        risk_result: data.riskLevel,
        ai_response: data.aiResponse,
      });

      navigate('/result');
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error(t('analysisFailed'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <AppHeader
        title={t('tbScreener')}
        showBack
        backRoute="/"
        rightElement={
          <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded-full font-semibold">
            {language.toUpperCase()}
          </span>
        }
      />

      <div className="app-container py-6 space-y-6">
        {/* Instruction */}
        <div className="bg-primary-light rounded-xl p-4">
          <p className="text-base font-semibold text-foreground">{t('speakSymptoms')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('symptomHint')}</p>
        </div>

        {/* Mic Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={toggleRecording}
            disabled={!hasSpeechSupport}
            className={`w-[120px] h-[120px] rounded-full flex items-center justify-center transition-all duration-200 ${
              isRecording
                ? 'bg-destructive animate-pulse-mic'
                : 'bg-primary hover:opacity-90'
            } disabled:bg-muted disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <MicOff className="w-12 h-12 text-primary-foreground" />
            ) : (
              <Mic className="w-12 h-12 text-primary-foreground" />
            )}
          </button>
          <p className="text-base text-muted-foreground">
            {isRecording ? t('listening') : t('tapMic')}
          </p>
        </div>

        {/* Voice not supported */}
        {!hasSpeechSupport && (
          <div className="bg-accent/20 border border-accent rounded-xl p-3 text-sm text-foreground">
            ⚠️ {t('noVoiceSupport')}
          </div>
        )}

        {/* Transcript */}
        <div className="bg-card border border-border rounded-xl p-4 min-h-[120px] relative">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={t('speakSymptoms')}
            className="w-full min-h-[90px] bg-transparent text-base text-foreground resize-none outline-none placeholder:text-muted-foreground"
          />
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {wordCount} words
          </span>
        </div>

        {/* Text fallback toggle */}
        <button
          onClick={() => setShowTextInput(!showTextInput)}
          className="text-sm text-primary underline"
        >
          {t('textFallback')}
        </button>

        {showTextInput && (
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
            className="w-full bg-card border border-border rounded-xl p-4 text-base text-foreground resize-none outline-none"
            placeholder={t('speakSymptoms')}
          />
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={wordCount < 5 || isAnalyzing}
          className={`w-full h-14 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            wordCount >= 5 && !isAnalyzing
              ? 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isAnalyzing ? (
            <>
              <LoadingSpinner className="w-5 h-5" />
              {t('analyzing')}
            </>
          ) : (
            t('analyze')
          )}
        </button>
      </div>
    </div>
  );
};

export default Screener;
