import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import PaginationControls from '../components/PaginationControls';
import api from '../api/client';
import { useEvent } from '../context/EventContext';

const categories = ['All', 'Tents', 'Furniture', 'Lighting', 'Decoration', 'Stage', 'Catering', 'Other'];

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { addItem } = useEvent();


  useEffect(() => {
    let cancelled = false;
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError('');
        const params = {
          page,
          pageSize
        };
        if (selectedCategory !== 'All') {
          params.category = selectedCategory;
        }
        if (search.trim()) {
          params.search = search.trim();
        }

        const response = await api.get('/items', { params });
        if (!cancelled) {
          const rawTotal = response.headers['x-total-count'];
          const rawPages = response.headers['x-total-pages'];
          const totalCount = rawTotal ? Number(rawTotal) : response.data.length;
          const pagesCount = rawPages ? Number(rawPages) : Math.ceil(totalCount / pageSize);

          setItems(response.data);
          setTotalItems(totalCount);
          setTotalPages(pagesCount || 1);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError('Items could not be loaded. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, selectedCategory, search]);

  const sortedItems = useMemo(() => {
    const nextItems = [...items];
    nextItems.sort((a, b) => {
      if (sort === 'low-high') return a.basePrice - b.basePrice;
      if (sort === 'high-low') return b.basePrice - a.basePrice;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return nextItems;
  }, [items, sort]);

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
          <label className="sr-only" htmlFor="catalogue-search">Search items</label>
          <input
            id="catalogue-search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search items..."
            className="w-full border-0 bg-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-3 rounded-full border border-[#E7CC91] bg-white px-4 py-3">
          <SlidersHorizontal size={18} className="text-[#6B1E2B]" />
          <label className="sr-only" htmlFor="catalogue-sort">Sort items</label>
          <select
            id="catalogue-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full bg-transparent outline-none"
          >
            <option value="newest">Newest</option>
            <option value="low-high">Price: Low to High</option>
            <option value="high-low">Price: High to Low</option>
          </select>
        </div>
        <div className="rounded-full bg-[#6B1E2B] px-4 py-3 text-center text-sm font-semibold text-white">
          {totalItems} Items
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => { setSelectedCategory(category); setPage(1); }}
            aria-pressed={selectedCategory === category}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === category
                ? 'border-[#6B1E2B] bg-[#6B1E2B] text-white'
                : 'border-[#E7CC91] bg-[#FFFDF9] text-[#33201D] hover:bg-[#FDF9F3]'
              }`}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div role="status" className="py-20 text-center text-[#604d47]">Loading items...</div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-[#d7aaa2] bg-[#fff3f0] p-6 text-center text-[#702721]">{error}</div>
      ) : sortedItems.length === 0 ? (
        <div className="py-20 text-center text-[#806C66]">No items found.</div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sortedItems.map((item) => (
              <ItemCard key={item._id} item={item} onAdd={addItem} />
            ))}
          </div>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            className="mt-8"
          />
        </>
      )}
    </div>
  );
}
