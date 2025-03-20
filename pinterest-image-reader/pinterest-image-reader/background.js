chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "send_to_gemini") {
        console.log("Received images:", request.images);

        request.images.forEach((base64Image) => {
            analyzeImage(base64Image);
        });
    }
});

async function analyzeImage(base64Image) {
    const GOOGLE_API_KEY = "AIzaSyCFzeKDjOutOPfjOADZ8jpDvuLk_SPdkDw"; 
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

    function getMimeType(base64) {
        if (base64.startsWith("data:image/jpeg")) return "image/jpeg";
        if (base64.startsWith("data:image/png")) return "image/png";
        return "image/jpeg";
    }

    const mimeType = getMimeType(base64Image);
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: "Describe this image for a visually impaired user. Focus on theme, colors, objects, and surroundings." },
                    { inline_data: { mime_type: mimeType, data: cleanBase64 } }
                ]
            }
        ]
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        const result = await response.json();
        console.log("API Response:", result);

        if (result && result.candidates && result.candidates.length > 0) {
            const description = result.candidates[0].content.parts[0].text;
            console.log("Image Description:", description);
            speak(description); // 🔊 Read aloud the description
        } else {
            console.error("No valid response from Gemini API");
        }
    } catch (error) {
        console.error("Error analyzing image:", error);
    }
}

// 🔊 Text-to-Speech (TTS) Function - Reads aloud the generated description
function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US"; // English language
        utterance.rate = 1.0; // Normal speech rate
        utterance.volume = 1.0; // Full volume
        speechSynthesis.speak(utterance);
    } else {
        console.error("Text-to-Speech not supported in this browser.");
    }
}
