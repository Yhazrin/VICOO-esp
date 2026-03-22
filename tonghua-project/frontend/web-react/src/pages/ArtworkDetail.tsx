import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import { artworksApi } from '@/services/artworks';

export default function ArtworkDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const queryClient = useQueryClient();

  const { data: artwork, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['artwork', id],
    queryFn: () => artworksApi.getById(id!),
    enabled: !!id,
  });

  const voteMutation = useMutation({
    mutationFn: () => artworksApi.vote(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['artwork', id] }),
  });

  if (loading) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-16 md:py-24">
          <SectionContainer>
            <p className="font-body text-sepia-mid">{t('artwork.loading')}</p>
          </SectionContainer>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  if (queryError || !artwork) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-16 md:py-24">
          <SectionContainer>
            <div className="text-center" role="alert">
              <h1 className="font-display text-2xl text-ink mb-4">
                {t('artwork.notFound')}
              </h1>
              <Link
                to="/stories"
                className="font-body text-caption tracking-[0.15em] uppercase text-rust hover:text-ink transition-colors cursor-pointer"
              >
                &larr; {t('artwork.backToStories')}
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
      <PaperTextureBackground variant="paper" className="relative py-16 md:py-24">
        <SectionGrainOverlay opacity={0.03} />
        {/* Corner accents */}
        <div className="absolute top-6 left-6 w-12 h-12 border-t border-l border-warm-gray/20" />
        <div className="absolute top-6 right-6 w-12 h-12 border-t border-r border-warm-gray/20" />
        <div className="absolute bottom-6 left-6 w-12 h-12 border-b border-l border-warm-gray/20" />
        <div className="absolute bottom-6 right-6 w-12 h-12 border-b border-r border-warm-gray/20" />
        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
            {/* Image */}
            <div className="md:col-span-6">
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <SepiaImageFrame
                  src={artwork.image_url}
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
              <p className="font-body text-body-sm text-ink-faded leading-[1.8] mb-8">
                {artwork.description}
              </p>

              {/* Child participant info */}
              <div className="border border-warm-gray/30 p-4 mb-8">
                <p className="font-body text-caption text-sepia-mid tracking-wider uppercase mb-1">
                  {t('artwork.detail.artist')}
                </p>
                <p className="font-body text-caption text-ink-faded">
                  {artwork.childParticipant.firstName}, age {artwork.childParticipant.age}
                </p>
                {artwork.childParticipant.schoolName && (
                  <p className="font-body text-caption text-ink-faded mt-1">
                    {artwork.childParticipant.schoolName}
                  </p>
                )}
              </div>

              {/* Vote section */}
              <div className="mb-8">
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    onClick={() => voteMutation.mutate()}
                    className="flex-1 font-body text-body-sm tracking-[0.15em] uppercase py-4 bg-rust text-paper transition-colors hover:bg-archive-brown cursor-pointer"
                  >
                    {t('artwork.detail.vote')}
                  </motion.button>
                  <div className="flex items-center gap-2 text-sepia-mid">
                    <span className="font-body text-body-sm">{artwork.vote_count}</span>
                    <span className="font-body text-caption tracking-wider uppercase">
                      {t('artwork.detail.votes')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {artwork.tags && artwork.tags.length > 0 && (
                <div className="mb-8">
                  <p className="font-body text-caption tracking-wider uppercase text-sepia-mid mb-2">
                    {t('artwork.detail.tags')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {artwork.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-body text-caption px-3 py-1 border border-warm-gray/50 text-sepia-mid"
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
          className="font-body text-caption tracking-[0.15em] uppercase text-ink-faded hover:text-rust transition-colors cursor-pointer"
        >
          &larr; {t('artwork.backToStories')}
        </Link>
      </SectionContainer>
    </PageWrapper>
  );
}
