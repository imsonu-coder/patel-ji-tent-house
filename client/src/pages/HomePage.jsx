
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Lightbulb,
  MapPin,
  Sparkles,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { quickStats, serviceHighlights } from '../data/siteData';
import GrandfatherWatermark from '../components/GrandfatherWatermark';
import ItemImage from '../components/ItemImage';
import { getItemCategoryName } from '../utils/itemImages';

export default function HomePage() {
  const { user } = useAuth();
  const [featuredItems, setFeaturedItems] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState('');

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setHomeError('');
        const [itemsResponse, galleryResponse] = await Promise.all([
          api.get('/items'),
          api.get('/gallery'),
        ]);

        setFeaturedItems(itemsResponse.data.slice(0, 3));
        setGallery(galleryResponse.data.slice(0, 3));
      } catch (error) {
        console.error('Error loading homepage data:', error);
        setHomeError('Some featured content could not be loaded. Please try again later.');
      } finally {
        setHomeLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="relative overflow-hidden bg-[#FFFDF9] text-[#33201D]">
      <GrandfatherWatermark className="hidden md:block" />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#FFF8ED]">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#F5D9A5]/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:py-24">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E9C77D] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7A2835]">
              <Sparkles size={15} className="text-[#C58A24]" />
              हर आयोजन को बनाएं यादगार
            </div>

            <h1 className="max-w-2xl font-[Playfair_Display] text-4xl font-bold leading-[1.15] text-[#45121C] sm:text-5xl lg:text-6xl">
              Your Celebration.
              <span className="mt-2 block text-[#B76A32]">
                Our Beautiful Arrangements.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-[#755D53] sm:text-lg">
              From elegant wedding tents to comfortable seating and beautiful
              decorations, let us help make your special occasions unforgettable.
            </p>

            {user?.role === 'admin' ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6B1E2B] px-7 py-4 font-semibold text-white shadow-lg transition hover:bg-[#45121C]"
                >
                  Go to Admin Operations Center
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/items"
                  className="inline-flex items-center justify-center rounded-full border border-[#B76A32] bg-white px-7 py-4 font-semibold text-[#6B1E2B] transition hover:bg-[#FFF0D9]"
                >
                  Manage Rental Collection
                </Link>
              </div>
            ) : (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/build-event"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6B1E2B] px-7 py-4 font-semibold text-white shadow-lg transition hover:bg-[#45121C]"
                >
                  Plan Your Event
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/items"
                  className="inline-flex items-center justify-center rounded-full border border-[#B76A32] bg-white px-7 py-4 font-semibold text-[#6B1E2B] transition hover:bg-[#FFF0D9]"
                >
                  Explore Our Collection
                </Link>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#755D53]">
              <div className="flex items-center gap-2">
                <Check size={17} className="text-[#B76A32]" />
                Thoughtful arrangements
              </div>
              <div className="flex items-center gap-2">
                <Check size={17} className="text-[#B76A32]" />
                Made for your occasion
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="absolute -right-3 -top-3 h-28 w-28 rounded-full border border-[#D7AD59]/60 sm:-right-5 sm:-top-5" />

            <div className="relative overflow-hidden rounded-[2rem] border-[6px] border-white bg-[#F5E2C5] shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85"
                alt="Beautiful wedding celebration and decoration"
                className="h-[340px] w-full object-cover sm:h-[460px] lg:h-[540px]"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#321016]/85 via-[#321016]/30 to-transparent p-6 pt-20 sm:p-8 sm:pt-24">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F6D68C]">
                  Your Special Day
                </p>
                <p className="mt-2 font-[Playfair_Display] text-2xl text-white sm:text-3xl">
                  Beautiful moments begin here.
                </p>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-2 h-20 w-20 rounded-full bg-[#E7B64C]/20 blur-2xl sm:-bottom-6 sm:-left-5" />
          </div>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="bg-[#F7EBDD] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-6 text-center shadow-soft transition hover:-translate-y-1"
              >
                <div className="mb-2 font-[Playfair_Display] text-3xl text-[#6B1E2B]">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold uppercase tracking-[0.12em] text-[#33201D]">
                  {stat.label}
                </div>
                <div className="mt-2 text-xs text-[#806C66]">
                  {stat.helper}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B76A32]">
            What We Offer
          </div>
          <h2 className="mt-3 font-[Playfair_Display] text-3xl text-[#45121C] sm:text-4xl">
            Everything for Your Event
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#806C66]">
            Thoughtfully arranged essentials to help make your special occasion
            beautiful, comfortable, and memorable.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {serviceHighlights.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-[#F0D7AF] bg-white p-6 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0D9] text-[#6B1E2B]">
                {service.icon === 'Tent' ? (
                  <Sparkles size={22} />
                ) : service.icon === 'Lightbulb' ? (
                  <Lightbulb size={22} />
                ) : service.icon === 'Chair' ? (
                  <CalendarDays size={22} />
                ) : (
                  <Star size={22} />
                )}
              </div>
              <h3 className="font-semibold text-[#45121C]">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#806C66]">
                {service.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CUSTOM EVENT CTA */}
      <section className="relative overflow-hidden bg-[#45121C] py-14 text-white sm:py-16">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#C79A3B]/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E7CC91]">
              Your Event, Your Choice
            </div>
            <h2 className="mt-3 font-[Playfair_Display] text-3xl sm:text-4xl">
              Build Your Event Your Way
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-[#F7EBDD]">
              Every celebration is different. Choose the items and arrangements
              you need instead of settling for a fixed package.
            </p>
          </div>

          <div className="lg:text-right">
            <Link
              to="/build-event"
              className="inline-flex items-center gap-2 rounded-full bg-[#E7B64C] px-7 py-4 font-semibold text-[#45121C] transition hover:bg-[#F5D58D]"
            >
              Start Building Your Event
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED RENTAL ITEMS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B76A32]">
              Our Collection
            </div>
            <h2 className="mt-3 font-[Playfair_Display] text-3xl text-[#45121C] sm:text-4xl">
              Popular Rental Essentials
            </h2>
            <p className="mt-3 text-[#806C66]">
              Explore items for your next celebration.
            </p>
          </div>

          <Link
            to="/items"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B1E2B] transition hover:text-[#B76A32]"
          >
            View All Items <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredItems.map((item) => (
            <div
              key={item._id}
              className="group overflow-hidden rounded-3xl border border-[#E7CC91] bg-[#FFFDF9] shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative overflow-hidden bg-[#F7EBDD]">
                <ItemImage
                  item={item}
                  alt={`${item.name} for rent`}
                  className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#321016]/30 via-transparent to-transparent" />
              </div>

              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B76A32]">
                  {getItemCategoryName(item.category)}
                </div>
                <h3 className="mt-3 font-[Playfair_Display] text-2xl text-[#45121C]">
                  {item.name}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#806C66]">
                  {item.description}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F0D7AF] pt-4">
                  <span className="font-semibold text-[#6B1E2B]">
                    Starting ₹{item.basePrice}
                  </span>
                  <Link
                    to={`/items/${item._id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#45121C] hover:text-[#B76A32]"
                  >
                    Details <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {homeLoading && <p role="status" className="rounded-2xl bg-[#FFF8ED] p-6 text-center text-[#604d47]">Loading featured items...</p>}
        {!homeLoading && homeError && (
          <p role="alert" className="rounded-2xl border border-[#d7aaa2] bg-[#fff3f0] p-6 text-center text-[#702721]">{homeError}</p>
        )}
        {!homeLoading && !homeError && featuredItems.length === 0 && (
          <p className="rounded-2xl bg-[#FFF8ED] p-6 text-center text-[#806C66]">
            Our featured items will appear here when available.
          </p>
        )}
      </section>

      {/* GALLERY */}
      <section className="relative overflow-hidden bg-[#FFF8ED] py-16 sm:py-20">
        <div className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-[#E7B64C]/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E7CC91] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A5527]">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#C79A3B]" />
              Celebrations we’ve adorned
            </div>
            <h2 className="mt-4 font-[Playfair_Display] text-3xl text-[#45121C] sm:text-4xl">
              A Glimpse of the Celebration
            </h2>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-[#755D53]">
              From graceful mandaps to joyful gatherings, discover the details
              that make every occasion feel unforgettable.
            </p>
          </div>

          {homeLoading ? (
            <p role="status" className="rounded-2xl border border-[#E7CC91] bg-white/80 px-6 py-10 text-center text-[#604d47]">Loading gallery...</p>
          ) : homeError ? (
            <p role="alert" className="rounded-2xl border border-[#d7aaa2] bg-[#fff3f0] px-6 py-8 text-center text-[#702721]">{homeError}</p>
          ) : gallery.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((image) => (
                <article
                  key={image._id}
                  className="group relative isolate aspect-[4/3] overflow-hidden rounded-2xl border border-[#E7CC91] bg-[#F7EBDD] shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <img
                    src={image.imageUrl}
                    alt={image.title || image.description || 'Wedding and event arrangement'}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#281015]/80 via-[#281015]/10 to-transparent opacity-90 transition duration-300 group-hover:opacity-100" />
                  {image.title && (
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                      <div className="mb-2 h-px w-9 bg-[#E7B64C]" />
                      <h3 className="font-[Playfair_Display] text-xl font-semibold text-white drop-shadow sm:text-2xl">
                        {image.title}
                      </h3>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-[#E7CC91] bg-white/80 px-6 py-10 text-center text-[#755D53] shadow-soft">
              Our celebration photos will be here soon. Please visit again to
              see the latest events.
            </p>
          )}

          <div className="mt-9 text-center">
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 rounded-full border border-[#6B1E2B] bg-[#6B1E2B] px-6 py-3 text-sm font-semibold text-white transition hover:border-[#45121C] hover:bg-[#45121C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C79A3B]"
            >
              View Full Gallery <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B76A32]">
            Easy Booking
          </div>
          <h2 className="mt-3 font-[Playfair_Display] text-3xl text-[#45121C] sm:text-4xl">
            Four Steps to Your Celebration
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            'Choose Your Date',
            'Select Your Items',
            'Submit Requirements',
            'We Check Availability',
            'Confirm Your Booking',
          ].map((step, index) => (
            <div
              key={step}
              className="rounded-2xl border border-[#F0D7AF] bg-[#FFFDF9] p-5 shadow-soft"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#6B1E2B] font-semibold text-white">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="font-semibold leading-6 text-[#45121C]">
                {step}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* LOCATION AND FINAL CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-[#F0D7AF] bg-[#F7EBDD] p-7 sm:p-9">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B76A32]">
              Our Service Area
            </div>
            <h2 className="mt-3 font-[Playfair_Display] text-3xl leading-tight text-[#45121C] sm:text-4xl">
              Bringing Celebrations to Life Across Jaipur
            </h2>
            <div className="mt-6 flex items-start gap-3 text-[#33201D]">
              <MapPin className="mt-1 shrink-0 text-[#6B1E2B]" />
              <span>Jaipur, Rajasthan</span>
            </div>
          </div>

          <div className="flex flex-col items-start justify-center rounded-3xl border border-[#F0D7AF] bg-white p-7 shadow-soft sm:p-9">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B76A32]">
              Let’s Get Started
            </div>
            <h3 className="mt-3 font-[Playfair_Display] text-3xl text-[#45121C]">
              Let’s Plan Something Beautiful.
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#806C66]">
              Tell us what you need, and start planning your next event.
            </p>
            <Link
              to="/build-event"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#6B1E2B] px-6 py-3 font-semibold text-white transition hover:bg-[#45121C]"
            >
              Plan Your Event <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
