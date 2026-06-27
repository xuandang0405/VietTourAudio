import { GeofenceRepository } from '../repositories/geofence.repository';
import { buildPoiZoneScope, buildStallZoneScope } from '../utils/zoneScope';

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const earthRadius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function mapStall(row: any) {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    name: row.name,
    slug: row.slug,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    activationRadius: Number(row.activation_radius),
    status: row.status === 'APPROVED' ? 'ACTIVE' : row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vendor: {
      id: String(row.vendor_id),
      businessName: row.trade_name,
      ownerEmail: row.contact_email,
    },
  };
}

export class GeofenceService {
  private geofenceRepo = new GeofenceRepository();

  async getStallsWithOverlaps(req: any) {
    const zoneScope = buildStallZoneScope(req);
    const rows = await this.geofenceRepo.getStallsWithVendors(zoneScope.clause, zoneScope.params);
    const stalls = rows.map(mapStall);
    return stalls.map((stall) => ({
      ...stall,
      overlaps: stalls
        .filter((candidate) => candidate.id !== stall.id)
        .filter((candidate) => {
          return (
            distanceMeters(
              { latitude: Number(stall.latitude), longitude: Number(stall.longitude) },
              { latitude: Number(candidate.latitude), longitude: Number(candidate.longitude) }
            ) <
            Number(stall.activationRadius) + Number(candidate.activationRadius)
          );
        })
        .map((candidate) => candidate.id),
    }));
  }

  async getAllGeofenceData(req: any) {
    // 1. Stalls with overlaps
    const stallsWithOverlap = await this.getStallsWithOverlaps(req);

    // 2. POIs
    const poiZoneScope = buildPoiZoneScope(req);
    const poiRows = await this.geofenceRepo.getPoisWithStalls(poiZoneScope.clause, poiZoneScope.params);
    const pois = poiRows.map((row) => ({
      id: String(row.id),
      name: row.name,
      stallId: String(row.stall_id),
      stallName: row.stall_name || 'N/A',
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      activationRadius: Number(row.activation_radius),
      status: row.status,
    }));

    // 3. Tours
    const tourRows = await this.geofenceRepo.getActiveTours();
    const tourPoiRows = await this.geofenceRepo.getTourPois();

    const tours = tourRows.map((tour) => {
      const tourId = Number(tour.id);
      const poisInTour = tourPoiRows.filter((tp) => Number(tp.tour_id) === tourId);
      if (poisInTour.length === 0) {
        return {
          id: String(tour.id),
          name: tour.name,
          description: tour.description,
          latitude: 10.77582, // Nguyen Hue
          longitude: 106.70208,
          radius: 150,
        };
      }

      const sumLat = poisInTour.reduce((sum, p) => sum + Number(p.latitude), 0);
      const sumLng = poisInTour.reduce((sum, p) => sum + Number(p.longitude), 0);
      const avgLat = sumLat / poisInTour.length;
      const avgLng = sumLng / poisInTour.length;

      let maxDist = 100;
      for (const poi of poisInTour) {
        const dist = distanceMeters(
          { latitude: avgLat, longitude: avgLng },
          { latitude: Number(poi.latitude), longitude: Number(poi.longitude) }
        );
        if (dist > maxDist) maxDist = dist;
      }

      return {
        id: String(tour.id),
        name: tour.name,
        description: tour.description,
        latitude: avgLat,
        longitude: avgLng,
        radius: Math.ceil(maxDist + 50),
      };
    });

    return {
      stalls: stallsWithOverlap,
      pois,
      tours,
    };
  }

  async checkOverlap(latitude: number, longitude: number, radius: number, req: any) {
    const zoneScope = buildStallZoneScope(req);
    const rows = await this.geofenceRepo.getStallsWithVendors(zoneScope.clause, zoneScope.params);
    const overlaps = rows
      .map(mapStall)
      .map((stall) => ({
        stall,
        distance: distanceMeters(
          { latitude, longitude },
          { latitude: Number(stall.latitude), longitude: Number(stall.longitude) }
        ),
      }))
      .filter(({ stall, distance }) => distance < radius + Number(stall.activationRadius));

    return {
      hasOverlap: overlaps.length > 0,
      overlaps,
    };
  }
}
