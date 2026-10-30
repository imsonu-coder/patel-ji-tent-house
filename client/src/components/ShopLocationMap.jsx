import { MapPin, Navigation } from 'lucide-react';

export default function ShopLocationMap() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0D7AF] bg-[#FFF8ED]">
      <div className="relative h-[300px] w-full bg-[#33201D] p-6 text-white overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#D7B46B_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 flex h-full flex-col justify-between rounded-xl border border-white/10 bg-[#45121C]/85 p-6 backdrop-blur-md">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6B1E2B] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#E7CC91]">
                <MapPin size={13} /> Main Warehouse & Office
              </span>
              <h3 className="mt-3 font-[Playfair_Display] text-2xl font-bold text-white">
                Mansarovar, Jaipur
              </h3>
              <p className="mt-1 text-xs text-[#E7CC91]/80">
                Plot 14, Main Mansarovar Road, Jaipur, Rajasthan 302020
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=Mansarovar,Jaipur,Rajasthan"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-[#D7B46B] px-3.5 py-1.5 text-xs font-semibold text-[#33201D] shadow-sm transition hover:bg-[#F0D7AF]"
            >
              <Navigation size={13} /> Open in Maps
            </a>
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="text-xs text-[#F7EBDD]/90">
              ⚡ Serving all major venues across Jaipur, Kukas Corridor, Sitapura, and Ajmer Road.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
