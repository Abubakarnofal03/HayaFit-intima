// Snapchat Pixel tracking utilities
// Pixel ID: 91f10419-0a43-490f-8dab-14ddf4157aae

declare global {
    interface Window {
        snaptr: (command: string, ...args: any[]) => void;
    }
}

// Track page view
export const trackPageView = () => {
    if (typeof window !== 'undefined' && window.snaptr) {
        window.snaptr('track', 'PAGE_VIEW');
    }
};

// Track product view
export const trackViewContent = (params: {
    price: number;
    currency?: string;
    itemIds: string[];
    category?: string;
}) => {
    if (typeof window !== 'undefined' && window.snaptr) {
        window.snaptr('track', 'VIEW_CONTENT', {
            price: params.price,
            currency: params.currency || 'PKR',
            item_ids: params.itemIds,
            item_category: params.category || '',
        });
    }
};

// Track add to cart
export const trackAddToCart = (params: {
    price: number;
    currency?: string;
    itemIds: string[];
    category?: string;
    numberItems: number;
}) => {
    if (typeof window !== 'undefined' && window.snaptr) {
        window.snaptr('track', 'ADD_CART', {
            price: params.price,
            currency: params.currency || 'PKR',
            item_ids: params.itemIds,
            item_category: params.category || '',
            number_items: params.numberItems,
        });
    }
};

// Track checkout initiation
export const trackStartCheckout = (params: {
    price: number;
    currency?: string;
    itemIds: string[];
    numberItems: number;
    paymentInfoAvailable?: boolean;
}) => {
    if (typeof window !== 'undefined' && window.snaptr) {
        window.snaptr('track', 'START_CHECKOUT', {
            price: params.price,
            currency: params.currency || 'PKR',
            item_ids: params.itemIds,
            number_items: params.numberItems,
            payment_info_available: params.paymentInfoAvailable ? 1 : 0,
        });
    }
};

// Track purchase
export const trackPurchase = (params: {
    price: number;
    currency?: string;
    transactionId: string;
    itemIds: string[];
    category?: string;
    numberItems: number;
}) => {
    if (typeof window !== 'undefined' && window.snaptr) {
        window.snaptr('track', 'PURCHASE', {
            price: params.price,
            currency: params.currency || 'PKR',
            transaction_id: params.transactionId,
            item_ids: params.itemIds,
            item_category: params.category || '',
            number_items: params.numberItems,
        });
    }
};
