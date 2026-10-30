import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, Minus, Plus, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react';
import ItemImage from '../components/ItemImage';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { selectedItems, updateQuantity, removeItem, estimatedTotal } = useEvent();
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-3xl border border-[#D7B46B] bg-[#FFF8ED] p-8 shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#6B1E2B]/10 text-[#6B1E2B]">
            <ShieldCheck size={28} aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-[Playfair_Display] text-3xl font-bold text-[#45121C]">
            Admin Operations Center
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#755D53]">
            You are signed in as an <strong>Administrator</strong>. The shopping cart is reserved for client inquiries. To review incoming event requests and confirmed bookings, open the dashboard.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/admin"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#6B1E2B] px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-[#45121C]"
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              Open Admin Dashboard
            </Link>
            <Link
              to="/items"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#6B1E2B] px-6 py-2.5 text-sm font-semibold text-[#6B1E2B] transition hover:bg-[#FFF3E1]"
            >
              View Catalogue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A5527]">
          Your selections
        </div>
        <h1 className="mt-2 font-[Playfair_Display] text-4xl text-[#45121C] sm:text-5xl">
          My Cart
        </h1>
      </div>

      {selectedItems.length === 0 ? (
        <section className="rounded-3xl border border-[#E7CC91] bg-[#FFFDF9] px-5 py-12 text-center shadow-soft sm:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F7EBDD] text-[#6B1E2B]">
            <ShoppingCart size={28} aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-[Playfair_Display] text-3xl text-[#45121C]">
            Your event cart is empty
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#755D53]">
            Explore the rental collection and add the items you are considering for your event.
          </p>
          <Link
            to="/items"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#6B1E2B] px-6 py-3 font-semibold text-white transition hover:bg-[#45121C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B1E2B]"
          >
            Continue Shopping <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <>
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_21rem]">
            <section aria-label="Items in your event cart" className="space-y-4">
              {selectedItems.map((item) => (
                <article
                  key={item.itemId}
                  className="grid gap-4 rounded-2xl border border-[#E7CC91] bg-[#FFFDF9] p-4 shadow-soft sm:grid-cols-[9rem_1fr] sm:items-center sm:p-5"
                >
                  <ItemImage
                    item={{
                      _id: item.itemId,
                      name: item.name,
                      images: item.image ? [item.image] : [],
                    }}
                    alt={`${item.name} for your event`}
                    className="h-40 w-full rounded-xl bg-[#F7EBDD] object-cover sm:h-32"
                  />

                  <div className="min-w-0">
                    <h2 className="font-[Playfair_Display] text-2xl text-[#45121C]">
                      {item.name}
                    </h2>
                    <p className="mt-1 text-sm text-[#755D53]">
                      ₹{item.price} <span className="text-[#806C66]">per unit</span>
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#E7CC91] bg-white p-1">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name} quantity`}
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.itemId, -1)}
                          className="flex h-10 w-10 items-center justify-center rounded-full text-[#6B1E2B] transition hover:bg-[#F7EBDD] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus size={16} aria-hidden="true" />
                        </button>
                        <span className="min-w-8 text-center font-semibold tabular-nums text-[#33201D]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name} quantity`}
                          onClick={() => updateQuantity(item.itemId, 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-full text-[#6B1E2B] transition hover:bg-[#F7EBDD]"
                        >
                          <Plus size={16} aria-hidden="true" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="text-sm text-[#806C66]">
                          Subtotal{' '}
                          <span className="ml-1 font-semibold text-[#45121C]">
                            ₹{Number(item.price) * Number(item.quantity)}
                          </span>
                        </p>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name} from cart`}
                          onClick={() => removeItem(item.itemId)}
                          className="flex h-10 w-10 items-center justify-center rounded-full text-[#6B1E2B] transition hover:bg-[#FFF0ED] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B1E2B]"
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              <Link
                to="/items"
                className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-[#6B1E2B] transition hover:text-[#B76A32]"
              >
                Continue Shopping <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </section>

            <aside className="rounded-2xl border border-[#E7CC91] bg-[#FFF8ED] p-5 shadow-soft lg:sticky lg:top-28">
              <h2 className="font-[Playfair_Display] text-2xl text-[#45121C]">
                Event estimate
              </h2>
              <div className="mt-5 flex items-center justify-between border-t border-[#E7CC91] pt-4">
                <span className="text-sm text-[#755D53]">Estimated total</span>
                <span className="text-xl font-bold text-[#6B1E2B]">
                  ₹{estimatedTotal}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#806C66]">
                This is an estimate for selected items. Final pricing and availability will be reviewed by our team.
              </p>
              <Link
                to="/build-event"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#6B1E2B] px-5 py-3 text-center text-sm font-semibold text-white shadow-soft transition hover:bg-[#45121C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B1E2B]"
              >
                Continue to Build Your Event <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
