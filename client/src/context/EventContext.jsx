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

  const addItem = (item, requestedQuantity = 1) => {
    const quantity = Number(requestedQuantity);
    if (
      !item ||
      typeof item._id !== 'string' ||
      !item._id ||
      typeof item.name !== 'string' ||
      !item.name.trim() ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      !Number.isFinite(Number(item.basePrice))
    ) {
      return false;
    }

    setSelectedItems((current) => {
      const matchingItems = current.filter((entry) => entry.itemId === item._id);
      if (matchingItems.length > 0) {
        const existingQuantity = matchingItems.reduce(
          (sum, entry) => sum + (Number(entry.quantity) || 0),
          0
        );
        let updatedExistingItem = false;

        return current.flatMap((entry) => {
          if (entry.itemId !== item._id) return [entry];
          if (updatedExistingItem) return [];

          updatedExistingItem = true;
          return [{ ...entry, quantity: existingQuantity + quantity }];
        });
      }
      return [
        ...current,
        {
          itemId: item._id,
          name: item.name,
          price: Number(item.basePrice),
          image: (Array.isArray(item.images) ? item.images[0] : '') || '',
          quantity
        }
      ];
    });
    return true;
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

// oxlint-disable-next-line react/only-export-components
export const useEvent = () => useContext(EventContext);
