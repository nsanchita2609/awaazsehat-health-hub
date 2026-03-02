import { useLanguage } from '@/context/LanguageContext';

interface RiskBadgeProps {
  level: 'Low' | 'Medium' | 'High';
  size?: 'sm' | 'lg';
}

const RiskBadge = ({ level, size = 'sm' }: RiskBadgeProps) => {
  const { t } = useLanguage();

  const config = {
    High: { bg: 'bg-risk-high', label: t('highRisk') },
    Medium: { bg: 'bg-risk-medium', label: t('mediumRisk') },
    Low: { bg: 'bg-risk-low', label: t('lowRisk') },
  };

  const c = config[level];
  const sizeClass = size === 'lg' ? 'px-5 py-2 text-lg font-bold' : 'px-3 py-1 text-xs font-semibold';

  return (
    <span className={`${c.bg} text-primary-foreground rounded-full ${sizeClass} inline-block`}>
      {c.label}
    </span>
  );
};

export default RiskBadge;
