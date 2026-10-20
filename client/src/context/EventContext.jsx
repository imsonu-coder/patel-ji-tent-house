import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const EventContext = createContext(null);

const defaultCart = [];

export function EventProvider({ children }) {
  const [eventData, setEventData] = useState(() => {
    const stored = localStorage.getItem('pjth_event_data');
    return stored ? JSON.parse(stored) : {};
  });

  const [selectedItems, setSelectedItems] = useState(() => {
    const stored = localStorage.getItem('pjth_event_cart');
    return stored ? JSON.parse(stored) : defaultCart;
  });

  useEffect(() => {
    localStorage.setItem('pjth_event_data', JSON.stringify(eventData));
  }, [eventData]);

  useEffect(() => {
    localStorage.setItem('pjth_event_cart', JSON.stringify(selectedItems));
  }, [selectedItems]);

  const addItem = (item) => {
    setSelectedItems((current) => {
      const existing = current.find((entry) => entry.itemId === item._id);
      if (existing) {
        return current.map((entry) =>
          entry.itemId === item._id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [
        ...current,
        {
          itemId: item._id,
          name: item.name,
          price: item.basePrice,
          image: item.images?.[0] || 'https://images.unsplash.com/photo-1520854221256-17451cc331bf',
          quantity: 1
        }
      ];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setSelectedItems((current) =>
      current
        .map((entry) =>
          entry.itemId === itemId ? { ...entry, quantity: Math.max(0, entry.quantity + delta) } : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  const removeItem = (itemId) => {
    setSelectedItems((current) => current.filter((entry) => entry.itemId !== itemId));
  };

  const clearCart = () => {
    setSelectedItems([]);
    setEventData({});
    localStorage.removeItem('pjth_event_cart');
    localStorage.removeItem('pjth_event_data');
  };

  const estimatedTotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const value = useMemo(
    () => ({ eventData, setEventData, selectedItems, addItem, updateQuantity, removeItem, clearCart, estimatedTotal }),
    [eventData, selectedItems, estimatedTotal]
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export const useEvent = () => useContext(EventContext);
