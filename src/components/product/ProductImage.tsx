import { memo, useState } from 'react';
import { cn } from '../../lib/format';
import { PackIllustration, type PackPalette, type PackShape } from './PackIllustration';

/** Remembers URLs that 404'd so we don't re-request them on every render/mount. */
const missing = new Set<string>();

interface Props {
  /** Candidate image URLs under /public, tried in order. */
  sources: string[];
  alt: string;
  shape: PackShape;
  name: string;
  sublabel?: string;
  palette?: PackPalette;
  unprinted?: boolean;
  className?: string;
  imgClassName?: string;
  /** Eager-load for above-the-fold images. */
  priority?: boolean;
}

/**
 * Shows a real product photo when the file exists in /public/products, otherwise an illustrated pack.
 * Dropping a correctly-named PNG into the folder replaces the placeholder automatically.
 */
export const ProductImage = memo(function ProductImage({ sources, alt, shape, name, sublabel, palette, unprinted, className, imgClassName, priority }: Props) {
  const [failed, setFailed] = useState(0);
  const candidates = sources.filter((s) => !missing.has(s));
  const src = candidates[failed];

  return (
    <div className={className}>
      {src ? (
        <img
          key={src}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn('size-full object-contain', imgClassName)}
          onError={() => {
            missing.add(src);
            setFailed((f) => f + 1);
          }}
        />
      ) : (
        <PackIllustration shape={shape} name={name} sublabel={sublabel} palette={palette} unprinted={unprinted} title={alt} className="size-full" />
      )}
    </div>
  );
});

export const categoryImage = (categorySlug: string): string => `/products/${categorySlug}.png`;
export const itemImage = (itemSlug: string): string => `/products/items/${itemSlug}.png`;
