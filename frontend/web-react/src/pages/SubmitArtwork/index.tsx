import { useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';

import { VintageInput } from '@/components/editorial/VintageInput';
import { artworksApi } from '@/services/artworks';
import { useAuthStore } from '@/stores/authStore';

export default function SubmitArtwork() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [childDisplayName, setChildDisplayName] = useState('');
  const [guardianConsent, setGuardianConsent] = useState(false);

  const mutation = useMutation({
    mutationFn: () => {
      if (!image) throw new Error('Image required');
      return artworksApi.create({
        title,
        image,
        description: description || undefined,
        child_display_name: childDisplayName || undefined,
        guardian_consent: childDisplayName ? String(guardianConsent) : undefined,
      });
    },
    onSuccess: () => navigate('/profile'),
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('submitArtwork.error', 'Submission failed — please retry');
      toast.error(msg);
    },
  });

  if (!isAuthenticated) {
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-24 text-center">

          <p className="font-body text-ink-faded mb-6">
            {t('submitArtwork.loginRequired', 'Please log in to submit artwork')}
          </p>
          <Link to="/login" className="font-body text-rust uppercase tracking-widest text-sm">
            {t('nav.login')} →
          </Link>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  const canSubmit = title.trim() && image && (!childDisplayName || guardianConsent);

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="py-16 md:py-24 relative">

        <SectionContainer>
          <h2 className="font-display text-h3 font-bold text-ink mb-8">
            {t('submitArtwork.title', 'Submit Artwork')}
          </h2>
          <p className="font-body text-body-sm text-ink-faded mt-2 mb-8">
            {t('submitArtwork.subtitle', 'Upload your child\'s artwork to participate in charity campaigns and voting')}
          </p>
          <form
            className="max-w-xl space-y-6 border border-warm-gray/30 p-6 md:p-8 bg-paper/90"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <VintageInput
              label={t('submitArtwork.titleLabel', 'Artwork Title *')}
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTitle(e.target.value)}
              required
            />
            <VintageInput
              type="textarea"
              label={t('submitArtwork.descriptionLabel', 'Artwork Description')}
              value={description}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDescription(e.target.value)}
            />

            {/* Image upload */}
            <div>
              <label className="font-body text-overline text-sepia-mid block mb-2">
                {t('submitArtwork.imageLabel', 'Upload Artwork Image *')}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                className="w-full font-body text-body-sm text-ink file:mr-4 file:py-2 file:px-4 file:border file:border-warm-gray/30 file:bg-transparent file:font-body file:text-sm file:cursor-pointer cursor-pointer"
              />
              {image && (
                <p className="font-body text-caption text-sepia-mid mt-2">{image.name}</p>
              )}
            </div>

            <VintageInput
              label={t('submitArtwork.childNameLabel', 'Young Artist Name (optional)')}
              value={childDisplayName}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setChildDisplayName(e.target.value)}
            />

            {childDisplayName && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardianConsent}
                  onChange={(e) => setGuardianConsent(e.target.checked)}
                  className="mt-1 cursor-pointer"
                />
                <span className="font-body text-body-sm text-ink-faded">
                  {t('submitArtwork.consentLabel', 'I confirm I have obtained guardian consent for this minor')}
                </span>
              </label>
            )}

            {mutation.isError && (
              <p className="font-body text-caption text-rust" role="alert">
                {t('submitArtwork.error', 'Submission failed — please try again later')}
              </p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || !canSubmit}
              className="w-full font-body text-body-sm tracking-[0.15em] uppercase py-4 bg-ink text-paper hover:bg-rust disabled:opacity-50 cursor-pointer"
            >
              {mutation.isPending ? t('common.loading', '...') : t('submitArtwork.submit', 'Submit Artwork')}
            </button>
          </form>
        </SectionContainer>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
