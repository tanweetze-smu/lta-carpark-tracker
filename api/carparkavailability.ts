import type { Request, Response } from 'express';

const LTA_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export interface LtaRawCarpark {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // "lat lng", e.g. "1.29375 103.85718"
  AvailableLots: number;
  LotType: 'C' | 'H' | 'Y' | string;
  Agency: 'HDB' | 'LTA' | 'URA' | string;
}

export default async function handler(req: Request, res: Response) {
  // Read AccountKey from server environment without hardcoding
  const accountKey =
    process.env.LTA_DATAMALL_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    (req.headers['accountkey'] as string) ||
    '';

  if (!accountKey) {
    return res.status(401).json({
      error: 'Missing LTA DataMall AccountKey',
      message:
        'LTA DataMall requires an AccountKey header. Please configure LTA_DATAMALL_KEY in your environment variables or pass AccountKey header.',
      setupHelp:
        'Register for a free key at https://datamall.lta.gov.sg/ and add LTA_DATAMALL_KEY="YOUR_KEY" to your .env file.',
    });
  }

  try {
    const ltaResponse = await fetch(LTA_ENDPOINT, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!ltaResponse.ok) {
      const errorText = await ltaResponse.text();
      return res.status(ltaResponse.status).json({
        error: `LTA DataMall responded with HTTP ${ltaResponse.status}`,
        details: errorText,
      });
    }

    const data = await ltaResponse.json();
    const rawList: LtaRawCarpark[] = data.value || [];

    // Optional filter by agency: ?agency=HDB or ?agency=LTA or ?agency=URA
    const agencyFilter = typeof req.query.agency === 'string' ? req.query.agency.toUpperCase() : null;
    const filtered = agencyFilter
      ? rawList.filter((item) => item.Agency.toUpperCase() === agencyFilter)
      : rawList;

    // If caller requests raw data, return unmodified LTA payload
    if (req.query.raw === 'true') {
      return res.status(200).json({
        'odata.metadata': data['odata.metadata'],
        value: filtered,
      });
    }

    // Normalized structure with parsed coordinates and lot classifications
    const normalized = filtered.map((item) => {
      let lat = 1.3521;
      let lng = 103.8198;
      if (item.Location && typeof item.Location === 'string') {
        const parts = item.Location.trim().split(/\s+/);
        if (parts.length >= 2) {
          const parsedLat = parseFloat(parts[0]);
          const parsedLng = parseFloat(parts[1]);
          if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            lat = parsedLat;
            lng = parsedLng;
          }
        }
      }

      return {
        id: item.CarParkID,
        name: item.Development || `Carpark ${item.CarParkID}`,
        area: item.Area || 'Singapore',
        agency: item.Agency,
        lotType: item.LotType,
        availableLots: Number(item.AvailableLots) || 0,
        coordinates: { lat, lng },
        lastUpdated: new Date().toISOString(),
      };
    });

    return res.status(200).json({
      status: 'success',
      source: 'LTA DataMall CarParkAvailabilityv2',
      timestamp: new Date().toISOString(),
      totalLotsTracked: filtered.length,
      value: filtered,
      items: normalized,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred while contacting LTA';
    return res.status(502).json({
      error: 'Failed to connect to LTA DataMall',
      details: message,
    });
  }
}
