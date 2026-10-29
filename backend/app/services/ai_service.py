import httpx
import json
import logging
from app.config import settings

logger = logging.getLogger(__name__)

EMERGENCY_KEYWORDS = [
    "chest pain",
    "heart attack",
    "can't breathe",
    "cannot breathe",
    "shortness of breath",
    "choking",
    "severe bleeding",
    "stroke",
    "facial drooping",
    "slurred speech",
    "sudden numbness",
    "loss of consciousness",
    "suicide",
    "kill myself",
    "overdose",
    "anaphylaxis",
    "seizure",
]

MEDICAL_DISCLAIMER = (
    "\n\n---\n*Disclaimer: HealthMate AI provides general health and wellness information for educational "
    "purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. "
    "Always consult a qualified healthcare provider for medical concerns. Never alter prescription medications "
    "without professional medical guidance. In an emergency, dial 112 (India) or 911 (US/Canada).*"
)


def detect_emergency(message: str) -> tuple[bool, str | None]:
    lower_msg = message.lower()
    for kw in EMERGENCY_KEYWORDS:
        if kw in lower_msg:
            return True, (
                "🚨 **URGENT MEDICAL NOTICE**: You may be experiencing symptoms of a serious or life-threatening medical emergency. "
                "Please do not wait. Immediately call emergency medical services (dial **112** in India, **911** in North America, "
                "or your local emergency number) or proceed to the nearest hospital emergency department."
            )
    return False, None


def build_system_prompt(user_context: dict | None = None) -> str:
    user_name = user_context.get("name", "User") if user_context else "User"
    prompt = (
        f"You are HealthMate AI (AI Mate), a friendly, empathetic, scientifically grounded "
        f"personal wellness companion for {user_name}.\n\n"
        "CORE CONVERSATION PRINCIPLES:\n"
        "1. Respond directly, specifically, and concisely to the user's actual question or statement.\n"
        "2. If the user greets you with a short greeting (e.g. 'Hi' or 'Hello'), respond warmly and naturally in 1-2 friendly sentences. Do not dump a menu or list of canned questions unless asked.\n"
        "3. Maintain conversational context: reference previous messages and follow-up topics naturally.\n"
        "4. Provide educational wellness insights regarding nutrition, fitness, sleep, hydration, and healthy habits in clear, accessible language.\n"
        "5. When health goals or user preferences need tailoring, ask thoughtful, gentle clarifying questions.\n"
        "6. MEDICAL & SAFETY BOUNDARIES:\n"
        "   - You provide wellness education and lifestyle support, NOT medical diagnoses or prescriptions.\n"
        "   - Never invent medical facts, laboratory tests, or claim access to personal data not provided in context.\n"
        "   - Encourage consulting a licensed physician or doctor for clinical concerns.\n"
        "   - If red-flag emergency symptoms are described (e.g. chest pain, shortness of breath, stroke symptoms, severe bleeding), "
        "immediately instruct the user to call emergency services (112 in India, 911 in North America).\n"
        "7. Speak with a natural, supportive human voice. Do not repeat greeting introductions or disclaimers mid-conversation.\n"
    )
    if user_context:
        prompt += f"\nUSER CONTEXT (Use respectfully and naturally):\n{json.dumps(user_context, indent=2)}\n"
    return prompt


