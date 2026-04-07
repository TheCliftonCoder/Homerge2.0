# Homerge

**Homerge** is a next-generation UK property platform connecting Estate Agents and Applicants. Built on a modern **Laravel + React (Inertia.js)** stack, it leverages robust geospatial mapping algorithms and AI-driven search capabilities to deliver a stunning and seamless property discovery experience.

## 🚀 Key Features

*   **Intelligent AI Search:** Filter properties effortlessly using natural language prompts powered by Google Gemini NLP (e.g., *"3 bedroom apartments in Reading under £500k within 5 miles with parking"*).
*   **Geographical Radius Searches:** Integrates directly with MapBox and `postcodes.io` to geocode granular, rooftop-accurate coordinates dynamically as properties are listed. This subsequently powers highly efficient, server-side geospatial radius filtering for users. 
*   **Role-based Architecture:** Segregated logic separating Estate Agents (who manage listings and upload image sets) and Applicants (who parse results, favourite selections, and enquire).
*   **Premium Web Aesthetic:** A cutting-edge UI heavily exploiting modern Tailwind utilities, subtle micro-animations, structured typography, and fluid user interactions.

## 🛠 Tech Stack

*   **Backend:** Laravel (PHP), SQLite (Development) / MySQL (Production equivalent)
*   **Frontend:** React, Inertia.js, Tailwind CSS
*   **Third-party Integrations:**
    *   **Mapbox Geocoding API:** Rooftop coordinate resolution for structured street addresses.
    *   **Postcodes.io:** Public UK postal sector approximations.
    *   **Google Gemini:** Search param extraction from complex natural language.

---

<p align="center">
    <i>Developed directly as an exploratory prototype demonstrating modern, agentic workflows inside standard web infrastructure.</i>
</p>
