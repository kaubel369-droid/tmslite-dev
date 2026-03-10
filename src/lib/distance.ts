/**
 * Utility for geocoding and calculating distances using free public APIs.
 * Note: These public APIs have rate limits and usage policies.
 */

interface GeocodeResult {
    lat: string;
    lon: string;
}

interface OSRMResponse {
    routes: {
        distance: number; // in meters
    }[];
}

/**
 * Geocodes an address string using Nominatim (OpenStreetMap)
 */
async function geocodeAddress(address: string): Promise<{ lat: number, lon: number } | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'TMSLite-Dev-App'
            }
        });
        const data: GeocodeResult[] = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Calculates the driving distance between two points in miles using OSRM
 */
async function getDrivingDistance(origin: { lat: number, lon: number }, destination: { lat: number, lon: number }): Promise<number | null> {
    try {
        const url = `http://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=false`;
        const response = await fetch(url);
        const data: OSRMResponse = await response.json();
        
        if (data.routes && data.routes.length > 0) {
            // Distance is in meters, convert to miles (1 meter = 0.000621371 miles)
            const distanceMiles = data.routes[0].distance * 0.000621371;
            return Math.round(distanceMiles * 10) / 10; // Round to 1 decimal place
        }
        return null;
    } catch (error) {
        console.error('Routing error:', error);
        return null;
    }
}

/**
 * Main function to calculate mileage between two addresses
 */
export async function calculateMileage(originAddress: string, destinationAddress: string): Promise<number | null> {
    const originCoords = await geocodeAddress(originAddress);
    if (!originCoords) return null;
    
    // Add a tiny delay to respect Nominatim rate limits if called in quick succession
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const destCoords = await geocodeAddress(destinationAddress);
    if (!destCoords) return null;
    
    return await getDrivingDistance(originCoords, destCoords);
}
