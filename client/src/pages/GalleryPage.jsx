import { useEffect, useState } from 'react';
import api from '../api/client';

const categories = ['All', 'Weddings', 'Tents', 'Decoration', 'Lighting', 'Furniture', 'Other'];

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const fetchGallery = async () => {
      const { data } = await api.get('/gallery');
      setImages(data);
    };
    fetchGallery();
  }, []);

  const filteredImages = category === 'All' ? images : images.filter((image) => image.category === category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Gallery</div>
        <h1 className="mt-2 font-[Playfair_Display] text-5xl text-[#33201D]">Our event portfolio</h1>
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-3">
        {categories.map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-medium ${category === item ? 'bg-[#6B1E2B] text-white' : 'bg-[#F7EBDD] text-[#33201D]'}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredImages.map((image) => (
          <button key={image._id} onClick={() => setSelected(image)} className="overflow-hidden rounded-2xl border border-[#F0D7AF] bg-white text-left shadow-soft">
            <img src={image.imageUrl} alt={image.title} className="h-72 w-full object-cover" />
            <div className="p-4">
              <div className="font-semibold text-[#33201D]">{image.title}</div>
              <div className="mt-1 text-sm text-[#806C66]">{image.category}</div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-[#45121C]/80 p-6">
          <div className="max-w-3xl overflow-hidden rounded-3xl bg-white">
            <img src={selected.imageUrl} alt={selected.title} className="max-h-[70vh] w-full object-cover" />
            <div className="p-5">
              <div className="font-[Playfair_Display] text-3xl text-[#33201D]">{selected.title}</div>
              <p className="mt-2 text-sm text-[#806C66]">{selected.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
