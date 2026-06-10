import { createPortal } from 'react-dom';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { TraceMediaItem } from '@/types';
import { resolveMediaUrl } from '@/utils/mediaUrl';

function youtubeEmbedUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function MediaBlock({ item, compact }: { item: TraceMediaItem; compact?: boolean }) {
  const { t } = useTranslation();
  const yt = item.type === 'video' ? youtubeEmbedUrl(item.url) : null;
  const videoTitle = item.caption?.trim() || t('traceability.mediaVideoTitle');

  if (item.type === 'image') {
    return (
      <figure className={compact ? 'space-y-1' : 'space-y-2'}>
        <img
          src={resolveMediaUrl(item.url)}
          alt={item.caption || 'Traceability media'}
          className={`w-full rounded-sm border border-warm-gray/20 object-cover bg-aged-stock ${
            compact ? 'max-h-28' : 'max-h-48'
          }`}
          loading="lazy"
        />
        {item.caption && (
          <figcaption className="font-body text-[10px] text-ink-faded leading-snug">{item.caption}</figcaption>
        )}
      </figure>
    );
  }

  if (yt) {
    return (
      <figure className={compact ? 'space-y-1' : 'space-y-2'}>
        <div
          className={`relative w-full overflow-hidden rounded-sm border border-warm-gray/25 bg-ink/5 ${
            compact ? 'aspect-video max-h-36' : 'aspect-video'
          }`}
        >
          <iframe
            title={videoTitle}
            src={yt}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {item.caption && (
          <figcaption className="font-body text-[10px] text-ink-faded leading-snug">{item.caption}</figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className={compact ? 'space-y-1' : 'space-y-2'}>
      <video
        src={resolveMediaUrl(item.url)}
        controls
        playsInline
        className={`w-full rounded-sm border border-warm-gray/20 bg-ink ${compact ? 'max-h-36' : 'max-h-52'}`}
      />
      {item.caption && (
        <figcaption className="font-body text-[10px] text-ink-faded leading-snug">{item.caption}</figcaption>
      )}
    </figure>
  );
}

/** Image lightbox modal — portal to document root, fixed overlay */
function ImageLightbox({
  src,
  alt,
  caption,
  onClose,
}: {
  src: string;
  alt?: string;
  caption?: string;
  onClose: () => void;
}) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.85 }}
        className="relative max-w-3xl max-h-[85vh] w-full overflow-hidden"
        style={{
          borderRadius: 24,
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(40px) saturate(1.7)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.7)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.img
          src={src}
          alt={alt || ''}
          className="w-full h-full object-contain"
          style={{ maxHeight: '80vh' }}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.05 }}
        />
        <motion.button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9, rotate: 90 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </motion.button>
        {caption && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 px-6 py-4"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-body text-sm text-white/90">{caption}</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}

/** Horizontal media strip — consistent height, scrollable, no scrollbar */
function HorizontalMediaStrip({
  items,
  className = '',
}: {
  items: TraceMediaItem[];
  className?: string;
}) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string>('');

  return (
    <>
      <div
        className={`flex gap-2 overflow-x-auto scrollbar-none ${className}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, i) =>
          item.type === 'image' ? (
            <div
              key={`${item.url}-${i}`}
              className="flex-shrink-0 h-20 w-auto self-start cursor-pointer overflow-hidden rounded-sm"
              onClick={() => {
                setLightboxSrc(resolveMediaUrl(item.url));
                setLightboxCaption(item.caption || '');
              }}
            >
              <img
                src={resolveMediaUrl(item.url)}
                alt={item.caption || ''}
                className="h-full w-auto max-w-none object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </div>
          ) : (
            <div key={`${item.url}-${i}`} className="flex-shrink-0 h-20 w-auto self-start">
              <video
                src={resolveMediaUrl(item.url)}
                controls
                playsInline
                className="h-full w-auto max-w-none rounded-sm border border-warm-gray/20 bg-ink object-cover"
              />
            </div>
          )
        )}
      </div>

      <AnimatePresence>
        {lightboxSrc && (
          <ImageLightbox
            src={lightboxSrc}
            alt=""
            caption={lightboxCaption}
            onClose={() => setLightboxSrc(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function TraceMediaGallery({
  items,
  compact,
  className = '',
  horizontal = false,
}: {
  items: TraceMediaItem[];
  compact?: boolean;
  className?: string;
  /** 水平滚动模式：溢出可滚动但隐藏滚动条 */
  horizontal?: boolean;
}) {
  const valid = useMemo(() => items.filter((i) => i.url?.trim()), [items]);
  if (valid.length === 0) return null;

  if (horizontal) {
    return <HorizontalMediaStrip items={valid} className={className} />;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {valid.map((item, i) => (
        <MediaBlock key={`${item.url}-${i}`} item={item} compact={compact} />
      ))}
    </div>
  );
}
