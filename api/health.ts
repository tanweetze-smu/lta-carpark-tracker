import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  const hasLtaKey = Boolean(
    process.env.LTA_DATAMALL_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY
  );

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'lta-datamall-carpark-service',
    ltaKeyConfigured: hasLtaKey,
    message: hasLtaKey
      ? 'LTA DataMall AccountKey is configured and active.'
      : 'LTA DataMall AccountKey is not set. Configure LTA_DATAMALL_KEY in your environment.',
    endpoints: {
      carparkAvailability: '/api/carparkavailability',
      health: '/api/health',
    },
  });
}
