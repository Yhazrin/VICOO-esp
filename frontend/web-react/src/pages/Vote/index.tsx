import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { artworksApi } from '@/services/artworks';
import type { Artwork } from '@/types';

/* ─── Artwork Voting Card ─── */

function ArtworkVoteCard({
  artwork,
  index,
  onVote,
}: {
  artwork: Artwork;
  index: number;
  onVote: (id: number) => Promise<void>;
}) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const [voted, setVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(artwork.vote_count);

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!voted) {
      setVoted(true);
      setVoteCount((c) => c + 1);
      onVote(artwork.id).catch(() => {
        setVoted(false);
        setVoteCount((c) => c - 1);
      });
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
      animate={prefersReducedMotion ? (isVisible ? { opacity: 1 } : {}) : (isVisible ? { opacity: 1, y: 0 } : {})}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay: index * 0.08 }}
      className="group"
    >
      <div className="relative aspect-square overflow-hidden border-2 border-warm-gray/20 bg-aged-stock mb-3 group-hover:border-rust/30 transition-colors duration-300">
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/3 via-transparent to-archive-brown/5" />
        <img
          src={artwork.image_url}
          alt={artwork.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {/* Vote button overlay */}
        <div className="absolute inset-0 z-20 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            onClick={handleVote}
            className={`
              font-body text-label tracking-wide px-5 py-2 border transition-all cursor-pointer
              ${voted
                ? 'bg-sage text-paper border-sage'
                : 'bg-paper/90 backdrop-blur-sm text-ink border-warm-gray/30 hover:bg-rust hover:text-paper hover:border-rust'
              }
            `}
          >
            {voted ? t('vote.votes', { count: voteCount }) : t('vote.vote')}
          </motion.button>
        </div>
      </div>
      <h4 className="font-display text-sm font-semibold text-ink leading-tight">{artwork.title}</h4>
      {artwork.artist_name && (
        <p className="font-body text-overline text-sepia-mid tracking-wide mt-0.5">
          {artwork.artist_name}
        </p>
      )}
      <div className="flex items-center gap-2 mt-1">
        <span className="font-mono text-[10px] text-sepia-mid">{voteCount}</span>
        <span className="font-body text-[10px] text-sepia-mid tracking-wider uppercase">
          {t('vote.votes', { count: 0 }).replace('0', '').trim()}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Vote Page ─── */

export default function Vote() {
  const { t } = useTranslation();
  const [voteError, setVoteError] = useState('');

  // Fetch featured artworks for voting
  const { data: artworksData, isLoading, error: queryError } = useQuery({
    queryKey: ['artworks-featured'],
    queryFn: async () => {
      const result = await artworksApi.getAll({ page_size: 12 });
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  const artworks: Artwork[] = useMemo(() => {
    return (artworksData?.items ?? []).slice(0, 12);
  }, [artworksData]);

  const handleVote = useCallback(async (artworkId: number) => {
    try {
      await artworksApi.vote(String(artworkId));
    } catch (err) {
      setVoteError(t('vote.error', '投票失败，请重试'));
      throw err; // Re-throw so ArtworkVoteCard can rollback optimistic state
    }
  }, [t]);

  return (
    <PageWrapper>
      {queryError && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 w-full">
          <div className="flex items-center gap-3 bg-rust/10 border border-rust/20 px-4 py-3 mt-4 mb-2">
            <p className="font-body text-body-sm text-rust flex-1">{t('vote.loadError', '加载作品失败，请刷新重试')}</p>
          </div>
        </div>
      )}
      {isLoading && (
        <SectionContainer noTopSpacing>
          <div className="py-24 text-center">
            <p className="font-body text-sepia-mid">{t('vote.loading', '加载中...')}</p>
          </div>
        </SectionContainer>
      )}
      {voteError && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 w-full">
          <div className="flex items-center gap-3 bg-rust/10 border border-rust/20 px-4 py-3 mt-4 mb-2">
            <p className="font-body text-body-sm text-rust flex-1">{voteError}</p>
            <button
              onClick={() => setVoteError('')}
              className="text-rust hover:text-rust-light cursor-pointer"
              aria-label={t('common.dismiss', 'Dismiss')}
            >
              &times;
            </button>
          </div>
        </div>
      )}
      {/* ═══ Hero Section ═══ */}
      <SectionContainer noTopSpacing>
        <div className="pt-6 pb-10">
          <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-2">
            {t('vote.overline')}
          </span>
          <h1 className="font-display text-[clamp(28px,4vw,48px)] font-bold text-ink leading-[1.05] tracking-[-0.02em] mb-3">
            {t('vote.title')}
          </h1>
          <p className="font-body text-body text-ink-faded leading-[1.7] max-w-2xl">
            {t('vote.subtitle')}
          </p>
        </div>
      </SectionContainer>

      {/* ═══ Artwork Voting Grid ═══ */}
      {artworks.length > 0 && (
        <SectionContainer>
          <div className="border-t border-warm-gray/20 pt-12 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {artworks.map((artwork, i) => (
                <ArtworkVoteCard
                  key={artwork.id}
                  artwork={artwork}
                  index={i}
                  onVote={handleVote}
                />
              ))}
            </div>
          </div>
        </SectionContainer>
      )}

      {/* ═══ Empty State ═══ */}
      {artworks.length === 0 && (
        <SectionContainer>
          <div className="border-t border-warm-gray/20 pt-12 pb-24 text-center">
            <p className="font-display text-lg text-ink-faded">
              {t('vote.empty')}
            </p>
          </div>
        </SectionContainer>
      )}

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
