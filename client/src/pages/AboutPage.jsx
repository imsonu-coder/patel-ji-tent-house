import GrandfatherWatermark from '../components/GrandfatherWatermark';

export default function AboutPage() {
  return (
    <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <GrandfatherWatermark className="hidden md:block" />
      <div className="relative z-10">
        <div className="mb-10 text-center">
          <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">About us</div>
          <h1 className="mt-2 font-[Playfair_Display] text-5xl text-[#33201D]">About Patel Ji Tent House</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#F0D7AF] bg-[#FFFDF9] p-8 shadow-soft">
            <h2 className="font-[Playfair_Display] text-3xl text-[#33201D]">Our Story</h2>
            <p className="mt-4 text-[#806C66]">
              Patel Ji Tent House is a local family-run event and rental business focused on weddings, festive events and family celebrations. We work closely with families to create warm, elegant and practical event setups tailored to their needs.
            </p>
            <p className="mt-4 text-[#806C66]">
              Founded in Jaipur, Patel Ji Tent House has delivered premium event infrastructure for over 15 years, orchestrating everything from royal Rajputana wedding mandaps and luxury marquees to large-scale cultural and corporate gatherings across Rajasthan.
            </p>
          </div>
          <div className="rounded-3xl border border-[#F0D7AF] bg-[#F7EBDD] p-8 shadow-soft">
            <h2 className="font-[Playfair_Display] text-3xl text-[#33201D]">Our Services</h2>
            <ul className="mt-4 space-y-2 text-[#33201D]">
              <li>• Tent and canopy rental</li>
              <li>• Wedding and banquet furniture</li>
              <li>• Lighting and decor</li>
              <li>• Stage and mandap support</li>
              <li>• Event setup and coordination</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[#F0D7AF] bg-white p-6 shadow-soft">
            <h3 className="font-[Playfair_Display] text-2xl text-[#33201D]">Why choose us</h3>
            <p className="mt-3 text-[#806C66]">Warm family support, practical planning and flexible arrangements for special occasions.</p>
          </div>
          <div className="rounded-2xl border border-[#F0D7AF] bg-white p-6 shadow-soft">
            <h3 className="font-[Playfair_Display] text-2xl text-[#33201D]">Our work</h3>
            <p className="mt-3 text-[#806C66]">From intimate family functions to larger wedding arrangements, we help create memorable setups.</p>
          </div>
          <div className="rounded-2xl border border-[#F0D7AF] bg-white p-6 shadow-soft">
            <h3 className="font-[Playfair_Display] text-2xl text-[#33201D]">Family heritage</h3>
            <p className="mt-3 text-[#806C66]">A local business built with care, trust and long-term relationships in the community.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
