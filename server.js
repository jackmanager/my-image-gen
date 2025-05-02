import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai"; // Use the new import style for v4+

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Check if API key is loaded
if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable not set.");
  process.exit(1); // Exit if key is missing
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/generate
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, n = 1 } = req.body; // Default n to 1 if not provided
    const numImages = parseInt(n, 10);

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ error: "Invalid or empty prompt" });
    }
    if (isNaN(numImages) || numImages < 1 || numImages > 4) { // Validate n (1-4)
        return res.status(400).json({ error: "Invalid number of images requested (must be 1-4)" });
    }

    console.log(`Generating ${numImages} image(s) for prompt: \"${prompt}\"`);

    // Request images (GPT-Image-1 defaults to b64_json based on logs)
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt.trim(),
      size: "1024x1024",
      n: numImages,
      quality: "auto"
      // No response_format parameter
    });

    // Log critical parts of the response for debugging
    console.log("--- OpenAI API Response Debug Info ---");
    console.log("Response object keys:", Object.keys(response || {}));
    console.log("Is response.data an array?", Array.isArray(response.data));
    if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log("First element keys (response.data[0]):", Object.keys(response.data[0] || {}));
        console.log("b64_json in first element?", response.data[0]?.hasOwnProperty("b64_json"));
    }
    console.log("---------------------------------------");

    // Extract b64_json data from the response
    let imageB64Data = [];
    if (response && response.data && Array.isArray(response.data)) {
        imageB64Data = response.data.map(image => image.b64_json);
    } else {
        console.error("Unexpected response structure received from OpenAI API. Cannot extract b64_json.");
    }

    console.log(`Extracted ${imageB64Data.length} base64 image data strings.`);
    // Return array of base64 strings under the key imageB64Data
    res.json({ imageB64Data: imageB64Data || [] });

  } catch (error) {
    console.error("--- Image Generation Error ---");
    if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
        console.error("Message:", error.message);
    }
    console.error("----------------------------");
    const errorMessage = error.response?.data?.error?.message || error.message || "Failed to generate image";
    res.status(error.response?.status || 500).json({ error: errorMessage });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => { // Listen on 0.0.0.0 for external access
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});

