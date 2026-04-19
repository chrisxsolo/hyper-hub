export const weightLossData = {
  title: "Weight Loss",
  subtitle: "The science of fat loss — what actually works and why",
  color: "blue",
  gradient: "from-blue-500/20 to-cyan-600/10",
  borderColor: "border-blue-500/20",
  accentColor: "text-blue-400",
  icon: "⚖️",
  sections: [
    {
      id: "energy-balance",
      title: "Energy Balance — The Foundation",
      content: `Fat loss at its core is thermodynamics: you must be in a caloric deficit (consume fewer calories than you expend). This is not controversial. But the *quality* of your diet affects how easy or sustainable that deficit is.

**TDEE (Total Daily Energy Expenditure) components:**
• **BMR** — basal metabolic rate (~60–70% of TDEE)
• **TEF** — thermic effect of food (~10%)
• **NEAT** — non-exercise activity thermogenesis (~15–20%) — fidgeting, walking, posture
• **EAT** — exercise activity thermogenesis (~5–15%)

**NEAT is often the most underappreciated lever.** Active individuals spontaneously burn 1,000+ more calories/day than sedentary ones even without formal exercise.`,
      tags: ["Calories", "TDEE", "Deficit"],
    },
    {
      id: "protein",
      title: "Protein — The Most Important Macro",
      content: `When in a caloric deficit, protein intake determines whether you lose fat + muscle or fat alone.

**Why protein is critical for fat loss:**
• Highest thermic effect (~25–30% of calories burned in digestion)
• Highest satiety — suppresses appetite and ghrelin
• Preserves lean mass during caloric restriction
• Supports muscle protein synthesis even in a deficit

**Target: 0.7–1g per lb of body weight (or ~1.6–2.2g per kg)**

Prioritize whole food sources: chicken breast, eggs, Greek yogurt, cottage cheese, fish, lean beef.`,
      tags: ["Protein", "Muscle Preservation", "Satiety"],
    },
    {
      id: "visceral-fat",
      title: "Visceral Fat — Why It's Dangerous",
      content: `Not all fat is equal. Visceral fat — the fat packed around your organs (liver, intestines, heart) — is metabolically active and inflammatory.

**What visceral fat does:**
• Releases inflammatory cytokines (IL-6, TNF-α) chronically
• Causes insulin resistance (especially liver fat → hepatic insulin resistance)
• Elevates cardiovascular risk
• Drives elevated triglycerides and low HDL

**Most effective ways to reduce visceral fat:**
• Caloric deficit (visceral fat responds faster than subcutaneous)
• Resistance training
• Zone 2 cardio
• Sleep optimization (poor sleep preferentially increases visceral fat)
• Reducing refined carbs and alcohol`,
      tags: ["Visceral Fat", "Inflammation", "Metabolic Risk"],
    },
    {
      id: "sustainable-approach",
      title: "Sustainable Fat Loss",
      content: `Crash diets fail because they create large deficits that tank metabolism (adaptive thermogenesis) and cause muscle loss — the worst combination.

**The sustainable approach:**
• Deficit of 300–500 kcal/day (0.5–1 lb/week)
• High protein throughout (even at maintenance)
• Resistance training 3–4x/week to preserve muscle
• Diet breaks every 8–12 weeks (2 weeks at maintenance) to reset leptin
• Track food at least periodically — most people grossly underestimate intake

**Mindset:** You're not dieting. You're building a lifestyle that naturally results in a lean body composition.`,
      tags: ["Sustainable", "Deficit Strategy", "Muscle Retention"],
    },
  ],
  studies: [
    {
      title: "NEAT: The Crouching Tiger Hidden Dragon of Societal Weight Gain",
      journal: "Arteriosclerosis, Thrombosis, and Vascular Biology",
      year: 2006,
      url: "https://pubmed.ncbi.nlm.nih.gov/16497986/",
      summary: "NEAT accounts for major differences in daily energy expenditure between individuals",
    },
    {
      title: "Effects of High Protein on Body Composition During Caloric Restriction",
      journal: "Journal of the International Society of Sports Nutrition",
      year: 2016,
      url: "https://pubmed.ncbi.nlm.nih.gov/27053956/",
      summary: "High protein diet preserved lean mass and reduced fat mass more than control diet",
    },
  ],
  quickStats: [
    { label: "Recommended deficit", value: "300–500", note: "kcal/day" },
    { label: "Protein target", value: "0.7–1g", note: "per lb bodyweight" },
    { label: "Sustainable loss rate", value: "0.5–1 lb", note: "per week" },
    { label: "TEF for protein", value: "25–30%", note: "of calories burned in digestion" },
  ],
};
