export const runningData = {
  title: "Running & Aerobic Training",
  subtitle: "Building your engine — the science of cardiovascular fitness",
  color: "green",
  gradient: "from-emerald-500/20 to-green-600/10",
  borderColor: "border-emerald-500/20",
  accentColor: "text-emerald-400",
  icon: "🏃",
  sections: [
    {
      id: "zone-2",
      title: "Zone 2 Training",
      content: `Zone 2 is low-intensity aerobic training — the sweet spot for building aerobic base and metabolic health. Roughly 60–70% of max heart rate, where you can hold a conversation but feel a consistent effort.

**Why it matters:**
• Builds mitochondrial density — more mitochondria per muscle fiber = better fat oxidation
• Improves lactate threshold (the point where lactate accumulates faster than it clears)
• Low injury risk, high volume tolerance
• Dramatically improves insulin sensitivity
• Foundational for all endurance performance

**Rule of thumb:** 80% of your training volume should be Zone 2. This is the "80/20 rule" used by elite endurance athletes.`,
      tags: ["Zone 2", "Mitochondria", "Aerobic Base"],
    },
    {
      id: "vo2max",
      title: "VO2 Max",
      content: `VO2 max is the maximum rate of oxygen consumption during maximal exercise — the ceiling of your aerobic engine. It is arguably the single best predictor of all-cause mortality.

**How to improve VO2 max:**
• High-intensity intervals (4x4 min at 90–95% max HR) — the gold standard
• Norwegian 4x4 protocol: 4 mins at near-max, 3 min active recovery, 4 rounds, 2–3x/week
• Uphill intervals, track workouts, Tabata-style work

**Targets (men, age 20–39):**
• Poor: <37 ml/kg/min
• Average: 42–46 ml/kg/min
• Elite: >55 ml/kg/min`,
      tags: ["VO2 Max", "HIIT", "Longevity"],
    },
    {
      id: "running-form",
      title: "Running Form & Injury Prevention",
      content: `Most recreational runners overstride — heel striking far in front of their center of mass. This creates a braking force and increases injury risk.

**Key form cues:**
• **Cadence:** ~170–180 steps/min reduces impact forces
• **Lean:** slight forward lean from the ankles (not hips)
• **Foot strike:** midfoot, landing under your center of mass
• **Arms:** 90° bend, relaxed hands, front-to-back swing

**Common running injuries and prevention:**
• Runner's knee (PFPS) — hip strengthening, reduce mileage increase rate
• IT band syndrome — hip abductor strength, foam rolling
• Shin splints — gradual mileage increase (<10%/week), proper footwear
• Plantar fasciitis — calf mobility, arch support`,
      tags: ["Form", "Cadence", "Injury Prevention"],
    },
  ],
  studies: [
    {
      title: "VO2 Max as a Predictor of All-Cause Mortality",
      journal: "JAMA Network Open",
      year: 2018,
      url: "https://pubmed.ncbi.nlm.nih.gov/30646238/",
      summary: "Low cardiorespiratory fitness associated with higher mortality than smoking, diabetes",
    },
    {
      title: "Zone 2 Training and Mitochondrial Biogenesis",
      journal: "Journal of Physiology",
      year: 2019,
      url: "https://pubmed.ncbi.nlm.nih.gov/31328293/",
      summary: "Low-intensity training is uniquely effective at driving mitochondrial adaptations",
    },
  ],
  quickStats: [
    { label: "Ideal Zone 2 heart rate", value: "60–70%", note: "of max HR" },
    { label: "Training volume in Zone 2", value: "80%", note: "elite athlete approach" },
    { label: "Cadence target", value: "170–180", note: "steps/min" },
    { label: "Mileage increase limit", value: "<10%", note: "per week" },
  ],
};
