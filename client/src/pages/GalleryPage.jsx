import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import api from '../api/client';

const categories = ['All', 'Weddings', 'Tents', 'Decoration', 'Lighting', 'Furniture', 'Other'];

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const { data } = await api.get('/gallery');
        setImages(data);
      } catch (error) {
        console.error('Failed to load gallery:', error);
        setError('Gallery photos could not be loaded. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, []);

  useEffect(() => {
    if (!selected) return undefined;
    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelected(null);
      if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      previousFocusRef.current?.focus?.();
    };
  }, [selected]);

  const filteredImages = category === 'All' ? images : images.filter((image) => image.category === category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Gallery</div>
        <h1 className="mt-2 font-[Playfair_Display] text-5xl text-[#33201D]">Our event portfolio</h1>
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-3">
        {categories.map((item) => (
          <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-medium ${category === item ? 'bg-[#6B1E2B] text-white' : 'bg-[#F7EBDD] text-[#33201D]'}`}>
            {item}
          </button>
        ))}
      </div>
      {loading && <p role="status" className="mb-6 text-center text-[#604d47]">Loading gallery...</p>}
      {!loading && error && <p role="alert" className="mb-6 rounded-2xl border border-[#d7aaa2] bg-[#fff3f0] p-5 text-center text-[#702721]">{error}</p>}
      {!loading && !error && filteredImages.length === 0 && (
        <p className="mb-6 rounded-2xl border border-[#e6d3ad] bg-[#fff8ed] p-8 text-center text-[#604d47]">
          No photos found in this category yet.
        </p>
      )}

      {!loading && !error && <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filteredImages.map((image) => (
          <button key={image._id} onClick={() => setSelected(image)} className="overflow-hidden rounded-2xl border border-[#F0D7AF] bg-white text-left shadow-soft">
            <img
              src={image.imageUrl}
              alt={image.title || 'Event arrangement'}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80';
              }}
              className="h-72 w-full object-cover transition duration-300 hover:scale-105"
            />
            <div className="p-4">
              <div className="font-semibold text-[#33201D]">{image.title}</div>
              <div className="mt-1 text-sm text-[#806C66]">{image.category}</div>
            </div>
          </button>
        ))}
      </div>}

      {selected && (
        <div
          onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#241014]/85 p-4 sm:p-6"
        >
          <section role="dialog" aria-modal="true" aria-labelledby="gallery-dialog-title" className="relative max-h-[92vh] w-full max-w-4xl overflow-auto rounded-3xl bg-[#fffdf9]">
            <button ref={closeButtonRef} type="button" onClick={() => setSelected(null)} aria-label="Close photo" className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#45121C] shadow-lg">
              <X size={20} aria-hidden="true" />
            </button>
            <img src={selected.imageUrl} alt={selected.title || 'Event arrangement'} className="max-h-[70vh] w-full object-cover" />
            <div className="p-5 sm:p-7">
              <h2 id="gallery-dialog-title" className="font-[Playfair_Display] text-3xl text-[#33201D]">{selected.title || 'Event arrangement'}</h2>
              <p className="mt-2 text-sm text-[#806C66]">{selected.description}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
