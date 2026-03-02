import { CarrierStrategy, ShipmentData, RateQuote } from './interfaces';

export class CarrierRatingService {
    private activeCarriers: CarrierStrategy[] = [];

    /**
     * Register a carrier strategy implementation
     */
    registerCarrier(carrier: CarrierStrategy) {
        this.activeCarriers.push(carrier);
    }

    /**
     * Fetches rates from all registered carriers concurrently, normalizes errors,
     * and returns a sorted array of valid quotes from cheapest to most expensive.
     */
    async getAggregatedRates(shipment: ShipmentData): Promise<RateQuote[]> {
        if (this.activeCarriers.length === 0) {
            return [];
        }

        const ratePromises = this.activeCarriers.map(carrier => carrier.getRate(shipment));
        const results = await Promise.allSettled(ratePromises);

        const validQuotes: RateQuote[] = [];

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                validQuotes.push(result.value);
            } else {
                // In a real-world scenario, we'd log this error to a monitoring service (e.g. Sentry)
                console.error('Carrier rating failed:', result.reason);
            }
        });

        // Sort cheapest first
        return validQuotes.sort((a, b) => a.totalCost - b.totalCost);
    }
}
