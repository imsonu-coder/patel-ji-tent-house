import { useState } from 'react';
import { getItemImageSources } from '../utils/itemImages';

export default function ItemImage({ item, alt, className = '' }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = getItemImageSources(item);
  const source = sources[sourceIndex];

  if (!source) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-[#F7EBDD] px-4 text-center text-sm text-[#806C66] ${className}`}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={alt}
      loading="lazy"
      onError={() => setSourceIndex((current) => current + 1)}
      className={className}
    />
  );
}
