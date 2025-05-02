import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// POST /api/generate
app.post("/api/generate", async (req, res) => {
  try {
    const { apiKey, prompt, n = 1 } = req.body;

    // 1) Validate API key
    if (!apiKey || !apiKey.startsWith("sk-")) {
      return res
        .status(400)
        .json({ error: "A valid OpenAI API key is required." });
    }

    // 2) Validate prompt
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Invalid prompt." });
    }

    // 3) Validate n (1–4)
    const count = Number(n);
    if (!Number.isInteger(count) || count < 1 || count > 4) {
      return res
        .status(400)
        .json({ error: "Image count must be an integer between 1 and 4." });
    }

    // 4) Instantiate OpenAI with the user's key
    const openai = new OpenAI({ apiKey: apiKey.trim() });

    // 5) Generate images (v4 defaults to base64 JSON)
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt.trim(),
      size: "1024x1024",
      n: count
    });

    // 6) Convert each b64_json chunk into a data-URI
    const images = response.data.map((item) => {
      if (!item.b64_json) throw new Error("Missing image data");
      return "data:image/png;base64," + item.b64_json;
    });

    // 7) Send back the array of URIs
    res.json({ images });
  } catch (err) {
    console.error("Generation error:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to generate images." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
