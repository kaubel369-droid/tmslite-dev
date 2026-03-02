import { CarrierStrategy, ShipmentData, RateQuote, BookingResult, TrackingUpdate, CarrierApiCredentials } from './interfaces';

export class ODFLStrategy implements CarrierStrategy {
    private credentials: CarrierApiCredentials;
    private readonly baseUrl = 'https://api.odfl.com/v2'; // Mock URL for demonstration

    constructor(credentials: CarrierApiCredentials) {
        this.credentials = credentials;
    }

    async getRate(shipment: ShipmentData): Promise<RateQuote> {
        // In a real scenario, we'd hit the ODFL REST API using Fetch/Axios.
        // Example: Using Bearer Token constructed from client_id/secret
        /*
        const response = await fetch(`${this.baseUrl}/rating`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.credentials.api_client_secret}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({...shipment, account: this.credentials.account_number})
        });
        */

        // Simulated API Call
        await new Promise((resolve) => setTimeout(resolve, 800));

        const totalWeight = shipment.items.reduce((sum, item) => sum + item.weight, 0);
        const baseRate = totalWeight * 0.15; // Mock calculation
        const fuel = baseRate * 0.20;

        return {
            carrier: 'Old Dominion',
            scac: 'ODFL',
            totalCost: parseFloat((baseRate + fuel).toFixed(2)),
            transitDays: 3,
            quoteId: `ODFL-Q-${Date.now()}`,
            details: {
                baseRate,
                fuelSurcharge: fuel
            }
        };
    }

    async createBooking(shipment: ShipmentData, quoteId: string): Promise<BookingResult> {
        // Simulated Booking Integration
        await new Promise((resolve) => setTimeout(resolve, 1200));

        return {
            success: true,
            proNumber: `ODFL-${Math.floor(Math.random() * 1000000)}`,
            bolUrl: `https://mock.odfl.com/docs/bol_${quoteId}.pdf`,
            pickupDate: shipment.pickupDate
        };
    }

    async getTracking(proNumber: string): Promise<TrackingUpdate> {
        // Simulated Tracking Link
        return {
            status: 'In-Transit',
            location: 'Atlanta, GA',
            timestamp: new Date().toISOString()
        };
    }
}
