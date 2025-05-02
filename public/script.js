const form = document.getElementById("prompt-form");
const promptInput = document.getElementById("prompt");
const numImagesSelect = document.getElementById("num-images");
const resultDiv = document.getElementById("result");
const imageGrid = document.getElementById("image-grid");
const statusDiv = document.getElementById("status");
const generateButton = document.getElementById("generate-button");
const resetButton = document.getElementById("reset-button");

// Function to clear the results and status
function clearResults() {
    imageGrid.innerHTML = "";
    statusDiv.innerHTML = "";
}

// Function to reset the form and results
function resetForm() {
    promptInput.value = "";
    numImagesSelect.value = "1"; // Reset dropdown to default
    clearResults();
    generateButton.disabled = false;
}

// Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prompt = promptInput.value.trim();
  const n = parseInt(numImagesSelect.value, 10);

  if (!prompt) {
    statusDiv.innerHTML = `<p class="error">Please enter a prompt.</p>`;
    return;
  }

  clearResults();
  statusDiv.innerHTML = "<p>Generating... (Sending request)</p>"; // Added detail
  generateButton.disabled = true; // Disable button during generation

  try {
    console.log("Sending fetch request to /api/generate");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, n }), // Send prompt and n
    });
    console.log("Received response from /api/generate. Status:", res.status);
    statusDiv.innerHTML = "<p>Generating... (Received response)</p>"; // Added detail

    // Log raw response text for debugging
    // const rawText = await res.text(); 
    // console.log("Raw response text:", rawText);
    // const data = JSON.parse(rawText); // Parse manually if needed

    const data = await res.json(); // Attempt to parse JSON
    console.log("Parsed JSON data:", data);
    statusDiv.innerHTML = "<p>Generating... (Processing response)</p>"; // Added detail

    if (!res.ok) {
        console.error("Response not OK:", data);
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }

    if (data.error) { // Handle application-level errors returned in JSON
        console.error("Application error in response:", data.error);
        throw new Error(data.error);
    }

    // Check for imageB64Data (as returned by the corrected backend)
    if (!data.imageB64Data || !Array.isArray(data.imageB64Data)) {
        console.error("Invalid or missing imageB64Data array:", data.imageB64Data);
        throw new Error("Invalid image data structure received from server.");
    }
    if (data.imageB64Data.length === 0) {
        console.warn("Received empty imageB64Data array.");
        throw new Error("No image data received from server.");
    }

    // Clear status and display images from base64 data
    statusDiv.innerHTML = "<p>Rendering images...</p>"; // Added detail
    console.log(`Attempting to render ${data.imageB64Data.length} images.`);
    data.imageB64Data.forEach((b64Json, index) => {
        console.log(`Processing image ${index + 1}`);
        if (!b64Json || typeof b64Json !== 'string') {
            console.error(`Invalid base64 data for image ${index + 1}:`, b64Json);
            statusDiv.innerHTML += `<br><p class="error">Error: Received invalid image data for image ${index + 1}.</p>`;
            return; // Skip this invalid entry
        }
        const imgElement = document.createElement("img");
        const dataUri = `data:image/png;base64,${b64Json}`;
        console.log(`Image ${index + 1} Data URI (first 50 chars):`, dataUri.substring(0, 50));
        imgElement.src = dataUri;
        imgElement.alt = `Generated image ${index + 1}`;
        // Add error handling for image loading
        imgElement.onerror = () => {
            console.error(`Failed to load image ${index + 1} from base64 data.`);
            imgElement.alt = `Failed to load image ${index + 1}`;
            imgElement.style.border = "2px solid red"; // Indicate error visually
            statusDiv.innerHTML += `<br><p class="error">Error rendering image ${index + 1}.</p>`;
        };
        imgElement.onload = () => {
             console.log(`Image ${index + 1} loaded successfully.`);
        };
        imageGrid.appendChild(imgElement);
    });
    // Clear status message after loop if successful (or handle partial success)
    if (imageGrid.children.length > 0) {
        statusDiv.innerHTML = ""; // Clear status if at least one image started loading
    }

  } catch (err) {
    console.error("Frontend error:", err);
    statusDiv.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  } finally {
    console.log("Generation process finished (in finally block).");
    generateButton.disabled = false; // Re-enable button
  }
});

// Handle reset button click
resetButton.addEventListener("click", resetForm);

