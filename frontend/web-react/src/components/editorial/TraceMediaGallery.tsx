import { useMemo } from 'react';
import type { TraceMediaItem } from '@/types';
import { resolveMediaUrl } from '@/utils/mediaUrl';

function youtubeEmbedUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function MediaBlock({ item, compact }: { item: TraceMediaItem; compact?: boolean }) {
  const yt = item.type === 'video' ? youtubeEmbedUrl(item.url) : null;

  if (item.type === 'image') {
    return (
      <figure className={compact ? 'space-y-1' : 'space-y-2'}>
        <img
          src={resolveMediaUrl(item.url)}
          alt={item.caption || ''}
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
            title={item.caption || 'video'}
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

export default function TraceMediaGallery({
  items,
  compact,
  className = '',
}: {
  items: TraceMediaItem[];
  compact?: boolean;
  className?: string;
}) {
  const valid = useMemo(() => items.filter((i) => i.url?.trim()), [items]);
  if (valid.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {valid.map((item, i) => (
        <MediaBlock key={`${item.url}-${i}`} item={item} compact={compact} />
      ))}
    </div>
  );
}
