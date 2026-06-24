export const config = {
  runtime: "nodejs",
  regions: ["iad1"],
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing ANTHROPIC_API_KEY env var" });
    return;
  }

  const body =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body,
  });

  res.status(upstream.status);
  res.setHeader(
    "Content-Type",
    upstream.headers.get("Content-Type") || "text/event-stream"
  );
  res.setHeader("Cache-Control", "no-cache");

  const reader = upstream.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}
