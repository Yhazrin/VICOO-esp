import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import BleedTitleBlock from '@/components/editorial/BleedTitleBlock';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import DonationPanel from '@/components/editorial/DonationPanel';
import ArtworkCard from '@/components/editorial/ArtworkCard';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import type { Campaign, Artwork } from '@/types';

const MOCK_CAMPAIGN: Campaign = {
  id: '1',
  title: 'Threads of Tomorrow',
  subtitle: 'Children from rural Guizhou reimagine what sustainable fashion means through watercolors and dreams.',
  description:
    "In the misty villages of Guizhou Province, children aged 6-12 are given watercolors and a simple prompt: \"Draw the clothes you wish existed.\" What emerges is a torrent of imagination — dresses that bloom with flowers, jackets that change color with the weather, shoes that carry you to the moon. This campaign collects their artwork and, with the help of sustainable textile partners, transforms select designs into real garments. Every purchase funds the next workshop, the next set of supplies, the next child's creative journey.",
  coverImageUrl:
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1400&h=600&fit=crop',
  startDate: '2026-01-15',
  endDate: '2026-06-30',
  status: 'active',
  artworkCount: 142,
  participantCount: 89,
  goalAmount: 50000,
  raisedAmount: 32500,
  featured: true,
};

const MOCK_ARTWORKS: Artwork[] = [
  {
    id: 'a1',
    title: 'The Garden That Grows Clothes',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=800&fit=crop',
    childParticipant: { id: 'c1', firstName: 'Mei', age: 8, guardianId: 'g1', consentGiven: true },
    status: 'featured',
    voteCount: 234,
    createdAt: '2026-01-20',
    tags: ['nature'],
  },
  {
    id: 'a2',
    title: 'Butterfly Factory',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=600&h=800&fit=crop',
    childParticipant: { id: 'c2', firstName: 'Jun', age: 7, guardianId: 'g2', consentGiven: true },
    status: 'approved',
    voteCount: 189,
    createdAt: '2026-01-22',
    tags: ['animals'],
  },
  {
    id: 'a3',
    title: 'Rain on My Umbrella Hat',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
    childParticipant: { id: 'c3', firstName: 'Lan', age: 9, guardianId: 'g3', consentGiven: true },
    status: 'approved',
    voteCount: 167,
    createdAt: '2026-01-25',
    tags: ['weather'],
  },
  {
    id: 'a4',
    title: 'Stars in My Pockets',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=800&fit=crop',
    childParticipant: { id: 'c4', firstName: 'Hao', age: 6, guardianId: 'g4', consentGiven: true },
    status: 'approved',
    voteCount: 145,
    createdAt: '2026-01-28',
    tags: ['space'],
  },
];

export default function CampaignDetail() {
  const { t } = useTranslation();
  const campaign = MOCK_CAMPAIGN;
  const progress = Math.round((campaign.raisedAmount / campaign.goalAmount) * 100);

  return (
    <PageWrapper>
      {/* Hero Image */}
      <section className="relative h-[50dvh] md:h-[60dvh]">
        <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-video" />
        <img
          src={campaign.coverImageUrl}
          alt={campaign.title}
          className="w-full h-full object-cover"
          style={{ filter: 'sepia(0.2) contrast(1.05) brightness(0.97)', opacity: 0, transition: 'opacity 0.3s' }}
          onLoad={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.opacity = '1';
            const skeleton = target.previousElementSibling as HTMLElement;
            if (skeleton) skeleton.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-[1400px] mx-auto">
            <span className="font-body text-overline tracking-[0.3em] uppercase text-pale-gold mb-3 block">
              {t(`campaigns.status.${campaign.status}`)} Campaign
            </span>
            <BleedTitleBlock>
              <span className="text-paper">{campaign.title}</span>
            </BleedTitleBlock>
          </div>
        </div>
      </section>

      {/* Content — asymmetric grid */}
      <PaperTextureBackground variant="paper" className="py-16 md:py-24">
        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
            {/* Main content */}
            <div className="md:col-span-7">
              <NumberedSectionHeading number="01" title="About This Campaign" />
              <p className="font-body text-body-sm text-ink-faded leading-[1.8] mb-6">
                {campaign.description}
              </p>

              <StoryQuoteBlock
                quote="I drew a dress that makes rain sounds when you walk. That way, everyone knows you're coming."
                author="Mei, age 8"
                role="Guizhou"
              />
            </div>

            {/* Sidebar — progress + donate */}
            <div className="md:col-span-4 md:col-start-9">
              <div className="sticky top-24 space-y-8">
                {/* Progress */}
                <div className="border border-warm-gray/30 p-6">
                  <div className="flex justify-between mb-3">
                    <span className="font-display text-3xl font-bold text-ink">{progress}%</span>
                    <span className="font-body text-caption text-sepia-mid self-end">
                      {t('campaigns.detail.progress')}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-warm-gray/30 rounded-sm overflow-hidden mb-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="h-full bg-archive-brown rounded-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="font-display text-xl text-ink">{campaign.participantCount}</p>
                      <p className="font-body text-overline text-sepia-mid tracking-wider uppercase">
                        {t('campaigns.detail.participants')}
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-xl text-ink">{campaign.artworkCount}</p>
                      <p className="font-body text-overline text-sepia-mid tracking-wider uppercase">
                        Artworks
                      </p>
                    </div>
                  </div>
                </div>

                {/* Donation */}
                <div>
                  <h3 className="font-body text-caption tracking-[0.15em] uppercase text-sepia-mid mb-4">
                    {t('campaigns.detail.donate')}
                  </h3>
                  <DonationPanel />
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      {/* Campaign Artworks */}
      <PaperTextureBackground variant="aged" className="py-16 md:py-24">
        <SectionContainer>
          <NumberedSectionHeading number="02" title={t('campaigns.detail.artworks')} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {MOCK_ARTWORKS.map((artwork, index) => (
              <ArtworkCard key={artwork.id} artwork={artwork} index={index} />
            ))}
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      {/* Back link */}
      <SectionContainer className="py-8">
        <Link
          to="/campaigns"
          className="font-body text-caption tracking-[0.15em] uppercase text-ink-faded hover:text-rust transition-colors"
        >
          &larr; {t('common.back')} to all campaigns
        </Link>
      </SectionContainer>
    </PageWrapper>
  );
}
