// Speech recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';

// Speech synthesis setup
const synth = window.speechSynthesis;

// Function to speak the AI's response with a woman's voice
function speakResponse(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    
    let voices = synth.getVoices();
    let femaleVoice = voices.find(voice => voice.name.includes('female') || voice.name.includes('woman'));
    
    if (!femaleVoice) {
        femaleVoice = voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google') && !voice.name.includes('Male'));
    }
    
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    } else {
        console.warn('No suitable female voice found. Using default voice.');
    }
    
    utterance.pitch = 1;
    utterance.rate = 1;
    
    synth.speak(utterance);
}

// Function to handle voice input
function startListening() {
    recognition.start();
    console.log('Listening...');
}

recognition.onresult = (event) => {
    const userInput = event.results[0][0].transcript;
    document.getElementById('user-input').value = userInput;
    sendMessage(userInput);
};

recognition.onerror = (event) => {
    console.error('Speech recognition error', event.error);
};

// Function to send message (works for both text and voice input)
async function sendMessage(userInput) {
    if (userInput.trim() === '') return;

    const chatBox = document.getElementById('chat-box');
    const userMessage = document.createElement('p');
    userMessage.textContent = `You: ${userInput}`;
    chatBox.appendChild(userMessage);

    const apiKey = 'd389620d2b2223b7149d7863f381332bcaf9643e5a1a3ecc9ba71d106204cb4e'; // Replace with your actual API key
    const apiUrl = 'https://api.together.ai/v1/chat/completions';

    // Keep track of the conversation history
    if (!window.conversationHistory) {
        window.conversationHistory = [
            { role: "system", content: "You are a helpful assistant." }
        ];
    }

    // Add the user's message to the conversation history
    window.conversationHistory.push({ role: "user", content: userInput });

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
                messages: window.conversationHistory,
                max_tokens: 512,
                temperature: 0.7,
                top_p: 0.7,
                top_k: 50,
                repetition_penalty: 1,
                stop: ["<|eot_id|>"],
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.choices && result.choices.length > 0 && result.choices[0].message) {
            const aiResponse = result.choices[0].message.content;
            const aiMessage = document.createElement('p');
            aiMessage.textContent = `AI: ${aiResponse}`;
            chatBox.appendChild(aiMessage);

            // Speak the AI's response
            speakResponse(aiResponse);

            // Add the AI's response to the conversation history
            window.conversationHistory.push({ role: "assistant", content: aiResponse });
        } else {
            throw new Error('Unexpected response structure');
        }
    } catch (error) {
        console.error('Error fetching response:', error);
        const errorMessage = document.createElement('p');
        errorMessage.textContent = "AI: Sorry, I'm having trouble understanding you right now.";
        chatBox.appendChild(errorMessage);
        speakResponse("Sorry, I'm having trouble understanding you right now.");
    }

    chatBox.scrollTop = chatBox.scrollHeight;
    document.getElementById('user-input').value = '';
}

// Event listener for the send button (text input)
document.getElementById('send-btn').addEventListener('click', () => {
    const userInput = document.getElementById('user-input').value.trim();
    sendMessage(userInput);
});

// Event listener for the voice input button
document.getElementById('voice-btn').addEventListener('click', startListening);

// Optional: Function to list available voices
function listVoices() {
    const voices = synth.getVoices();
    console.log("Available voices:");
    voices.forEach((voice, i) => {
        console.log(`${i + 1}: ${voice.name} (${voice.lang})`);
    });
}

// Uncomment the next line to list available voices when the script loads
// listVoices();