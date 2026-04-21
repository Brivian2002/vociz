import { AccessToken } from "livekit-server-sdk";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { room, identity } = req.body;

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
    });

    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    res.status(200).json({ token });
  } catch (error) {
    console.error("LiveKit token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
}
