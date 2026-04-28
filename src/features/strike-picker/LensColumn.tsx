import type { ScoredCandidate } from '@/analytics/recommendation-engine';
import { RecommendationCard } from './RecommendationCard';

type Props = {
  title: string;
  description: string;
  picks: ScoredCandidate[];
};

export function LensColumn({ title, description, picks }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {picks.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-center text-xs text-gray-500">
          No candidates match filters
        </div>
      ) : (
        picks.map((rec, i) => (
          <RecommendationCard key={`${rec.strike}-${rec.expiration}`} rec={rec} rank={i} />
        ))
      )}
    </div>
  );
}