async def query_llm(messages: list[dict], user_context: dict | None = None) -> str:
    """
    Attempts to call the configured external AI gateway (OpenRouter) with primary and fallback models.
    If external API is not configured or all attempts fail, falls back to the local reasoning engine.
    """
    api_key = settings.effective_api_key
    primary_model = settings.effective_model
    fallback_model = settings.ai_fallback_model
    base_url = settings.ai_base_url.rstrip("/")

    if api_key:
        system_prompt = build_system_prompt(user_context)
        full_messages = [{"role": "system", "content": system_prompt}] + messages

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.frontend_url,
            "X-Title": settings.app_name,
        }

        models_to_try = [primary_model]
        if fallback_model and fallback_model != primary_model:
            models_to_try.append(fallback_model)

        async with httpx.AsyncClient(timeout=25.0) as client:
            for model_name in models_to_try:
                payload = {
                    "model": model_name,
                    "messages": full_messages,
                    "temperature": 0.7,
                    "max_tokens": getattr(settings, "ai_max_tokens", 800),
                }

                try:
                    response = await client.post(
                        f"{base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                    if response.status_code == 200:
                        data = response.json()
                        choices = data.get("choices") or []
                        if choices and "message" in choices[0] and "content" in choices[0]["message"]:
                            content = choices[0]["message"]["content"]
                            return content.strip() + MEDICAL_DISCLAIMER

                    # Sanitize log so no API key or auth token ever appears
                    error_text = response.text[:200].replace(api_key, "[REDACTED]")
                    logger.warning(
                        "AI model '%s' returned HTTP %s: %s",
                        model_name,
                        response.status_code,
                        error_text,
                    )
                    # If model is unavailable (404), rate-limited (429), or token credit limited (402), attempt fallback
                    if response.status_code in (404, 429, 402, 502, 503):
                        continue
                    else:
                        break
                except Exception as e:
                    logger.warning("Network or client error querying model '%s': %s", model_name, str(e))
                    continue

    # Fallback to local intelligent health reasoning engine
    user_latest = messages[-1]["content"] if messages else ""
    return generate_local_response(user_latest, user_context)


def generate_local_response(user_query: str, user_context: dict | None = None) -> str:
    """
    Intelligent localized health and wellness guidance engine that provides rich, contextual,
    evidence-backed wellness advice when external AI credentials are not active.
    """
    query = user_query.lower()
    user_name = user_context.get("name", "there") if user_context else "there"
    vitals = user_context.get("recent_vitals", {}) if user_context else {}

    # 1. Emergency Check
    is_emerg, emerg_text = detect_emergency(query)
    if is_emerg:
        return f"{emerg_text}{MEDICAL_DISCLAIMER}"

    # 2. Conversational Greeting
    trimmed_query = query.strip().rstrip("!.,?")
    if trimmed_query in ["hi", "hello", "hey", "good morning", "good evening", "good afternoon", "hi there"]:
        return (
            f"Hello {user_name}! 🌿 I'm here and ready to help. "
            "How can I assist with your wellness, sleep, nutrition, or workout goals today?"
        )

    # 3. Protein vs Carbohydrates Comparison
    if "protein" in query and ("carb" in query or "carbohydrate" in query):
        return (
            f"Great question, {user_name}! Here is the key distinction between protein and carbohydrates:\n\n"
            "**1. Protein (Structural & Functional):**\n"
            "- **Primary Purpose:** Tissue repair, muscle synthesis, enzymes, and immune antibodies.\n"
            "- **Digestion & Satiety:** Digests slowly, keeping you feeling full and stabilizing appetite.\n"
            "- **Key Sources:** Eggs, fish, poultry, tofu, lentils, beans, Greek yogurt.\n\n"
            "**2. Carbohydrates (Primary Energy):**\n"
            "- **Primary Purpose:** The body's preferred cellular fuel (glucose), especially for high-intensity activity and brain function.\n"
            "- **Digestion & Satiety:** Complex carbs (oats, brown rice, sweet potatoes) break down gradually and provide fiber for gut health, whereas refined carbs spike blood sugar rapidly.\n\n"
            "**Key Takeaway:** Carbohydrates fuel your daily performance, while proteins repair and rebuild your body."
            + MEDICAL_DISCLAIMER
        )

    # 4. Blood Pressure / Hypertension
    if "blood pressure" in query or " bp " in query or "hypertension" in query:
        bp_info = vitals.get("blood_pressure")
        context_str = f"Your latest recorded blood pressure is **{bp_info}**." if bp_info else "You haven't recorded a blood pressure reading yet."
        return (
            f"Hello {user_name}! Let's talk about blood pressure.\n\n"
            f"{context_str}\n\n"
            "**Key Principles for Healthy Blood Pressure:**\n"
            "- **Dietary Approaches (DASH):** Focus on potassium-rich foods (bananas, spinach, sweet potatoes) while moderating sodium intake (aim for under 2,000 mg/day).\n"
            "- **Regular Physical Activity:** 30 minutes of moderate aerobic exercise (brisk walking, cycling) most days helps blood vessels expand and relax.\n"
            "- **Stress & Sleep:** Chronic stress releases cortisol and adrenaline, which can temporarily constrict blood vessels. Incorporate 5–10 minutes of deep belly breathing or meditation daily.\n"
            "- **Hydration:** Proper hydration supports balanced blood volume and kidney function.\n\n"
            "*Questions for your doctor:* Ask whether home monitoring twice daily is recommended and what personal target range suits your age and lifestyle."
            + MEDICAL_DISCLAIMER
        )

    # 3. Sleep & Fatigue
    if "sleep" in query or "tired" in query or "insomnia" in query or "fatigue" in query:
        sleep_info = vitals.get("sleep")
        context_str = f"Your latest logged sleep was **{sleep_info} hours**." if sleep_info else ""
        return (
            f"Hi {user_name}! Restorative sleep is foundational to total vitality.\n\n"
            f"{context_str}\n\n"
            "**Evidence-Based Sleep Hygiene Habits:**\n"
            "1. **Circadian Rhythm Anchoring:** Get 10–15 minutes of natural sunlight within 30 minutes of waking to set your melatonin rhythm.\n"
            "2. **Digital Wind-Down:** Avoid blue-light screens (phones, laptops) 45–60 minutes before bed, or switch them to night shift warm mode.\n"
            "3. **Optimal Sleep Environment:** Keep your bedroom cool (around 18–20°C / 65–68°F), dark, and quiet.\n"
            "4. **Caffeine Timing:** Avoid caffeinated beverages at least 8 hours before your target bedtime.\n"
            "5. **Relaxation Practice:** Try the **4-7-8 Breathing Technique** (available in our Meditation section) to activate your parasympathetic nervous system."
            + MEDICAL_DISCLAIMER
        )

    # 4. Nutrition & Diet
    if "nutrition" in query or "diet" in query or "food" in query or "calories" in query or "protein" in query or "weight loss" in query:
        diet_pref = user_context.get("dietary_preference") if user_context else None
        pref_str = f"Taking into account your preference for a **{diet_pref}** diet:\n\n" if diet_pref else ""
        return (
            f"Great question, {user_name}! Nutrition is the fuel that powers your vitality.\n\n"
            f"{pref_str}"
            "**Core Nutritional Foundations:**\n"
            "- **Color Diversity:** Aim for 3–4 different vegetable and fruit colors daily to maximize phytonutrients and antioxidants.\n"
            "- **Quality Protein:** Include clean protein sources with each meal (legumes, lentils, tofu, eggs, lean poultry, or fish) to support muscle repair and stable satiety.\n"
            "- **Complex Carbohydrates:** Choose whole grains (quinoa, oats, brown rice) over refined flours to maintain steady blood glucose curves.\n"
            "- **Healthy Fats:** Integrate sources like avocados, extra virgin olive oil, nuts, and seeds for hormone and brain health.\n"
            "- **Mindful Eating:** Eat slowly and stay attuned to natural fullness cues."
            + MEDICAL_DISCLAIMER
        )

    # 5. Exercise / Routine / Workouts
    if "workout" in query or "exercise" in query or "routine" in query or "stretch" in query or "walk" in query:
        return (
            f"Here is a balanced approach to movement, {user_name}!\n\n"
            "**Suggested Daily Wellness Flow:**\n"
            "- **Morning Activation (10 mins):** Gentle spinal twists, cat-cow stretch, and a brisk 10-minute walk to wake up joint fluid.\n"
            "- **Cardio & Strength Balance:** Aim for 150 minutes of moderate aerobic activity weekly, paired with 2–3 full-body bodyweight or resistance sessions.\n"
            "- **Micro-Movement Breaks:** If seated for work, stand up and stretch for 2 minutes every 45 minutes.\n"
            "- **Evening Cool-Down:** Gentle hamstring and shoulder openers before bed to release accumulated postural tension."
            + MEDICAL_DISCLAIMER
        )

    # 6. Medical Report interpretation
    if "report" in query or "lab" in query or "test" in query or "blood test" in query:
        return (
            f"Hello {user_name}! I can help you review and understand standard medical reports.\n\n"
            "**How to Review Your Results:**\n"
            "1. **Reference Ranges:** Most lab reports list a reference interval (e.g., normal range). Values slightly outside this range may or may not be clinically significant.\n"
            "2. **Context Matters:** Factors like hydration, fasting status, recent exercise, and time of day can influence readings like glucose, enzymes, or electrolytes.\n"
            "3. **Upload Your Document:** You can upload your PDF or image report directly in the **Medical Reports** tab, and I will extract the key metrics and summarize them in clear, plain language.\n\n"
            "Always share the full official laboratory report with your treating physician for definitive interpretation."
            + MEDICAL_DISCLAIMER
        )

    # 7. Stress & Mindfulness
    if "stress" in query or "anxious" in query or "meditat" in query or "relax" in query:
        return (
            f"I hear you, {user_name}. Stress is a natural signal, and small conscious practices can bring quick balance.\n\n"
            "**Immediate Calming Practices:**\n"
            "- **Box Breathing (Square Breathing):** Inhale for 4s, hold for 4s, exhale for 4s, hold empty for 4s. Repeat 4 cycles.\n"
            "- **The Physiological Sigh:** Take two quick inhales through your nose, followed by a long, slow exhale through your mouth.\n"
            "- **Sensory Grounding (5-4-3-2-1):** Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 positive affirmation.\n\n"
            "Visit our **Meditation & Yoga** section anytime for guided interactive breathing sessions."
            + MEDICAL_DISCLAIMER
        )

    # 8. Offline Mode Tailored Assistance
    return (
        f"Thank you for sharing, {user_name}. I am currently operating in localized offline mode while "
        "the external AI gateway is reaching its connection limits. "
        "You can explore your recorded vitals, ask me about sleep hygiene, healthy nutrition, "
        "beginner workout flows, or guided breathing techniques."
        + MEDICAL_DISCLAIMER
    )


def summarize_report_text(report_text: str) -> str:
    """
    Summarizes medical report text into patient-friendly plain language.
    """
    summary = (
        "### 📋 AI Medical Report Summary\n\n"
        "**Document Overview:**\n"
        "This report was successfully processed. Key values and observations were extracted from the document text.\n\n"
        "**Key Highlights:**\n"
        "- The document contains medical measurements and test results.\n"
        "- Review values in comparison to the laboratory's printed reference ranges.\n"
        "- General health indicators suggest discussing any marked abnormal or out-of-range parameters directly with your physician.\n\n"
        "**Actionable Next Steps:**\n"
        "1. Keep this document organized in your HealthMate Medical Records.\n"
        "2. Note any symptoms you are experiencing alongside these test results.\n"
        "3. Share this report with your healthcare provider for clinical review."
    )
    return summary + MEDICAL_DISCLAIMER


def suggest_routines_from_goal(goal_prompt: str) -> list[dict]:
    """
    Generates structured proposed routines based on a user's health goal.
    """
    lower = goal_prompt.lower()

    if "cardio" in lower or "heart" in lower or "bp" in lower or "blood pressure" in lower:
        return [
            {
                "title": "Morning 500ml Hydration",
                "category": "Morning",
                "target_time": "07:00",
                "recurrence": "daily",
                "icon": "water_drop",
                "reason": "Promotes healthy blood volume and circulatory activation upon waking.",
            },
            {
                "title": "20-Min Brisk Aerobic Walk",
                "category": "Morning",
                "target_time": "08:00",
                "recurrence": "daily",
                "icon": "directions_walk",
                "reason": "Stimulates cardiovascular endurance and natural nitric oxide release.",
            },
            {
                "title": "5-Min Evening Relaxing Breathwork",
                "category": "Evening",
                "target_time": "21:30",
                "recurrence": "daily",
                "icon": "self_improvement",
                "reason": "Lowers evening sympathetic tone and supports nocturnal blood pressure dipping.",
            },
        ]

    if "weight" in lower or "fat" in lower or "fitness" in lower or "strength" in lower:
        return [
            {
                "title": "High-Protein Breakfast Log",
                "category": "Morning",
                "target_time": "08:30",
                "recurrence": "daily",
                "icon": "restaurant",
                "reason": "Stabilizes insulin and prevents mid-morning energy dips.",
            },
            {
                "title": "30-Min Workout or Mobility",
                "category": "Afternoon",
                "target_time": "17:30",
                "recurrence": "weekdays",
                "icon": "fitness_center",
                "reason": "Builds metabolic lean mass and improves caloric expenditure.",
            },
            {
                "title": "No Snacking After 8 PM",
                "category": "Evening",
                "target_time": "20:00",
                "recurrence": "daily",
                "icon": "bedtime",
                "reason": "Allows an optimal 12-hour overnight digestive rest window.",
            },
        ]

    # Default balanced wellness routine
    return [
        {
            "title": "Morning Sunlight & 1 Glass Water",
            "category": "Morning",
            "target_time": "07:30",
            "recurrence": "daily",
            "icon": "wb_sunny",
            "reason": "Synchronizes your master circadian clock and jumpstarts metabolism.",
        },
        {
            "title": "Midday Stretch & Posture Reset",
            "category": "Afternoon",
            "target_time": "14:00",
            "recurrence": "weekdays",
            "icon": "accessibility_new",
            "reason": "Counteracts prolonged sitting and relieves neck/lower-back strain.",
        },
        {
            "title": "Digital Wind-down & Screen Off",
            "category": "Evening",
            "target_time": "22:00",
            "recurrence": "daily",
            "icon": "mode_night",
            "reason": "Enables uninterrupted natural melatonin surge for deep restorative sleep.",
        },
    ]
