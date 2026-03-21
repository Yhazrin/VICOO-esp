import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import { artworksApi } from '@/services/artworks';
import type { Artwork } from '@/types';

export default function ArtworkDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load artwork data
  if (loading && id) {
    artworksApi
      .getById(id)
      .then((data) => {
        setArtwork(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load artwork');
        setLoading(false);
      });
  }

  const handleVote = async () => {
    if (!id) return;
    try {
      const result = await artworksApi.vote(id);
      setArtwork((prev) => prev ? { ...prev, voteCount: result.voteCount } : null);
    } catch (err) {
      console.error('Failed to vote', err);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-16 md:py-24">
          <SectionContainer>
            <p className="font-body text-sepia-mid">Loading...</p>
          </SectionContainer>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  if (error || !artwork) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-16 md:py-24">
          <SectionContainer>
            <div className="text-center">
              <h1 className="font-display text-2xl text-ink mb-4">
                Artwork not found
              </h1>
              <Link
                to="/stories"
                className="font-body text-xs tracking-[0.15em] uppercase text-rust hover:text-ink transition-colors"
              >
                &larr; Back to Stories
              </Link>
            </div>
          </SectionContainer>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Artwork section */}
      <PaperTextureBackground variant="paper" className="py-16 md:py-24">
        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
            {/* Image */}
            <div className="md:col-span-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <SepiaImageFrame
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  aspectRatio="square"
                  size="full"
                />
              </motion.div>
            </div>

            {/* Details */}
            <div className="md:col-span-5 md:col-start-8">
              <p className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid mb-2">
                {t('artwork.detail.heading')}
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-ink font-bold leading-tight mb-4">
                {artwork.title}
              </h1>
              <p className="font-body text-sm text-ink-faded leading-[1.8] mb-8">
                {artwork.description}
              </p>

              {/* Child participant info */}
              <div className="border border-warm-gray/30 p-4 mb-8">
                <p className="font-body text-xs text-sepia-mid tracking-wider uppercase mb-1">
                  {t('artwork.detail.artist')}
                </p>
                <p className="font-body text-xs text-ink-faded">
                  {artwork.childParticipant.firstName}, age {artwork.childParticipant.age}
                </p>
                {artwork.childParticipant.schoolName && (
                  <p className="font-body text-xs text-ink-faded mt-1">
                    {artwork.childParticipant.schoolName}
                  </p>
                )}
              </div>

              {/* Vote section */}
              <div className="mb-8">
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVote}
                    className="flex-1 font-body text-sm tracking-[0.15em] uppercase py-4 bg-rust text-paper transition-colors hover:bg-archive-brown"
                  >
                    {t('artwork.detail.vote')}
                  </motion.button>
                  <div className="flex items-center gap-2 text-sepia-mid">
                    <span className="font-body text-sm">{artwork.voteCount}</span>
                    <span className="font-body text-xs tracking-wider uppercase">
                      {t('artwork.detail.votes')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {artwork.tags && artwork.tags.length > 0 && (
                <div className="mb-8">
                  <p className="font-body text-xs tracking-wider uppercase text-sepia-mid mb-2">
                    {t('artwork.detail.tags')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {artwork.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="font-body text-xs px-3 py-1 border border-warm-gray/50 text-sepia-mid"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      {/* Back link */}
      <SectionContainer className="py-8">
        <Link
          to="/stories"
          className="font-body text-xs tracking-[0.15em] uppercase text-ink-faded hover:text-rust transition-colors"
        >
          &larr; {t('common.back')} to Stories
        </Link>
      </SectionContainer>
    </PageWrapper>
  );
}
