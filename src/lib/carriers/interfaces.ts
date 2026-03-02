export interface Address {
    zip: string;
    city?: string;
    state?: string;
    country?: string;
}

export interface FreightItem {
    weight: number;
    class: string;
    pallets: number;
    description?: string;
}

export interface ShipmentData {
    origin: Address;
    destination: Address;
    items: FreightItem[];
    pickupDate?: string; // YYYY-MM-DD
}

export interface RateQuote {
    carrier: string;
    scac: string;
    totalCost: number;
    transitDays: number;
    quoteId: string;
    details?: {
        baseRate?: number;
        fuelSurcharge?: number;
        discounts?: number;
    };
}

export interface BookingResult {
    success: boolean;
    proNumber?: string;
    bolUrl?: string;
    pickupDate?: string;
    message?: string;
}

export interface TrackingUpdate {
    status: 'In-Transit' | 'Delivered' | 'Exception' | 'Unknown';
    location?: string;
    timestamp?: string;
    message?: string;
}

export interface CarrierStrategy {
    getRate(shipment: ShipmentData): Promise<RateQuote>;
    createBooking(shipment: ShipmentData, quoteId: string): Promise<BookingResult>;
    getTracking(proNumber: string): Promise<TrackingUpdate>;
}

export interface CarrierApiCredentials {
    api_client_id?: string;
    api_client_secret?: string;
    api_key?: string;
    account_number?: string;
}
