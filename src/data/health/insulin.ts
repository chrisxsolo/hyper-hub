export const insulinData = {
  title: "Insulin & Insulin Resistance",
  subtitle: "Understanding your body's master metabolic hormone",
  color: "amber",
  gradient: "from-amber-500/20 to-orange-600/10",
  borderColor: "border-amber-500/20",
  accentColor: "text-amber-400",
  icon: "🩸",
  sections: [
    {
      id: "what-is-insulin",
      title: "What Is Insulin?",
      content: `Insulin is a peptide hormone produced by the beta cells of the pancreatic islets. It is the body's primary anabolic hormone — it regulates metabolism of carbohydrates, fats, and proteins by promoting the absorption of glucose from the blood into body cells (liver, skeletal muscle, adipose tissue).

After you eat carbohydrates, blood glucose rises. The pancreas detects this and secretes insulin into the bloodstream. Insulin "unlocks" cells so glucose can enter and be used for energy or stored as glycogen and fat.`,
      tags: ["Hormone", "Pancreas", "Glucose"],
    },
    {
      id: "what-does-it-do",
      title: "What Does Insulin Do?",
      content: `Insulin has several critical functions beyond just glucose regulation:

• **Drives glucose into cells** — opens GLUT4 transporters in muscle and fat cells
• **Signals the liver** — promotes glycogen synthesis and stops glucose output
• **Promotes fat storage** — activates lipoprotein lipase, inhibits fat breakdown (lipolysis)
• **Stimulates protein synthesis** — muscle growth signal
• **Suppresses glucagon** — prevents the liver from releasing stored glucose

Think of insulin as a "storage hormone." When it's high, your body is in build-and-store mode.`,
      tags: ["Glucose Transport", "Fat Storage", "Protein Synthesis"],
    },
    {
      id: "insulin-resistance",
      title: "What Is Insulin Resistance?",
      content: `Insulin resistance occurs when cells in muscles, fat, and the liver don't respond well to insulin and can't easily take up glucose from the blood. As a result, the pancreas makes more insulin to help glucose enter cells. Over time, the beta cells can't keep up, and blood sugar rises — leading to prediabetes and Type 2 Diabetes.

**Key drivers of insulin resistance:**
• Excess visceral (belly) fat — especially ectopic fat in the liver
• Chronic high-carbohydrate diet
• Physical inactivity
• Chronic sleep deprivation
• Chronic stress (elevated cortisol)
• Processed foods and seed oils (inflammatory)

Insulin resistance is largely invisible for years — it's a silent condition with a long fuse.`,
      tags: ["Metabolic Disease", "Silent Epidemic", "Prevention"],
    },
    {
      id: "type3-diabetes",
      title: "Type 3 Diabetes & The Brain",
      content: `Emerging research has coined the term "Type 3 Diabetes" to describe Alzheimer's disease driven by insulin resistance in the brain. The brain is insulin-dependent — neurons use insulin signaling to function and survive.

When the brain becomes insulin resistant:
• Neurons can't get adequate fuel (glucose uptake impaired)
• Amyloid plaques accumulate more readily
• Tau protein becomes hyperphosphorylated (leading to tangles)
• Neuroinflammation increases
• Memory, cognition, and mood suffer

**Key implication:** What you eat and how insulin-sensitive you are may have a direct effect on your long-term cognitive health. This is one of the most compelling reasons to manage metabolic health early.`,
      tags: ["Alzheimer's", "Brain Health", "Neuroinflammation"],
    },
    {
      id: "how-to-fix",
      title: "How to Improve Insulin Sensitivity",
      content: `The good news — insulin resistance is largely reversible through lifestyle:

• **Resistance training** — the #1 intervention. Muscle tissue is the largest sink for glucose. More muscle = better glucose disposal.
• **Zone 2 cardio** — steady-state aerobic exercise improves mitochondrial function and fat oxidation
• **Low-carbohydrate diets** — reducing carb intake directly lowers insulin demand
• **Time-restricted eating / Intermittent fasting** — lowers fasting insulin
• **Sleep 7–9 hours** — even one night of poor sleep blunts insulin sensitivity by ~25%
• **Reduce chronic stress** — cortisol directly raises blood glucose
• **Lose visceral fat** — especially liver fat; this has the most dramatic effect`,
      tags: ["Exercise", "Diet", "Sleep", "Lifestyle"],
    },
  ],
  studies: [
    {
      title: "Brain Insulin Resistance in Type 2 Diabetes and Alzheimer Disease",
      journal: "Nature Reviews Neurology",
      year: 2018,
      url: "https://pubmed.ncbi.nlm.nih.gov/29777228/",
      summary: "Comprehensive review linking cerebral insulin resistance to AD pathology",
    },
    {
      title: "Exercise and Insulin Sensitivity: A Review",
      journal: "Journal of Applied Physiology",
      year: 2020,
      url: "https://pubmed.ncbi.nlm.nih.gov/32108006/",
      summary: "How acute and chronic exercise improve whole-body insulin sensitivity",
    },
    {
      title: "Short-term sleep deprivation with nocturnal light exposure decreases insulin sensitivity",
      journal: "PNAS",
      year: 2022,
      url: "https://pubmed.ncbi.nlm.nih.gov/35344470/",
      summary: "Even mild sleep disruption impairs glucose metabolism significantly",
    },
    {
      title: "Low-Carbohydrate Diet Reverses Fatty Liver and Insulin Resistance",
      journal: "Cell Metabolism",
      year: 2021,
      url: "https://pubmed.ncbi.nlm.nih.gov/33338439/",
      summary: "Dietary carb restriction directly reduces liver fat and improves insulin sensitivity",
    },
  ],
  quickStats: [
    { label: "Americans with Prediabetes", value: "88M+", note: "84% undiagnosed" },
    { label: "Sleep deprivation insulin impact", value: "~25%", note: "sensitivity drop" },
    { label: "Visceral fat reduction needed", value: "5–10%", note: "to see major improvement" },
    { label: "Exercise effect (one session)", value: "24–48h", note: "insulin sensitizing" },
  ],
};
