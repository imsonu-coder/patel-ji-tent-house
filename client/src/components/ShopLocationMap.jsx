export default function ShopLocationMap() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0D7AF] bg-[#F7EBDD]">
      <div className="h-[300px] w-full bg-[radial-gradient(circle_at_center,_#edc781_0%,_#c79a3b_25%,_#6b1e2b_100%)] p-6 text-white">
        <div className="flex h-full items-center justify-center rounded-2xl border border-white/20 bg-[#45121C]/60 text-center backdrop-blur-sm">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#E7CC91]">Demo location</div>
            <div className="mt-3 font-[Playfair_Display] text-3xl">Jaipur, Rajasthan</div>
            <p className="mt-2 text-sm text-[#F7EBDD]">Map placeholder — replace with live coordinates later.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
