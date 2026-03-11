// pages/api/peptide-chat.js
// Streaming AI research assistant — routes through Vercel AI Gateway

const CATALOG = `
AETERION LABS — FULL PRODUCT CATALOG (for research guidance only)

METABOLIC / GLP-1:
- Semaglutide: 2mg $64, 5mg $105, 10mg $148, 15mg $191, 20mg $234
- Tirzepatide: 5mg $73, 10mg $124, 15mg $159, 20mg $199, 40mg $306
- Retatrutide: 5mg $99, 10mg $129, 15mg $174, 20mg $220
- Liraglutide: 5mg $73, 10mg $116
- Dulaglutide: 5mg $73, 10mg $116
- Mazdutide: 5mg $127, 10mg $202
- Survodutide: 10mg $142
- Cagrilintide: 5mg $84, 10mg $140
- Cagrisema (2.5+2.5mg): combo $99
- FTPP Adipotide: 5mg $59

GROWTH / GH AXIS:
- Ipamorelin: 2mg $41, 5mg $67, 10mg $105
- CJC-1295 (no DAC): 2mg $34, 5mg $59
- CJC-1295 (DAC): 2mg $45, 5mg $73
- CJC-1295 + Ipamorelin Blend: 10mg (5+5) $69
- GHRP-2: 5mg $38, 10mg $62, 15mg $84
- GHRP-6: 5mg $38, 10mg $62
- Hexarelin: 2mg $39, 5mg $67
- Sermorelin: 2mg $37, 5mg $59, 10mg $95
- Tesamorelin: 2mg $52, 5mg $88, 10mg $138, 20mg $242
- IGF-1 LR3: 1mg $88
- Follistatin 344: 1mg $113
- HGH (Somatropin): 10iu $129, 12iu $149, 15iu $175, 24iu $245

RECOVERY / TISSUE REPAIR:
- BPC-157: 5mg $45, 10mg $77
- TB-500 (Thymosin Beta-4): 2mg $39, 5mg $58, 10mg $95
- BPC-157 + TB-500 Blend: BPC5mg+TB5mg $88, BPC10mg+TB10mg $148
- BPC+GHK-Cu+TB500+KPV Quad Blend: 80mg $145
- GLOW Blend (BPC+GHK-Cu+TB-500): 70mg $124
- KPV: 5mg $52, 10mg $88
- LL-37: 5mg $70
- GHK-Cu: 50mg $45, 100mg $77
- Thymosin Alpha-1: 5mg $64, 10mg $105
- SS-31 (Elamipretide): 5mg $88, 10mg $148
- VIP (Vasoactive Intestinal Peptide): 5mg $70, 10mg $113

LONGEVITY:
- Epitalon: 10mg $52, 50mg $210
- NAD+: 100mg $48, 500mg $73, 1000mg $127
- Humanin: 10mg $70
- MOTS-c: 10mg $88, 15mg $120, 20mg $156, 40mg $260
- Thymalin: 10mg $53

NEURO / COGNITIVE:
- Semax: 5mg $52, 10mg $88
- Selank: 5mg $52, 10mg $88
- Dihexa: 10mg $95
- Cerebrolysin: 60mg $56
- DSIP (Delta Sleep Inducing Peptide): 2mg $45, 5mg $69
- Adamax: 5mg $86
- PE-22-28: 5mg $73

BODY COMPOSITION:
- AOD9604: 2mg $32, 5mg $52, 10mg $82
- HGH Fragment 176-191: 1mg $32, 2mg $45, 5mg $69, 10mg $105
- Adipotide (FTPP): 2mg $45, 5mg $75, 10mg $124
- 5-AMINO-1MQ: 5mg $56, 10mg $92
- SLU-PP-332: 5mg $69, 10mg $105
- ACE-031: 1mg $82
- L-Carnitine: 5000mg $34
- Lipo-C: 10ml $37
- MIC (Lipo-C + B12): 10ml $43
- Lemon Bottle: 10ml $49
- AICAR: 50mg $62, 100mg $105
- ARA290 (Cibinetide): 10mg $69

HORMONAL:
- HCG: 5000iu $56, 10000iu $84
- HMG: 75iu $45
- Gonadorelin Acetate: 2mg $32, 5mg $52
- Oxytocin Acetate: 2mg $30, 5mg $45, 10mg $69
- Kisspeptin-10: 5mg $45, 10mg $75
- Triptorelin Acetate: 2mg $52
- PT-141 (Bremelanotide): 10mg $56
- Demorphin: 2mg $45
- FOXO4-DRI: 2mg $58, 10mg $116

COSMETIC / SKIN:
- Melanotan I: 10mg $49
- Melanotan II: 10mg $45
- Glutathione: 600mg $52, 1500mg $102
- Snap-8: 10mg $56

ANCILLARIES:
- Bacteriostatic Water: 3ml $13, 10ml $19
- Acetic Acid 1%: 10ml $13
`;

const SYSTEM_PROMPT = `You are the Aeterion Labs Research Assistant — a knowledgeable, precise, and professional AI guide for researchers using peptides and research compounds. You assist researchers in understanding compounds, identifying relevant stacks, and navigating the Aeterion catalog.

CATALOG:
${CATALOG}

GUIDELINES:
- Always clarify: all compounds are FOR RESEARCH USE ONLY, not for human consumption
- Be scientifically precise — cite mechanisms, not just names
- When recommending compounds, reference specific products from the catalog with prices
- Keep responses focused and concise — use bullet points for stacks/protocols
- If asked about dosing, frame it as "research protocols suggest..." and keep it educational
- Never provide medical advice or suggest compounds for personal use
- You can discuss synergies, mechanisms, half-lives, and research literature
- Format compound names in bold when first mentioned
- Always end stack recommendations with a note about reconstitution requirements

TONE: Expert, clinical, trustworthy. Like a knowledgeable colleague — not a salesperson.`;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages } = req.body;
  if (!messages || !messages.length) return res.status(400).json({ error: "No messages provided" });

  // Route through Vercel AI Gateway if API key is set, else fall back to direct Anthropic
  const useGateway = !!process.env.AI_GATEWAY_API_KEY;
  const baseURL = useGateway ? "https://ai-gateway.vercel.sh" : "https://api.anthropic.com";
  const apiKey = useGateway ? process.env.AI_GATEWAY_API_KEY : process.env.ANTHROPIC_API_KEY;

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const anthropicRes = await fetch(`${baseURL}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "messages-2023-12-15",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: messages.slice(-10), // keep last 10 turns for context
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      return res.status(500).json({ error: err });
    }

    // Stream SSE events through to the client
    const reader = anthropicRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") { res.write("data: [DONE]\n\n"); continue; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
              res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
            }
            if (parsed.type === "message_stop") {
              res.write("data: [DONE]\n\n");
            }
          } catch {}
        }
      }
    }

    res.end();
  } catch (err) {
    console.error("Peptide chat error:", err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  }
}
