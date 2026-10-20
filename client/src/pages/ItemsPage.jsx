import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import api from '../api/client';
import { useEvent } from '../context/EventContext';

const categories = ['All', 'Tents', 'Furniture', 'Lighting', 'Decoration', 'Stage', 'Catering', 'Other'];

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const { addItem } = useEvent();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/items');
        setItems(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    let nextItems = [...items];

    
if (selectedCategory !== 'All') {
  
const categoryAliases = {
  Tents: ['tent', 'canopies'],
  Furniture: ['furniture'],
  Lighting: ['lighting'],
  Decoration: ['lighting', 'decoration', 'decor'],
  Stage: ['stage'],
  Catering: ['catering'],
  Other: ['other'],
};


  const keywords = categoryAliases[selectedCategory] || [
    selectedCategory.toLowerCase(),
  ];

  nextItems = nextItems.filter((item) => {
    const categoryName =
      typeof item.category === 'object'
        ? item.category?.name || ''
        : item.category || '';

    const normalizedName = categoryName.toLowerCase();

    return keywords.some((keyword) =>
      normalizedName.includes(keyword)
    );
  });
}


    if (search) {
      nextItems = nextItems.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    nextItems.sort((a, b) => {
      if (sort === 'low-high') return a.basePrice - b.basePrice;
      if (sort === 'high-low') return b.basePrice - a.basePrice;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return nextItems;
  }, [items, selectedCategory, search, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Catalogue</div>
          <h1 className="mt-2 font-[Playfair_Display] text-4xl text-[#33201D]">Items Catalogue</h1>
        </div>
      </div>

      <div className="mb-8 grid gap-4 rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-4 shadow-soft md:grid-cols-[1.2fr_1fr_auto]">
        <div className="flex items-center gap-3 rounded-full border border-[#E7CC91] bg-white px-4 py-3">
          <Search size={18} className="text-[#6B1E2B]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." className="w-full border-0 bg-transparent outline-none" />
        </div>
        <div className="flex items-center gap-3 rounded-full border border-[#E7CC91] bg-white px-4 py-3">
          <SlidersHorizontal size={18} className="text-[#6B1E2B]" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full bg-transparent outline-none">
            <option value="newest">Newest</option>
            <option value="low-high">Price: Low to High</option>
            <option value="high-low">Price: High to Low</option>
          </select>
        </div>
        <div className="rounded-full bg-[#6B1E2B] px-4 py-3 text-center text-sm font-semibold text-white">
          {filteredItems.length} Items
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              selectedCategory === category ? 'border-[#6B1E2B] bg-[#6B1E2B] text-white' : 'border-[#E7CC91] bg-[#FFFDF9] text-[#33201D]'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#806C66]">Loading items...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center text-[#806C66]">No items found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <ItemCard key={item._id} item={item} onAdd={addItem} />
          ))}
        </div>
      )}
    </div>
  );
}
