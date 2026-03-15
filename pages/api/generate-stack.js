// pages/api/generate-stack.js
// Server-side stack generation endpoint.
// Primary: deterministic recommendation engine (stackIntelligence.js)
// Enhancement: optional AI call for richer protocol names and reasoning
// Fallback: always returns local engine results if AI fails

import { recommendStack } from '../../lib/stackIntelligence';
import { PRODUCTS } from '../../lib/products';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const answers = req.body;
    if (!answers || !answers.goal) {
      return res.status(400).json({ error: 'Missing required field: goal' });
    }

    // Step 1: Generate stack using local deterministic engine
    const localResult = recommendStack(answers);

    // If fallback mode requested or no compounds found, return immediately
    if (req.query.fallback === '1' || !localResult.compounds || localResult.compounds.length === 0) {
      return res.status(200).json(localResult);
    }

    // Step 2: Try AI enhancement for better copy (non-blocking — local result is always returned)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // No API key configured — return local result
      return res.status(200).json(localResult);
    }

    try {
      const compoundSummary = localResult.compounds.map(c =>
        `${c.name} (${c.role}, ${c.recommendedSize}, $${c.price}) — ${c.reason}`
      ).join('\n');

      const prompt = `You are the Aeterion Labs protocol advisor. Given this pre-selected peptide stack, enhance the presentation copy.

RESEARCHER PROFILE:
- Goal: ${answers.goal}
- Secondary: ${answers.secondary || 'none'}
- Experience: ${answers.exp}
- Cycle: ${answers.cycle}
- Budget: ${answers.budget}

PRE-SELECTED COMPOUNDS:
${compoundSummary}

Write improved copy for this stack. Output ONLY valid JSON:
{
  "protocolName": "3-4 word protocol name",
  "tagline": "One compelling sentence about who this protocol is for and why",
  "enhancedReasons": {
    "CompoundName": "1-2 sentence enhanced rationale for why this compound fits this specific researcher's profile"
  },
  "protocolTip": "One practical, specific tip for running this protocol"
}

RULES:
- Do NOT add or remove compounds — only enhance the copy
- Do NOT make medical claims or guarantee outcomes
- Keep tone educational and research-oriented
- Be specific to the researcher's goals, not generic`;

      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const text = aiData.content?.[0]?.text || '';
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        // Merge AI enhancements into local result
        if (parsed.protocolName) localResult.protocolName = parsed.protocolName;
        if (parsed.tagline) localResult.tagline = parsed.tagline;
        if (parsed.protocolTip) localResult.protocolTip = parsed.protocolTip;
        if (parsed.enhancedReasons) {
          localResult.compounds = localResult.compounds.map(c => {
            const enhanced = parsed.enhancedReasons[c.name];
            if (enhanced) return { ...c, reason: enhanced };
            return c;
          });
        }
        localResult.aiEnhanced = true;
      }
    } catch (aiErr) {
      // AI enhancement failed — that is fine, local result is still complete
      console.error('AI enhancement failed (non-critical):', aiErr.message);
    }

    return res.status(200).json(localResult);
  } catch (err) {
    console.error('Stack generation error:', err);
    return res.status(500).json({ error: 'Stack generation failed' });
  }
}
