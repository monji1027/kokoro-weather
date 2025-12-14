// /api/classifyEmotion.js
// 心の天気帳から呼び出される「感情分類API」

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST is allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set" });
    }

    // ===== リクエストボディ(JSON)を読み取る =====
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyString = Buffer.concat(chunks).toString("utf8");
    const body = JSON.parse(bodyString || "{}");
    const text = body.text;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "No text provided" });
    }

    // ===== OpenAI API を呼び出す =====
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "あなたは感情分類器です。入力された日本語テキストを「恐れ,怒り,喜び,悲しみ,嫌悪,驚き」の6つの感情ごとに0〜1のスコアで評価し、JSONだけを返してください。キーは日本語の感情名、値は数値です。余計な説明文は書かないでください。",
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI API error:", errText);
      return res.status(500).json({ error: "OpenAI API error" });
    }

    const data = await openaiResponse.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    // result に、JSON文字列（{"喜び":0.8,...}）をそのまま入れて返す
    return res.status(200).json({ result: content });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
