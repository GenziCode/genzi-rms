import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, Customer, Sale } from '@/types/pos.types';

interface POSState {
  // Cart
  cart: CartItem[];
  customer: Customer | null;
  discount: number; // Percentage
  notes: string;

  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemPrice: (productId: string, price: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  updateItemNote: (productId: string, note: string) => void;
  clearCart: () => void;
  loadSale: (sale: Sale) => void;

  // Customer
  setCustomer: (customer: Customer | null) => void;

  // Discount & Notes
  setDiscount: (discount: number) => void;
  setNotes: (notes: string) => void;

  // Calculations
  getSubtotal: () => number;
  getTotalDiscount: () => number;
  getTotalTax: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
}

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      cart: [],
      customer: null,
      discount: 0,
      notes: '',

      addToCart: (product, quantity = 1) => {
        const cart = get().cart;
        const existingItem = cart.find(
          (item) => item.product._id === product._id
        );

        if (existingItem) {
          // Update quantity
          set({
            cart: cart.map((item) =>
              item.product._id === product._id
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    subtotal: (item.quantity + quantity) * item.price,
                    total: (item.quantity + quantity) * item.price,
                  }
                : item
            ),
          });
        } else {
          // Add new item
          const price = product.price;
          const subtotal = price * quantity;
          const taxAmount = product.taxRate
            ? (subtotal * product.taxRate) / 100
            : 0;
          const total = subtotal + taxAmount;

          set({
            cart: [
              ...cart,
              {
                product,
                quantity,
                price,
                discount: 0,
                taxAmount,
                subtotal,
                total,
              },
            ],
          });
        }
      },

      removeFromCart: (productId) => {
        set({
          cart: get().cart.filter((item) => item.product._id !== productId),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set({
          cart: get().cart.map((item) => {
            if (item.product._id === productId) {
              const subtotal = item.price * quantity;
              const taxAmount = item.product.taxRate
                ? (subtotal * item.product.taxRate) / 100
                : 0;
              return {
                ...item,
                quantity,
                subtotal,
                taxAmount,
                total: subtotal + taxAmount,
              };
            }
            return item;
          }),
        });
      },

      updateItemPrice: (productId, price) => {
        set({
          cart: get().cart.map((item) => {
            if (item.product._id === productId) {
              const subtotal = price * item.quantity;
              const taxAmount = item.product.taxRate
                ? (subtotal * item.product.taxRate) / 100
                : 0;
              return {
                ...item,
                price,
                subtotal,
                taxAmount,
                total: subtotal + taxAmount,
              };
            }
            return item;
          }),
        });
      },

      updateItemDiscount: (productId, discount) => {
        set({
          cart: get().cart.map((item) => {
            if (item.product._id === productId) {
              const subtotal = item.price * item.quantity;
              const discountAmount = (subtotal * discount) / 100;
              const afterDiscount = subtotal - discountAmount;
              const taxAmount = item.product.taxRate
                ? (afterDiscount * item.product.taxRate) / 100
                : 0;
              return {
                ...item,
                discount,
                subtotal,
                taxAmount,
                total: afterDiscount + taxAmount,
              };
            }
            return item;
          }),
        });
      },

      updateItemNote: (productId, note) => {
        set({
          cart: get().cart.map((item) =>
            item.product._id === productId ? { ...item, note } : item
          ),
        });
      },

      clearCart: () => {
        set({ cart: [], customer: null, discount: 0, notes: '' });
      },

      loadSale: (sale) => {
        const cartItems: CartItem[] = sale.items.map((item) => {
          const subtotal = item.unitPrice * item.quantity;
          const product: Product = {
            _id: item.productId,
            name: item.productName,
            price: item.unitPrice,
            cost: undefined,
            stock: undefined,
            barcode: undefined,
            category: 'POS',
          };

          return {
            product,
            quantity: item.quantity,
            price: item.unitPrice,
            discount: item.discount || 0,
            taxAmount: item.taxAmount ?? 0,
            subtotal,
            total: item.total,
          };
        });

        const subtotal = cartItems.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );
        const discountPercentRaw =
          subtotal > 0 ? (sale.totalDiscount / subtotal) * 100 : 0;
        const discountPercent = Math.round(discountPercentRaw * 100) / 100;

        set({
          cart: cartItems,
          customer: sale.customer ?? null,
          notes: sale.notes || '',
          discount: Number.isFinite(discountPercent) ? discountPercent : 0,
        });
      },

      setCustomer: (customer) => {
        set({ customer });
      },

      setDiscount: (discount) => {
        set({ discount });
      },

      setNotes: (notes) => {
        set({ notes });
      },

      getSubtotal: () => {
        return get().cart.reduce((sum, item) => sum + item.subtotal, 0);
      },

      getTotalDiscount: () => {
        const subtotal = get().getSubtotal();
        const discount = get().discount;
        return (subtotal * discount) / 100;
      },

      getTotalTax: () => {
        return get().cart.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getTotalDiscount();
        const tax = get().getTotalTax();
        return subtotal - discount + tax;
      },

      getItemCount: () => {
        return get().cart.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'pos-storage',
    }
  )
);
