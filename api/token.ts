import { AccessToken } from "livekit-server-sdk";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { room, identity, isHost } = req.body;

  if (!room || !identity) {
    return res.status(400).json({ error: "Missing room or identity" });
  }
  
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "LiveKit server misconfigured" });
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      metadata: JSON.stringify({ name: identity }),
    });

    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
      roomAdmin: !!isHost,
    });

    const token = await at.toJwt();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify({ 
      token, 
      url: process.env.VITE_LIVEKIT_URL || process.env.LIVEKIT_URL 
    }));
  } catch (error) {
    console.error("LiveKit token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
}
