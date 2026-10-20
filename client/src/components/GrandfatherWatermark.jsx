export default function GrandfatherWatermark({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 opacity-[0.06] ${className}`}
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'grayscale(1) contrast(1.1)'
      }}
    />
  );
}
