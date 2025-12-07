// Base URL for your backend (change after deployment)
const BASE_URL = "https://medassist-backend-zhg6.onrender.com"; // Replace with deployed URL

// Floating chat button
document.addEventListener("DOMContentLoaded", () => {
    const chatBtn = document.querySelector("#floating-chat");
    if(chatBtn){
        chatBtn.addEventListener("click", () => {
            alert("MedAssist AI Chat is opening!"); 
            // OPTIONAL: programmatically open Zoho SalesIQ widget
        });
    }
});

// -------------------------------------------
// API FUNCTIONS
// -------------------------------------------

async function sendOtp(phone){
    const res = await fetch(`${BASE_URL}/api/send-otp`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ phone })
    });
    return res.json();
}

async function verifyOtp(phone, code, name, email){
    const res = await fetch(`${BASE_URL}/api/verify-otp`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ phone, code, name, email })
    });
    return res.json();
}

async function analyzeSymptoms(text){
    const res = await fetch(`${BASE_URL}/api/analyze-symptoms`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ text })
    });
    return res.json();
}

async function getAvailability(doctorId, date){
    const res = await fetch(`${BASE_URL}/api/availability?doctorId=${doctorId}&date=${date}`);
    return res.json();
}

async function bookAppointment(payload){
    const res = await fetch(`${BASE_URL}/api/book`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(payload)
    });
    return res.json();
}

// Optional: Voice input
async function startVoiceInput(){
    if(!('webkitSpeechRecognition' in window)){
        alert("Voice input not supported in this browser.");
        return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    recognition.onresult = function(event){
        const voiceText = event.results[0][0].transcript;
        console.log("Voice input:", voiceText);
        analyzeSymptoms(voiceText).then(res => console.log(res));
    };
}