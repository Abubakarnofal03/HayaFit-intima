// Utilities for managing cart in session storage for guest users

export interface GuestCartItem {
  product_id: string;
  quantity: number;
  product_name: string;
  product_price: number;
  product_image?: string;
  variation_id?: string | null;
  variation_name?: string | null;
  variation_price?: number | null;
  color_id?: string | null;
  color_name?: string | null;
  color_code?: string | null;
  color_price?: number | null;
  size_id?: string | null;
  size_name?: string | null;
  size_price?: number | null;
  shipping_cost?: number;
}

const CART_STORAGE_KEY = 'guest_cart';

export const getGuestCart = (): GuestCartItem[] => {
  try {
    const cart = sessionStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Error reading guest cart:', error);
    return [];
  }
};

export const setGuestCart = (cart: GuestCartItem[]): void => {
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
};

export const addToGuestCart = (item: GuestCartItem): void => {
  const cart = getGuestCart();
  // Match by product_id, variation_id, color_id, and size_id to handle variations, colors, and sizes correctly
  const existingIndex = cart.findIndex(i =>
    i.product_id === item.product_id &&
    i.variation_id === item.variation_id &&
    i.color_id === item.color_id &&
    i.size_id === item.size_id
  );

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }

  setGuestCart(cart);
};

export const updateGuestCartQuantity = (
  productId: string,
  quantity: number,
  variationId?: string | null,
  colorId?: string | null,
  sizeId?: string | null
): void => {
  const cart = getGuestCart();
  const index = cart.findIndex(i =>
    i.product_id === productId &&
    i.variation_id === variationId &&
    i.color_id === colorId &&
    i.size_id === sizeId
  );

  if (index >= 0) {
    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }
    setGuestCart(cart);
  }
};

export const removeFromGuestCart = (
  productId: string,
  variationId?: string | null,
  colorId?: string | null,
  sizeId?: string | null
): void => {
  const cart = getGuestCart();
  const filtered = cart.filter(i => !(
    i.product_id === productId &&
    i.variation_id === variationId &&
    i.color_id === colorId &&
    i.size_id === sizeId
  ));
  setGuestCart(filtered);
};

export const clearGuestCart = (): void => {
  sessionStorage.removeItem(CART_STORAGE_KEY);
};
