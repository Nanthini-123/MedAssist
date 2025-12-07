// services.js
export const services = [
  // Doctor Consultation
  { id: 1, category: "Doctor Consultation", name: "General Consultation", calendlyEventType: "https://api.calendly.com/event_types/f4816f7a-8446-4793-9be0-a20e60e4ebf4" },
  { id: 2, category: "Doctor Consultation", name: "Eye Specialist", calendlyEventType: "https://api.calendly.com/event_types/1b493208-44b8-4305-97e8-d867e08d8243" },
  { id: 3, category: "Doctor Consultation", name: "Dental Specialist", calendlyEventType: "https://api.calendly.com/event_types/3b7fe9e0-1eaf-4642-b6f7-84f2d7d4f35c" },
  { id: 4, category: "Doctor Consultation", name: "Neurologist", calendlyEventType: "https://api.calendly.com/event_types/5d03fda4-ef01-4730-b675-b6ea7f3c24bf" },
  { id: 5, category: "Doctor Consultation", name: "Cardiologist", calendlyEventType: "https://api.calendly.com/event_types/2853edc1-8ea4-4187-b11a-e33bd3fd7f03" },
  { id: 6, category: "Doctor Consultation", name: "Orthopedic", calendlyEventType: "https://api.calendly.com/event_types/ff226ad7-7841-4784-8eb8-ba3d2cd5ad52" },
  { id: 7, category: "Doctor Consultation", name: "Pediatrician", calendlyEventType: "https://api.calendly.com/event_types/dfc16b7d-07fb-4cf8-b79c-4b1a69d74da1" },

  // Lab Tests
  { id: 8, category: "Lab Tests", name: "Blood Test", calendlyEventType: "https://api.calendly.com/event_types/e59d879c-a637-4d92-a023-f4df63097ed0" },
  { id: 9, category: "Lab Tests", name: "Urine Test", calendlyEventType: "https://api.calendly.com/event_types/7593cf94-3ed0-4aa6-9e61-113979f014fd" },
  { id: 10, category: "Lab Tests", name: "MRI", calendlyEventType: "https://api.calendly.com/event_types/44115a2b-dd1c-4530-b2dc-a2b3ac752d02" },
  { id: 11, category: "Lab Tests", name: "X-Ray", calendlyEventType: "https://api.calendly.com/event_types/5e8a9376-aadf-4fa3-b201-b87bdeb8ad38" },
  { id: 12, category: "Lab Tests", name: "CT Scan", calendlyEventType: "https://api.calendly.com/event_types/e6e5438d-2c64-4f78-93c1-cc9a27100e2d" },
  { id: 13, category: "Lab Tests", name: "Ultrasound", calendlyEventType: "https://api.calendly.com/event_types/f264e8af-1e9f-4bbb-9eda-cb0d9b4cc9bc" },

  // AI Symptoms Analyzer
  { id: 14, category: "AI Symptoms Analyzer", name: "Analyze Symptoms", calendlyEventType: "" }, // Calls your AI model

  // Vaccinations
  { id: 15, category: "Vaccinations", name: "COVID-19 Vaccine", calendlyEventType: "https://api.calendly.com/event_types/0915487d-2030-4457-9968-b9d12163b93c" },
  { id: 16, category: "Vaccinations", name: "Hepatitis B Vaccine", calendlyEventType: "https://api.calendly.com/event_types/1e7ec5ca-6837-4b2d-8924-eb9105890294" },
  { id: 17, category: "Vaccinations", name: "Tetanus B Vaccine", calendlyEventType: "https://api.calendly.com/event_types/83cb3e98-f11e-48e3-aba8-6a096182b503" },
  { id: 18, category: "Vaccinations", name: "MMR Vaccine", calendlyEventType: "https://api.calendly.com/event_types/7177a3d7-6eec-44c8-b4cc-d7876c403439" },

  // Health Packages & Other Services
  { id: 19, category: "Health Packages", name: "Full Body Checkup", calendlyEventType: "https://api.calendly.com/event_types/57d836ca-40f2-4a17-b56d-ad111ff7aab4" },
  { id: 20, category: "Health Packages", name: "Diabetes Screening", calendlyEventType: "https://api.calendly.com/event_types/5074efb5-ce09-4605-9a2d-474f6157f452" },
  { id: 21, category: "Health Packages", name: "Heart Health Package", calendlyEventType: "https://api.calendly.com/event_types/9d38cc5d-ef64-4be5-a16c-deddf8f5d299" },

  // Physiotherapy / Rehab
  { id: 22, category: "Physiotherapy", name: "Post-Surgery Rehab", calendlyEventType: "https://api.calendly.com/event_types/3279b437-2256-4822-8b39-0b26e91664cc" },
  { id: 23, category: "Physiotherapy", name: "Sports Injury", calendlyEventType: "https://api.calendly.com/event_types/ae84ba15-764b-44d2-ac4c-71c752d344cf" },
  { id: 24, category: "Physiotherapy", name: "Pain Management", calendlyEventType: "https://api.calendly.com/event_types/42fe3669-f805-4254-a29c-1147db2cf13f" },
];