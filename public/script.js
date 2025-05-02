document.addEventListener("DOMContentLoaded", () => {
  console.log("script.js loaded");

  const form       = document.getElementById("prompt-form");
  const keyInput   = document.getElementById("api-key");
  const promptInput= document.getElementById("prompt");
  const countInput = document.getElementById("image-count");
  const resultDiv  = document.getElementById("result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Form submitted");

    const apiKey = keyInput.value.trim();
    const prompt = promptInput.value.trim();
    const n      = parseInt(countInput.value, 10);

    if (!apiKey) {
      return alert("Please enter your OpenAI API key.");
    }
    if (!prompt) {
      return alert("Please enter a prompt.");
    }

    resultDiv.innerHTML = "<p>Generating…</p>";

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, prompt, n })
      });
      console.log("Request sent to /api/generate");

      const data = await res.json();
      console.log("Response received", data);

      if (data.error) {
        throw new Error(data.error);
      }

      // Render each returned data-URI
      resultDiv.innerHTML = data.images
        .map((url) => `<img src="${url}" alt="Generated image"/>`)
        .join("");
    } catch (err) {
      console.error("Error during generation:", err);
      resultDiv.innerHTML = `<p>Error: ${err.message}</p>`;
    }
  });
});
