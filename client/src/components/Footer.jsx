import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-20 bg-[#45121C] text-[#FFFDF9]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="mb-4 font-[Playfair_Display] text-2xl font-bold">Patel Ji Tent House</div>
          <p className="text-sm text-[#E7CC91]">Weddings • Events • Decorations</p>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
          <ul className="space-y-2 text-sm text-[#F7EBDD]">
            <li><Link to="/items">Items</Link></li>
            <li><Link to="/build-event">Build Your Event</Link></li>
            <li><Link to="/gallery">Gallery</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold">Services</h3>
          <ul className="space-y-2 text-sm text-[#F7EBDD]">
            <li>Tents & Canopies</li>
            <li>Furniture & Seating</li>
            <li>Lighting</li>
            <li>Decor & Stage</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold">Contact</h3>
          <ul className="space-y-2 text-sm text-[#F7EBDD]">
            <li>Jaipur, Rajasthan</li>
            <li>Phone: +91 98290 12345</li>
            <li>Email: info@pateltenthouse.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-sm text-[#E7CC91]">
        © 2026 Patel Ji Tent House • Jaipur Event Rentals & Infrastructure
      </div>
    </footer>
  );
}
