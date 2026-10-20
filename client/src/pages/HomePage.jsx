import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Lightbulb, MapPin, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { quickStats, serviceHighlights } from '../data/siteData';
import GrandfatherWatermark from '../components/GrandfatherWatermark';

export default function HomePage() {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [itemsResponse, galleryResponse] = await Promise.all([
          api.get('/items'),
          api.get('/gallery')
        ]);
        setFeaturedItems(itemsResponse.data.slice(0, 3));
        setGallery(galleryResponse.data.slice(0, 3));
      } catch (error) {
        console.error(error);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="relative overflow-hidden bg-[#FFFDF9] text-[#33201D]">
      <GrandfatherWatermark className="hidden md:block" />
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative z-10">
            <div className="mb-4 inline-flex rounded-full border border-[#E7CC91] bg-[#F7EBDD] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#6B1E2B]">
              हर आयोजन को बनाएं यादगार
            </div>
            <h1 className="font-[Playfair_Display] text-4xl leading-tight text-[#33201D] md:text-6xl">
              Make Every Celebration Memorable
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[#806C66]">
              Quality tents, furniture, decoration and event arrangements for your special occasions.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/build-event" className="rounded-full bg-[#6B1E2B] px-6 py-3 font-semibold text-white shadow-soft hover:bg-[#45121C]">
                Build Your Event
              </Link>
              <Link to="/items" className="rounded-full border border-[#6B1E2B] px-6 py-3 font-semibold text-[#6B1E2B]">
                Explore Our Items
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-[#806C66]">
              <div className="flex items-center gap-2"><Star size={18} className="text-[#C79A3B]" /> Family-led service</div>
              <div className="flex items-center gap-2"><Check size={18} className="text-[#C79A3B]" /> Trusted event setup</div>
            </div>
          </div>
          <div className="relative z-10">
            <div className="overflow-hidden rounded-[2rem] border border-[#F0D7AF] bg-white p-4 shadow-soft">
              <img
                src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80"
                alt="Wedding event setup"
                className="h-[500px] w-full rounded-[1.4rem] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7EBDD] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-4">
            {quickStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-6 text-center shadow-soft">
                <div className="mb-2 font-[Playfair_Display] text-3xl text-[#6B1E2B]">{stat.value}</div>
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#33201D]">{stat.label}</div>
                <div className="mt-2 text-xs text-[#806C66]">{stat.helper}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Our Services</div>
          <h2 className="mt-2 font-[Playfair_Display] text-4xl text-[#33201D]">Everything for your event</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-5">
          {serviceHighlights.map((service) => (
            <div key={service.title} className="rounded-2xl border border-[#F0D7AF] bg-white p-6 text-center shadow-soft">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F7EBDD] text-[#6B1E2B]">
                {service.icon === 'Tent' ? <Sparkles size={18} /> : service.icon === 'Lightbulb' ? <Lightbulb size={18} /> : service.icon === 'Chair' ? <CalendarDays size={18} /> : <Star size={18} />}
              </div>
              <h3 className="font-semibold text-[#33201D]">{service.title}</h3>
              <p className="mt-2 text-sm text-[#806C66]">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#45121C] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[#E7CC91]">Build your event</div>
              <h2 className="mt-3 font-[Playfair_Display] text-4xl">Build Your Event Your Way</h2>
              <p className="mt-4 max-w-xl text-[#F7EBDD]">
                Don&apos;t choose a fixed package. Tell us exactly what you need.
              </p>
            </div>
            <div className="flex justify-end">
              <Link to="/build-event" className="rounded-full bg-[#C79A3B] px-6 py-3 font-semibold text-[#45121C]">
                Start Building Your Event
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Featured items</div>
            <h2 className="mt-2 font-[Playfair_Display] text-4xl">Popular rental essentials</h2>
          </div>
          <Link to="/items" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B1E2B]">
            View all items <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredItems.map((item) => (
            <div key={item._id} className="overflow-hidden rounded-2xl border border-[#F0D7AF] bg-white shadow-soft">
              <img src={item.images?.[0]} alt={item.name} className="h-56 w-full object-cover" />
              <div className="p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-[#6B1E2B]">{item.category?.name || item.category}</div>
                <h3 className="mt-3 font-[Playfair_Display] text-2xl">{item.name}</h3>
                <p className="mt-2 text-sm text-[#806C66]">{item.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-semibold text-[#6B1E2B]">Starting ₹{item.basePrice}</span>
                  <Link to={`/items/${item._id}`} className="text-sm font-semibold text-[#33201D]">Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#F7EBDD] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Gallery preview</div>
            <h2 className="mt-2 font-[Playfair_Display] text-4xl text-[#33201D]">Recent event moments</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {gallery.map((image) => (
              <div key={image._id} className="overflow-hidden rounded-2xl border border-[#F0D7AF] bg-white shadow-soft">
                <img src={image.imageUrl} alt={image.title} className="h-72 w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">How it works</div>
          <h2 className="mt-2 font-[Playfair_Display] text-4xl text-[#33201D]">Simple planning flow</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-5">
          {['Choose Date', 'Choose Items', 'Submit Requirement', 'We Check & Arrange', 'Confirm Booking'].map((step, index) => (
            <div key={step} className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-5 shadow-soft">
              <div className="mb-3 text-sm font-semibold text-[#C79A3B]">0{index + 1}</div>
              <div className="font-semibold text-[#33201D]">{step}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-[#F7EBDD] p-8 border border-[#F0D7AF]">
            <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Location</div>
            <h2 className="mt-2 font-[Playfair_Display] text-4xl">Serving your celebration across Jaipur</h2>
            <div className="mt-6 flex items-center gap-3 text-[#33201D]">
              <MapPin className="text-[#6B1E2B]" />
              Demo service area: Jaipur, Rajasthan
            </div>
          </div>
          <div className="rounded-3xl border border-[#F0D7AF] bg-white p-8 shadow-soft">
            <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">Ready to plan?</div>
            <h3 className="mt-2 font-[Playfair_Display] text-3xl text-[#33201D]">Let&apos;s build your perfect event.</h3>
            <Link to="/build-event" className="mt-6 inline-flex rounded-full bg-[#6B1E2B] px-5 py-3 font-semibold text-white">
              Start your requirement
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
