"use client";

import { createContext, useContext, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Brain,
  Zap,
  Shield,
  Dumbbell,
  Moon,
  Flame,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  FlaskConical,
  X,
  BookOpen,
  Users,
} from "lucide-react";

// ─── Animation ────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "show" : "hidden"} variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Glossary ─────────────────────────────────────────────────────────────────
type GlossaryEntry = Readonly<{
  title: string;
  body: string;
  learnMore?: string;
}>;

const glossaryData = {
  alzheimers: {
    title: "Alzheimer's Disease",
    body: "A progressive neurodegenerative disease causing memory loss and cognitive decline. Growing research links it to insulin resistance in the brain — neurons starved of glucose accumulate amyloid plaques and tau tangles. Some researchers now call it 'Type 3 Diabetes' to reflect this metabolic connection.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/30154698/",
  },
  visceralFat: {
    title: "Visceral Fat",
    body: "Fat stored deep in the abdomen, surrounding internal organs (liver, pancreas, intestines). Unlike subcutaneous fat under the skin, visceral fat is metabolically active — it secretes inflammatory signals and free fatty acids that directly impair insulin signaling. Waist circumference is a better metabolic risk marker than BMI because of visceral fat.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/33822280/",
  },
  glut4: {
    title: "GLUT4 (Glucose Transporter Type 4)",
    body: "A protein channel that acts as a 'glucose door' in muscle and fat cells. Normally, insulin signals GLUT4 to move to the cell surface to allow glucose entry. The crucial insight: muscle contractions also trigger GLUT4 movement independently of insulin — meaning exercise can lower blood sugar even in the presence of insulin resistance.",
  },
  hyperinsulinemia: {
    title: "Hyperinsulinemia",
    body: "Chronically elevated insulin levels in the blood. The pancreas overproduces insulin in an attempt to overcome resistant cells. This state can persist for years or decades before blood sugar visibly rises — yet elevated insulin itself drives fat storage, inflammation, and cardiovascular risk independent of blood sugar.",
  },
  betaCells: {
    title: "Beta Cells (Pancreatic)",
    body: "Specialized cells in the Islets of Langerhans in the pancreas that produce and secrete insulin. Under chronic insulin resistance, beta cells work overtime. Eventually, beta cell exhaustion leads to declining insulin production — at this point blood glucose rises and Type 2 diabetes is formally diagnosed.",
  },
  ketones: {
    title: "Ketones (Ketone Bodies)",
    body: "Alternative fuel molecules produced by the liver when carbohydrate intake is low or during fasting. Unlike glucose, ketones don't require insulin to enter brain cells — they cross the blood-brain barrier and fuel neurons directly. This insulin bypass is why fasting, low-carb diets, and MCT oil are studied for cognitive protection.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/32900937/",
  },
  cortisol: {
    title: "Cortisol",
    body: "The primary stress hormone secreted by the adrenal glands. Short bursts are essential for fight-or-flight responses. Chronically elevated cortisol triggers gluconeogenesis in the liver (raising blood glucose), disrupts sleep, suppresses immune function, and directly worsens insulin sensitivity over time.",
  },
  raas: {
    title: "RAAS (Renin-Angiotensin-Aldosterone System)",
    body: "A kidney hormone cascade that regulates blood pressure and fluid balance. When sodium intake is very low, RAAS activates to conserve sodium — but this paradoxically worsens insulin sensitivity. Research shows aggressive sodium restriction increases fasting insulin through this mechanism, challenging conventional 'low sodium' advice.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/29776744/",
  },
  mctOil: {
    title: "MCT Oil (Medium-Chain Triglycerides)",
    body: "A fat derived primarily from coconut oil that is rapidly absorbed and efficiently converted to ketones by the liver. Unlike long-chain fats, MCTs bypass standard fat digestion. MCT oil can raise blood ketone levels without strict carbohydrate restriction, and is being studied for cognitive support in insulin-resistant brains.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/32900937/",
  },
  amyloidPlaques: {
    title: "Amyloid Plaques",
    body: "Deposits of beta-amyloid protein that accumulate between neurons — a hallmark of Alzheimer's disease. The brain's glymphatic system clears amyloid primarily during deep sleep. Insulin resistance impairs both this clearance process and the cellular signaling that prevents amyloid from forming in the first place.",
  },
  insulinResistance: {
    title: "Insulin Resistance",
    body: "A condition where cells in muscle, fat, and the liver fail to respond adequately to insulin's signal to absorb glucose. The pancreas compensates by producing more insulin. Over time, this leads to hyperinsulinemia, then elevated blood sugar, and eventually type 2 diabetes. It is widely considered the root of most major chronic diseases.",
  },
  cephalicPhase: {
    title: "Cephalic Phase Insulin Response",
    body: "A reflex insulin secretion triggered by the sight, smell, or taste of food — before any glucose enters the bloodstream. The brain anticipates incoming food and pre-loads insulin. Sweet taste — even from zero-calorie artificial sweeteners — can trigger this response, explaining why 'calorie-free' doesn't always mean metabolically neutral.",
  },
  glp1Drugs: {
    title: "GLP-1 Receptor Agonists (e.g., Ozempic, Wegovy)",
    body: "Drugs like semaglutide that mimic the gut hormone GLP-1 to suppress appetite and lower blood sugar. Highly effective for weight loss and glycemic control. Important caveat: a significant portion of weight lost is muscle mass — clinicians recommend pairing these medications with resistance training and high protein intake to preserve lean mass.",
  },
  glymphatic: {
    title: "Glymphatic System",
    body: "The brain's waste-clearance network, which uses cerebrospinal fluid to flush out metabolic byproducts (including amyloid-beta) primarily during deep sleep. The system is largely inactive while awake — making deep, restorative sleep critical for long-term cognitive health and Alzheimer's prevention.",
  },
  gluconeogenesis: {
    title: "Gluconeogenesis",
    body: "The process by which the liver synthesizes new glucose from non-carbohydrate sources (amino acids, lactate, glycerol). Essential during fasting. Cortisol strongly stimulates gluconeogenesis — meaning chronic stress can raise blood glucose even without consuming any carbohydrates.",
  },
  thermicEffect: {
    title: "Thermic Effect of Food (TEF)",
    body: "The energy your body burns to digest, absorb, and metabolize food. Protein has the highest TEF (~25–30% of calories burned in processing), carbs ~6–8%, and fat ~2–3%. This means two isocaloric meals with different macros burn meaningfully different amounts of energy — calories in ≠ calories available.",
  },
  homaScore: {
    title: "HOMA Score (HOMA-IR)",
    body: "Homeostatic Model Assessment of Insulin Resistance. Calculated as: (fasting insulin μIU/mL × fasting glucose mg/dL) ÷ 405. A score below 1.0 is optimal; above 2.0 suggests early resistance; above 2.9 is significant. More sensitive than glucose alone for detecting early metabolic dysfunction.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/11932302/",
  },
  cgm: {
    title: "Continuous Glucose Monitor (CGM)",
    body: "A small wearable sensor (usually worn on the arm) that reads interstitial blood glucose every 5–15 minutes. Allows you to see real-time glucose responses to specific foods, meals, stress, and sleep — far more informative than a single fasting glucose snapshot. Used by both diabetics and metabolically healthy people for biofeedback.",
  },
  creatineSupp: {
    title: "Creatine (Creatine Monohydrate)",
    body: "One of the most researched sports supplements. For muscle: 5g/day improves strength and power output. For the brain: 10–15g/day has shown benefits in cognitive function, mood, and neuroprotection. The brain uses significant creatine as a rapid ATP buffer. Notably affordable and exceptionally well-tolerated.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/35882604/",
  },
  ashwagandha: {
    title: "Ashwagandha (Withania somnifera)",
    body: "An adaptogenic herb with strong evidence for reducing cortisol levels. Elevated cortisol worsens insulin resistance and disrupts sleep — so cortisol reduction has downstream metabolic benefits. Also shown to improve testosterone in men and sleep quality. Typical dose: 300–600mg KSM-66 extract.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/34914086/",
  },
  lipolysis: {
    title: "Lipolysis",
    body: "The breakdown of stored triglycerides (body fat) into free fatty acids and glycerol — releasing fat from adipose tissue into the bloodstream for use as fuel. Insulin is the primary inhibitor of lipolysis: even small amounts of insulin block fat burning. This is why fasting and low-carb diets are effective for fat loss — they lower insulin, unlocking lipolysis.",
  },
  warburg: {
    title: "Warburg Effect",
    body: "The observation (by Nobel laureate Otto Warburg, 1931) that cancer cells preferentially ferment glucose via glycolysis even in the presence of oxygen — producing far less energy per glucose than normal mitochondrial respiration. Research by Dr. Thomas Seyfried and others frames cancer as a metabolic disease: tumors are poorly adapted to use ketones, making carbohydrate restriction a potential adjunct therapy.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/21301570/",
  },
  betaHydroxybutyrate: {
    title: "Beta-Hydroxybutyrate (BHB)",
    body: "The primary ketone body produced during fasting or carbohydrate restriction. BHB exists in two mirror forms: D-BHB is the metabolic fuel that cells burn for energy. L-BHB (the other mirror form) acts as a signaling molecule — it reduces inflammation and has been studied for heart failure recovery. Research shows L-BHB may restore ejection fraction in failing hearts. Exogenous BHB supplements deliver the molecule directly without requiring dietary changes.",
  },
  smallDenseLdl: {
    title: "Small Dense LDL (sdLDL)",
    body: "A dangerous subtype of LDL cholesterol — small, compact particles that penetrate arterial walls more easily than large, fluffy LDL. Small dense LDL gets oxidized, triggering immune cells (macrophages) to engulf it, creating 'foam cells' that form arterial plaques. Total LDL on a standard panel doesn't tell you which type you have. What causes sdLDL: glucose spikes, omega-6 excess, advanced glycation end products (AGEs), toxins, and leaky gut.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/21054629/",
  },
  coronaryCalcium: {
    title: "Coronary Calcium Score (CAC)",
    body: "A CT scan that measures calcium deposits (hardened plaque) in the walls of the coronary arteries. Score of 0 = no detectable plaque. Above 0 means atherosclerosis is already present. Score 1–99 = mild; 100–399 = moderate; 400+ = severe. It's one of the most powerful predictors of future heart attack — independent of cholesterol levels. Should be done in anyone over 30 with cardiovascular risk factors.",
  },
  autophagy: {
    title: "Autophagy (Cellular Self-Cleaning)",
    body: "A process where cells dismantle and recycle their own damaged components — defective mitochondria, misfolded proteins, and cellular debris. Triggered by fasting, calorie restriction, or exercise. Autophagy produces new, more efficient mitochondria (mitophagy), improves cellular energy output, and removes toxic protein aggregates linked to Alzheimer's and Parkinson's. The word means 'self-eating' in Greek.",
  },
  vagusNerve: {
    title: "Vagus Nerve",
    body: "The longest cranial nerve in the body — a two-way communication highway between the brain and almost every organ (heart, lungs, gut). It governs the parasympathetic 'rest and repair' response. The gut has the largest distribution of vagus nerve endings in the body. A dysfunctional vagus nerve (from leaky gut, chronic stress, or poor sleep) tips the body toward constant sympathetic overdrive — causing palpitations, high heart rate, poor digestion, and slow healing.",
  },
  resistantStarch: {
    title: "Resistant Starch",
    body: "A type of starch that resists digestion in the small intestine and reaches the colon intact, where gut bacteria ferment it into short-chain fatty acids. Formed when starchy foods (rice, potatoes) are cooked and then cooled. The cooling process restructures the starch molecules so they absorb more slowly — producing a much lower blood glucose and insulin response than freshly cooked versions. Effectively turns a 'bad' carb into prebiotic fiber.",
  },
  nattokinase: {
    title: "Nattokinase",
    body: "An enzyme derived from natto (fermented soybeans) with fibrinolytic activity — meaning it helps dissolve blood clots and break down fibrin, the protein scaffold of clots. Metabolic syndrome increases clotting tendency (hypercoagulability), making nattokinase potentially valuable for cardiovascular risk management. Typical dose: 2,000–8,000 FU (fibrinolytic units) daily. Generally considered blood-thinning; avoid if on anticoagulants without physician oversight.",
  },
  mtorc1: {
    title: "mTORC1 (Mechanistic Target of Rapamycin Complex 1)",
    body: "A master regulator of cell growth and metabolism that senses nutrient availability (especially amino acids and insulin signaling). When chronically overactivated by sustained hyperinsulinemia, mTORC1 suppresses PGC-1α — the primary driver of mitochondrial biogenesis. This means fewer, less efficient mitochondria over time. mTORC1 overactivation is also implicated in accelerated aging, cancer progression, and reduced autophagy. Intermittent fasting and calorie restriction are among the most effective ways to periodically lower mTORC1 activity.",
  },
  nfkb: {
    title: "NF-κB / IKKβ (Inflammatory Signaling Pathway)",
    body: "NF-κB (Nuclear Factor kappa-light-chain-enhancer of activated B cells) is the master transcription factor for pro-inflammatory gene expression. IKKβ is the kinase that activates it. Chronically elevated insulin directly phosphorylates IKKβ, triggering NF-κB to switch on dozens of inflammatory cytokines (TNF-α, IL-1β, IL-6). Critically, this inflammation then feeds back to worsen insulin resistance — creating a self-reinforcing loop where high insulin causes inflammation that causes more insulin resistance that causes higher insulin.",
  },
  srebp1c: {
    title: "SREBP-1c (Sterol Regulatory Element-Binding Protein 1c)",
    body: "A transcription factor activated by insulin that acts as a master switch for fat production. When SREBP-1c is turned on by high insulin, it upregulates acetyl-CoA carboxylase and fatty acid synthase — the key enzymes that convert excess glucose and acetyl-CoA into stored fat. The disturbing implication: even as muscle and liver cells become insulin-resistant to glucose uptake, fat cells can remain SREBP-1c sensitive — meaning you continue storing fat from glucose even as other metabolic processes break down. This partially explains why hyperinsulinemia can drive fat accumulation independent of caloric surplus.",
  },
} as const;

type GlossaryKey = keyof typeof glossaryData;

const GlossaryContext = createContext<(key: GlossaryKey) => void>(() => {});

function GlossaryTerm({ termKey, children }: { termKey: GlossaryKey; children: React.ReactNode }) {
  const open = useContext(GlossaryContext);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); open(termKey); }}
      className="text-amber-300/85 underline decoration-dotted decoration-amber-400/35 underline-offset-2 hover:text-amber-200 transition-colors"
    >
      {children}
    </button>
  );
}

function Cite({ id }: { id: number }) {
  return (
    <a
      href="#sources"
      className="text-[9px] text-amber-400/50 hover:text-amber-400 transition-colors align-super leading-none ml-0.5"
    >
      [{id}]
    </a>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const quickStats = [
  { value: "88%", label: "Adults lack full metabolic health", note: "Most are unaware", valueClass: "text-amber-400", gradientClass: "from-amber-500/10" },
  { value: "3×", label: "Higher Alzheimer's risk", note: "With insulin resistance", valueClass: "text-orange-400", gradientClass: "from-orange-500/10" },
  { value: "25%", label: "Sensitivity drop", note: "After 1 bad night of sleep", valueClass: "text-violet-400", gradientClass: "from-violet-500/10" },
  { value: "#1", label: "Resistance training", note: "Most effective IR fix", valueClass: "text-emerald-400", gradientClass: "from-emerald-500/10" },
];

const fourPillars = [
  {
    icon: Dumbbell,
    title: "Movement",
    iconClass: "text-amber-400",
    borderClass: "border-amber-500/20 hover:border-amber-500/35",
    gradientClass: "from-amber-500/8",
    chevronClass: "text-amber-400",
    preview: "Resistance training is the #1 intervention for insulin resistance",
    points: [
      "Resistance training is the #1 intervention for insulin resistance",
      "Muscle is the largest glucose disposal organ in the body",
      <><GlossaryTerm termKey="glut4">GLUT4 transporters</GlossaryTerm> move to the cell surface WITHOUT requiring insulin during muscle contractions</>,
      "Just 10 min of walking after meals reduces glucose spike by ~30%",
      "Insulin-sensitizing effects persist 24–48 hours after each session",
    ] as React.ReactNode[],
  },
  {
    icon: Flame,
    title: "Diet",
    iconClass: "text-orange-400",
    borderClass: "border-orange-500/20 hover:border-orange-500/35",
    gradientClass: "from-orange-500/8",
    chevronClass: "text-orange-400",
    preview: "Reducing carbohydrates directly lowers insulin demand",
    points: [
      "Reducing carbohydrates directly lowers insulin demand",
      "Fructose is processed entirely by the liver — avoid HFCS and excess fruit juice",
      <>Artificial sweeteners can trigger a <GlossaryTerm termKey="cephalicPhase">cephalic phase insulin response</GlossaryTerm></>,
      "Protein is the most satiating macro — prioritize it at every meal",
      "Time-restricted eating (16:8) significantly lowers fasting insulin",
    ] as React.ReactNode[],
  },
  {
    icon: Moon,
    title: "Sleep",
    iconClass: "text-violet-400",
    borderClass: "border-violet-500/20 hover:border-violet-500/35",
    gradientClass: "from-violet-500/8",
    chevronClass: "text-violet-400",
    preview: "Even ONE night of poor sleep blunts insulin sensitivity by ~25%",
    points: [
      "Even ONE night of poor sleep blunts insulin sensitivity by ~25%",
      <><GlossaryTerm termKey="cortisol">Cortisol</GlossaryTerm> rises with sleep deprivation — cortisol raises blood glucose</>,
      "7–9 hours is the established sweet spot for metabolic health",
      "Light exposure at night disrupts glucose metabolism significantly",
      <>Deep sleep is when the brain&apos;s <GlossaryTerm termKey="glymphatic">glymphatic system</GlossaryTerm> clears metabolic waste</>,
    ] as React.ReactNode[],
  },
  {
    icon: Shield,
    title: "Stress",
    iconClass: "text-blue-400",
    borderClass: "border-blue-500/20 hover:border-blue-500/35",
    gradientClass: "from-blue-500/8",
    chevronClass: "text-blue-400",
    preview: "Cortisol raises blood glucose — chronic stress = chronic hyperglycemia",
    points: [
      <><GlossaryTerm termKey="cortisol">Cortisol</GlossaryTerm> raises blood glucose — chronic stress creates chronic hyperglycemia</>,
      "Mental stress alone causes measurable insulin spikes",
      "Brief cold exposure (cold shower, plunge) improves insulin sensitivity",
      "Deep breathing and meditation measurably reduce cortisol",
      "Social connection is a documented insulin sensitizer",
    ] as React.ReactNode[],
  },
];

const sweeteners = [
  { name: "Table Sugar (sucrose)", insulinSpike: "High", liverLoad: "Moderate", verdict: "⚠️ Limit", verdictClass: "text-amber-400" },
  { name: "High Fructose Corn Syrup", insulinSpike: "Moderate", liverLoad: "Very High", verdict: "❌ Avoid", verdictClass: "text-red-400" },
  { name: "Honey", insulinSpike: "Moderate", liverLoad: "Moderate", verdict: "⚠️ Limit", verdictClass: "text-amber-400" },
  { name: "Agave Syrup", insulinSpike: "Low", liverLoad: "Very High", verdict: "❌ Avoid", verdictClass: "text-red-400" },
  { name: "Artificial Sweeteners", insulinSpike: "Variable*", liverLoad: "None", verdict: "⚠️ Caution", verdictClass: "text-amber-400" },
  { name: "Stevia", insulinSpike: "Minimal", liverLoad: "None", verdict: "✓ OK", verdictClass: "text-emerald-400" },
  { name: "Allulose", insulinSpike: "None", liverLoad: "None", verdict: "✓ Best", verdictClass: "text-emerald-400" },
];

const surprisingTriggers: { emoji: string; title: string; desc: React.ReactNode }[] = [
  {
    emoji: "🚬",
    title: "Vaping & Nicotine",
    desc: "Nicotine directly causes insulin resistance — vaping is not a safe metabolic alternative to smoking.",
  },
  {
    emoji: "🚗",
    title: "Diesel Exhaust & Air Pollution",
    desc: <>Fine particulate matter activates inflammatory pathways that block insulin signaling. Urban living raises baseline risk.<Cite id={4} /></>,
  },
  {
    emoji: "🧂",
    title: "Low-Sodium Diets",
    desc: <>Salt restriction activates the <GlossaryTerm termKey="raas">RAAS system</GlossaryTerm>, which paradoxically worsens insulin sensitivity — challenging conventional low-sodium advice.<Cite id={6} /></>,
  },
  {
    emoji: "💊",
    title: "GLP-1 Drugs (Ozempic / Wegovy)",
    desc: <><GlossaryTerm termKey="glp1Drugs">GLP-1 agonists</GlossaryTerm> suppress appetite effectively — but ~40% of weight lost can be lean muscle mass. Research also shows cravings typically return within 2 years of stopping. Requires pairing with resistance training and high protein intake to preserve muscle.</>,
  },
  {
    emoji: "🥩",
    title: "B Vitamin Deficiency",
    desc: "B vitamins are critical cofactors in glucose metabolism and mitochondrial energy production. A diet low in animal products (especially B12, B6, and B1) can impair cellular energy handling — worsening insulin sensitivity indirectly. Carnivore and keto dieters generally get adequate B vitamins through red meat.",
  },
  {
    emoji: "😰",
    title: "Chronic Stress",
    desc: <><GlossaryTerm termKey="cortisol">Cortisol</GlossaryTerm> is designed for fight-or-flight — it raises blood glucose. Chronic stress means chronically elevated insulin even without dietary changes.</>,
  },
  {
    emoji: "🍊",
    title: "Fruit Juice & Smoothies",
    desc: <>Removing fiber from fruit turns it into a liver burden. A glass of OJ has <span className="text-amber-300 font-medium">the same 25g of sugar as a can of Coca-Cola</span> — identical glucose and fructose molecules processed the same way. The WHO&apos;s daily sugar limit is 25g. One morning glass hits your entire daily budget before breakfast ends. &ldquo;No added sugars&rdquo; on the label? Technically true — the sugar was in the orange from the start, which is why the claim is legal and misleading.</>,
  },
  {
    emoji: "🫙",
    title: "Calcium Supplements",
    desc: "High-dose calcium supplements (especially >1,000mg/day from pills) may increase cardiovascular event risk. The real deficiency is D3 and K2 — D3 improves calcium absorption from food, K2 directs calcium to bones (not arteries). Many cardiologists now stop all calcium supplements and replace with D3+K2.",
  },
  {
    emoji: "🧪",
    title: "Vegetable Seed Oils",
    desc: "Canola, soybean, sunflower, and corn oils are exceedingly high in omega-6 fatty acids. The omega-6:omega-3 ratio in modern diets is 15–20:1 (optimal is ~4:1). Excess omega-6 promotes inflammation and is a primary driver of small, dense LDL formation. Use olive oil, butter, ghee, or coconut oil instead.",
  },
  {
    emoji: "🍄",
    title: "Household Mold",
    desc: "~70% of homes have some form of mold toxicity from previous water damage. Mold triggers a chronic low-grade inflammatory response (elevated CRP, IL-6, complement levels) and can colonize the gut and sinuses — re-exposing you even after leaving the moldy environment. Linked to premature coronary artery disease.",
  },
];

const studies = [
  {
    id: 1,
    title: "Insulin Resistance as a Link Between Alzheimer's Disease and Metabolic Syndrome",
    journal: "Frontiers in Neuroscience",
    year: 2018,
    url: "https://pubmed.ncbi.nlm.nih.gov/30154698/",
    summary: "Establishes mechanisms linking metabolic insulin resistance to Alzheimer's pathology — foundational basis for 'Type 3 Diabetes'",
  },
  {
    id: 2,
    title: "Adipocyte Hypertrophy, Inflammation, and Insulin Resistance",
    journal: "Diabetologia",
    year: 2021,
    url: "https://pubmed.ncbi.nlm.nih.gov/33822280/",
    summary: "Enlarged fat cells (not total fat mass) are the primary driver of adipose-induced insulin resistance",
  },
  {
    id: 3,
    title: "Skeletal Muscle as a Regulator of Insulin Sensitivity",
    journal: "Journal of Endocrinology",
    year: 2019,
    url: "https://pubmed.ncbi.nlm.nih.gov/31176930/",
    summary: "Muscle mass is the largest glucose disposal organ — resistance training is the most effective insulin resistance intervention",
  },
  {
    id: 4,
    title: "Air Pollution Exposure and Insulin Resistance",
    journal: "Environmental Health Perspectives",
    year: 2020,
    url: "https://pubmed.ncbi.nlm.nih.gov/33026890/",
    summary: "Particulate matter and diesel exhaust promote systemic insulin resistance via inflammatory pathways",
  },
  {
    id: 5,
    title: "Ketone Body Metabolism and Alzheimer's Disease",
    journal: "PNAS",
    year: 2020,
    url: "https://pubmed.ncbi.nlm.nih.gov/32900937/",
    summary: "Ketones bypass impaired brain glucose transport — MCT oil raises ketones and may improve cognition in insulin-resistant brains",
  },
  {
    id: 6,
    title: "Sodium Restriction and Insulin Resistance",
    journal: "Metabolism",
    year: 2018,
    url: "https://pubmed.ncbi.nlm.nih.gov/29776744/",
    summary: "Low-sodium diets paradoxically increase fasting insulin and worsen insulin sensitivity through RAAS activation",
  },
  {
    id: 7,
    title: "The Carbohydrate-Insulin Model: A Physiological Perspective on the Obesity Pandemic",
    journal: "American Journal of Clinical Nutrition",
    year: 2021,
    url: "https://pubmed.ncbi.nlm.nih.gov/34515299/",
    summary: "Proposes that dietary carbohydrate — not calories per se — drives fat storage by raising insulin, which redirects energy into adipose tissue",
  },
  {
    id: 8,
    title: "Effects of Dietary Composition on Energy Expenditure During Weight-Loss Maintenance",
    journal: "JAMA",
    year: 2012,
    url: "https://pubmed.ncbi.nlm.nih.gov/22735432/",
    summary: "Isocaloric low-carb diet resulted in ~300 kcal/day higher energy expenditure than low-fat diet — calorie quality, not just quantity, drives metabolism",
  },
  {
    id: 9,
    title: "Hyperinsulinemia: A Unifying Theory of Chronic Disease",
    journal: "Diabetology",
    year: 2022,
    url: "https://pubmed.ncbi.nlm.nih.gov/35415378/",
    summary: "Elevated fasting insulin predates and independently predicts cardiovascular disease, cancer, and neurodegeneration — years before glucose dysregulation appears",
  },
  {
    id: 10,
    title: "Small Dense LDL Cholesterol and Coronary Heart Disease Risk",
    journal: "Journal of the American College of Cardiology",
    year: 2020,
    url: "https://pubmed.ncbi.nlm.nih.gov/21054629/",
    summary: "sdLDL particle size — not total LDL — is the primary lipid driver of atherosclerosis; five key causes identified: glucose, omega-6, AGEs, toxins, LPS from leaky gut",
  },
];

const contributors = [
  {
    initials: "BB",
    name: "Dr. Benjamin Bikman",
    credentials: "PhD · Cell Biology & Physiology",
    affiliation: "Brigham Young University — Bikman Lab",
    focus: "Insulin resistance researcher; author of Why We Get Sick",
  },
  {
    initials: "DL",
    name: "Dr. David Ludwig",
    credentials: "MD, PhD",
    affiliation: "Harvard T.H. Chan School of Public Health",
    focus: "Carbohydrate-insulin model; macronutrient composition and metabolic rate",
  },
  {
    initials: "TS",
    name: "Dr. Thomas Seyfried",
    credentials: "PhD · Biology",
    affiliation: "Boston College",
    focus: "Cancer metabolism; Warburg effect; mitochondrial theory of cancer",
  },
  {
    initials: "IC",
    name: "Dr. Isabella Cooper",
    credentials: "PhD",
    affiliation: "University of Winchester (UK)",
    focus: "Ketogenic diet in women; cortisol response and sex-based hormonal effects",
  },
  {
    initials: "PJ",
    name: "Dr. Praep Jam Nadas (Dr. Jay)",
    credentials: "MD · Interventional Cardiology",
    affiliation: "Preventive Cardiology Practice, Florida",
    focus: "Heart disease prevention; 30,000+ cardiac patients treated; gut-heart-insulin axis; fasting protocols",
  },
  {
    initials: "JI",
    name: "Jesse Inchauspé",
    credentials: "Biochemist · Author",
    affiliation: "Glucose Goddess",
    focus: "Glucose spike mechanisms, post-meal hacks, mood and behavior consequences of blood sugar dysregulation; pregnancy nutrition and epigenetics",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InsulinClient() {
  const [expandedPillar, setExpandedPillar] = useState<number | null>(null);
  const [activeGlossary, setActiveGlossary] = useState<GlossaryKey | null>(null);
  const activeGlossaryEntry: GlossaryEntry | null = activeGlossary ? glossaryData[activeGlossary] : null;

  return (
    <GlossaryContext.Provider value={setActiveGlossary}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Link
            href="/health"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-10"
          >
            <ArrowLeft size={14} /> Back to Health
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-4"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-xl shrink-0">
              🩸
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Insulin & Insulin Resistance</h1>
              <p className="text-sm text-white/40 mt-1">Metabolic health · Endocrinology · Neuroscience</p>
            </div>
          </div>
          <p className="text-white/50 text-sm leading-relaxed max-w-2xl">
            <GlossaryTerm termKey="insulinResistance">Insulin resistance</GlossaryTerm> is the silent driver behind most chronic disease — Type 2 diabetes,{" "}
            <GlossaryTerm termKey="alzheimers">Alzheimer&apos;s</GlossaryTerm>, heart disease, PCOS, obesity, and more.
            Research across endocrinology, neuroscience, and metabolism increasingly identifies it as the root metabolic dysfunction underlying most modern chronic illness — <span className="text-amber-300/80">&quot;the disease beneath the diseases.&quot;</span>
          </p>
        </motion.div>

        {/* Glossary hint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 border border-white/10">
            <span className="text-[10px] text-amber-400/70 font-semibold tracking-wide">TIP</span>
            <span className="text-[10px] text-white/40">
              Tap <span className="text-amber-300/70 underline decoration-dotted underline-offset-1">highlighted terms</span> for in-depth explanations
            </span>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10"
        >
          {quickStats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="glass rounded-xl p-4 border border-white/8 relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradientClass} to-transparent pointer-events-none`} />
              <div className="relative">
                <p className={`text-2xl font-bold mb-0.5 ${stat.valueClass}`}>{stat.value}</p>
                <p className="text-[11px] text-white/70 font-medium leading-tight mb-1">{stat.label}</p>
                <p className="text-[10px] text-white/35">{stat.note}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="space-y-5">

          {/* The Bouncer Model */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-amber-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-lg">🏢</span>
                  <h2 className="text-base font-semibold text-white">How Insulin Works: The Bouncer Model</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-300/80 border-amber-500/15">
                    Core Concept
                  </span>
                </div>
                <p className="text-sm text-white/55 leading-relaxed mb-5">
                  Think of insulin as a bouncer at a nightclub. The club (your cell) only opens its doors when the bouncer knocks.
                  Glucose waits outside. Under normal conditions, one knock and the door opens. But constant knocking wears the
                  club out — cells progressively stop responding to the signal.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      dot: "bg-emerald-500",
                      stage: "Healthy",
                      desc: <>One knock → door opens → glucose enters smoothly. Low insulin needed. Cells are sensitive.</>,
                    },
                    {
                      dot: "bg-amber-500",
                      stage: "Resistant",
                      desc: <>Cells stop responding. Pancreas sends MORE insulin to compensate. You&apos;re <GlossaryTerm termKey="hyperinsulinemia">hyperinsulinemic</GlossaryTerm> — but glucose still looks normal on standard labs.</>,
                    },
                    {
                      dot: "bg-red-500",
                      stage: "Exhausted",
                      desc: <><GlossaryTerm termKey="betaCells">Beta cells</GlossaryTerm> burn out from overwork. Insulin production crashes. Blood sugar rises → Type 2 Diabetes.</>,
                    },
                  ].map((s) => (
                    <div key={s.stage} className="glass rounded-xl p-3.5 border border-white/8">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                        <span className="text-xs font-semibold text-white/80">{s.stage}</span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 glass rounded-xl p-3 border border-white/8 flex items-start gap-2">
                  <AlertCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/50 leading-relaxed">
                    <span className="text-white/70 font-medium">The silent phase:</span>{" "}
                    <GlossaryTerm termKey="hyperinsulinemia">Hyperinsulinemia</GlossaryTerm> precedes high blood sugar by years or decades.
                    Most standard panels test glucose only — not fasting insulin. By the time glucose is elevated, insulin resistance has already been present for a long time.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Two Roads */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-5">
                <Zap size={16} className="text-amber-400" />
                <h2 className="text-base font-semibold text-white">The Two Roads to Insulin Resistance</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass rounded-xl p-4 border border-orange-500/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 to-transparent pointer-events-none" />
                  <div className="relative">
                    <div className="mb-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        ROAD 1 — FAST
                      </span>
                    </div>
                    <p className="text-xs text-white/45 mb-3">Acute triggers that spike insulin rapidly:</p>
                    <ul className="space-y-2">
                      {([
                        "High-carb or high-sugar meals",
                        <><GlossaryTerm termKey="cortisol">Cortisol</GlossaryTerm> surge (acute stress or fear)</>,
                        "Poor sleep — even one bad night",
                        "Alcohol binge",
                        "Fructose overload (juice, HFCS, agave)",
                      ] as React.ReactNode[]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                          <ChevronRight size={11} className="text-orange-400 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-white/30 mt-3 italic">Reversible quickly — but accumulates with repeated exposure</p>
                  </div>
                </div>

                <div className="glass rounded-xl p-4 border border-red-500/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/8 to-transparent pointer-events-none" />
                  <div className="relative">
                    <div className="mb-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                        ROAD 2 — SLOW
                      </span>
                    </div>
                    <p className="text-xs text-white/45 mb-3">Chronic conditions that erode sensitivity silently:</p>
                    <ul className="space-y-2">
                      {([
                        <><GlossaryTerm termKey="visceralFat">Visceral fat</GlossaryTerm> and liver fat accumulation<Cite id={2} /></>,
                        "Sedentary lifestyle — muscle atrophy",
                        "Chronically disrupted sleep",
                        <>Environmental toxins (pollution, vaping, diesel)<Cite id={4} /></>,
                        <>Years of chronically elevated <GlossaryTerm termKey="cortisol">cortisol</GlossaryTerm></>,
                      ] as React.ReactNode[]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                          <ChevronRight size={11} className="text-red-400 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-white/30 mt-3 italic">Silent for years — damage occurs long before symptoms</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Hyperinsulinemia Direct Damage */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-rose-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <AlertCircle size={16} className="text-rose-400" />
                  <h2 className="text-base font-semibold text-white">Hyperinsulinemia: 6 Mechanisms of Direct Damage</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-rose-500/10 text-rose-300/80 border-rose-500/15">
                    Molecular Biology
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  Most people understand that insulin resistance causes problems over time. What&apos;s less understood is that{" "}
                  <span className="text-white/75 font-medium">high insulin itself directly damages tissue</span> through six mechanistically distinct pathways that operate in parallel — not in sequence. These processes don&apos;t wait for insulin resistance to fully develop first.<Cite id={9} />
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {([
                    {
                      num: "1",
                      emoji: "🩸",
                      title: "Direct Vascular Damage",
                      color: "text-rose-400",
                      border: "border-rose-500/20",
                      bg: "bg-rose-500/10",
                      body: <><GlossaryTerm termKey="hyperinsulinemia">Hyperinsulinemia</GlossaryTerm> promotes endothelial dysfunction through increased oxidative stress and reduced nitric oxide bioavailability. This is <span className="text-white/65 font-medium">mechanistically separate from insulin resistance</span> — the insulin itself damages vessel walls, independent of whether cells are responding to it or not.</>,
                    },
                    {
                      num: "2",
                      emoji: "🏭",
                      title: "Lipogenesis Override",
                      color: "text-orange-400",
                      border: "border-orange-500/20",
                      bg: "bg-orange-500/10",
                      body: <>High insulin activates <GlossaryTerm termKey="srebp1c">SREBP-1c</GlossaryTerm> transcription factors, upregulating lipogenic enzymes — acetyl-CoA carboxylase and fatty acid synthase. This converts glucose → fat even as tissues become insulin-resistant to glucose uptake. You can be storing more fat while simultaneously becoming less able to use glucose for energy.</>,
                    },
                    {
                      num: "3",
                      emoji: "🔒",
                      title: "Lipolysis Suppressed",
                      color: "text-amber-400",
                      border: "border-amber-500/20",
                      bg: "bg-amber-500/10",
                      body: <>Insulin potently inhibits hormone-sensitive lipase — the enzyme that releases stored triglycerides. Chronically elevated insulin locks you in fat-storage mode by blocking <GlossaryTerm termKey="lipolysis">lipolysis</GlossaryTerm> even during a caloric deficit. You can be eating less and still struggle to mobilize stored fat if insulin stays frequently elevated.</>,
                    },
                    {
                      num: "4",
                      emoji: "⚡",
                      title: "Mitochondrial Dysfunction",
                      color: "text-violet-400",
                      border: "border-violet-500/20",
                      bg: "bg-violet-500/10",
                      body: <>Sustained hyperinsulinemia impairs mitochondrial biogenesis through <GlossaryTerm termKey="mtorc1">mTORC1 overactivation</GlossaryTerm>, which reduces PGC-1α activity. The result: fewer functional mitochondria, reduced metabolic flexibility, and diminished capacity to oxidize fat for fuel — a compounding deficiency that worsens over years.</>,
                    },
                    {
                      num: "5",
                      emoji: "🔥",
                      title: "Inflammatory Signaling",
                      color: "text-red-400",
                      border: "border-red-500/20",
                      bg: "bg-red-500/10",
                      body: <>Insulin directly activates <GlossaryTerm termKey="nfkb">IKKβ and NF-κB pathways</GlossaryTerm>, promoting systemic low-grade inflammation independent of adiposity or insulin resistance. This creates a feed-forward loop: high insulin → more inflammation → worsened insulin sensitivity → higher insulin required → repeat.</>,
                    },
                    {
                      num: "6",
                      emoji: "🔋",
                      title: "Beta-Cell Exhaustion",
                      color: "text-yellow-400",
                      border: "border-yellow-500/20",
                      bg: "bg-yellow-500/10",
                      body: <>Chronic demand for high insulin output eventually leads to <GlossaryTerm termKey="betaCells">beta-cell apoptosis</GlossaryTerm> and dysfunction. The pancreas can only compensate for so long. This is the direct pathway from metabolic syndrome → prediabetes → Type 2 Diabetes. Years of overwork burning out the only cells that produce insulin.</>,
                    },
                  ] as { num: string; emoji: string; title: string; color: string; border: string; bg: string; body: React.ReactNode }[]).map((item) => (
                    <div key={item.num} className={`glass rounded-xl p-4 border ${item.border}`}>
                      <div className="flex items-start gap-3">
                        <div className={`shrink-0 w-7 h-7 rounded-lg ${item.bg} border ${item.border} flex items-center justify-center`}>
                          <span className={`text-[10px] font-bold ${item.color}`}>{item.num}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-base leading-none">{item.emoji}</span>
                            <p className={`text-xs font-semibold ${item.color}`}>{item.title}</p>
                          </div>
                          <p className="text-xs text-white/45 leading-relaxed">{item.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Critical insight */}
                <div className="glass rounded-xl p-4 border border-rose-500/20 bg-rose-500/5">
                  <p className="text-xs font-semibold text-rose-400 mb-2">⚠️ The Parallel Problem — Not a Linear Chain</p>
                  <p className="text-xs text-white/55 leading-relaxed">
                    <span className="text-white/75 font-medium">Insulin resistance is both a cause AND a consequence</span> of these processes — all six pathways run in parallel, not sequence.
                    It&apos;s not &ldquo;spikes → resistance → bad.&rdquo; It&apos;s &ldquo;spikes → resistance <em>plus</em> direct vascular damage <em>plus</em> metabolic inflexibility <em>plus</em> chronic inflammation&rdquo; simultaneously, each reinforcing the others.
                    This is why treating only blood glucose (the downstream symptom) while ignoring chronically elevated insulin misses most of the actual disease process.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Fat Cell Size */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">🔬</span>
                <h2 className="text-base font-semibold text-white">Fat Cell Size vs. Fat Cell Mass</h2>
              </div>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                The number of fat cells you have is largely set in childhood. What drives insulin resistance is{" "}
                <span className="text-white/75 font-medium">how big those cells get.</span> Enlarged fat cells become
                dysfunctional — they leak fatty acids, trigger chronic inflammation, and stop responding to insulin signals.<Cite id={2} />
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 mb-5">
                {[
                  { sizeClass: "w-10 h-10", label: "Healthy", sublabel: "Small, functional", bgClass: "bg-emerald-500/30 border-emerald-400/50", textClass: "text-emerald-400" },
                  { sizeClass: "w-14 h-14", label: "Enlarging", sublabel: "Early resistance", bgClass: "bg-amber-500/30 border-amber-400/50", textClass: "text-amber-400" },
                  { sizeClass: "w-18 h-18", label: "Hypertrophic", sublabel: "IR + inflammation", bgClass: "bg-orange-500/30 border-orange-400/50", textClass: "text-orange-400" },
                  { sizeClass: "w-24 h-24", label: "Dysfunctional", sublabel: "Leaking, inflamed", bgClass: "bg-red-500/30 border-red-400/50", textClass: "text-red-400" },
                ].map((cell) => (
                  <div key={cell.label} className="flex flex-col items-center gap-2">
                    <div className={`${cell.sizeClass} rounded-full border-2 ${cell.bgClass} flex items-center justify-center`}>
                      <span className="text-white/20 text-xs">💧</span>
                    </div>
                    <p className={`text-xs font-medium ${cell.textClass}`}>{cell.label}</p>
                    <p className="text-[10px] text-white/35 text-center leading-tight">{cell.sublabel}</p>
                  </div>
                ))}
              </div>

              <div className="glass rounded-xl p-3 border border-amber-500/15 flex items-start gap-2">
                <AlertCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-white/50 leading-relaxed">
                  <span className="text-white/70 font-medium">Ethnicity matters:</span> People of Asian descent develop insulin
                  resistance at much lower BMI because fat cells become hypertrophic at lower total body fat. &quot;Normal
                  weight&quot; on a scale does not mean metabolically healthy.
                </p>
              </div>
            </div>
          </Section>

          {/* Brain / Type 3 Diabetes */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-blue-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={16} className="text-blue-400" />
                  <h2 className="text-base font-semibold text-white">
                    &ldquo;Type 3 Diabetes&rdquo; — The <GlossaryTerm termKey="alzheimers">Alzheimer&apos;s</GlossaryTerm> Connection
                  </h2>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  The brain is the most energy-hungry organ per gram in the body. When it becomes insulin resistant, neurons
                  can&apos;t get enough fuel. <GlossaryTerm termKey="amyloidPlaques">Amyloid plaques</GlossaryTerm> accumulate, tau
                  tangles form, and the brain literally shrinks. Researchers now refer to Alzheimer&apos;s as{" "}
                  <span className="text-blue-300 font-medium">&quot;Type 3 Diabetes&quot;</span> based on evidence that
                  impaired insulin signaling in brain tissue is central to its pathology.<Cite id={1} />
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <p className="text-xs font-semibold text-red-400/80 mb-3 flex items-center gap-1">
                      <span>↓</span> Brain with insulin resistance
                    </p>
                    {[
                      { label: "Glucose uptake", pct: 28 },
                      { label: "Neuron survival signaling", pct: 38 },
                      { label: "Memory performance", pct: 24 },
                      { label: "Amyloid clearance", pct: 18 },
                    ].map((item) => (
                      <div key={item.label} className="mb-2.5">
                        <div className="flex justify-between text-[10px] text-white/35 mb-1">
                          <span>{item.label}</span>
                          <span className="text-red-400/70">↓ impaired</span>
                        </div>
                        <div className="h-1.5 bg-white/8 rounded-full">
                          <div className="h-full bg-red-500/70 rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-400/80 mb-3 flex items-center gap-1">
                      <span>↑</span> With <GlossaryTerm termKey="ketones">ketones</GlossaryTerm> as alternative fuel
                    </p>
                    {[
                      { label: "Fuel availability", pct: 80 },
                      { label: "Mitochondrial function", pct: 74 },
                      { label: "Cognitive clarity", pct: 68 },
                      { label: "Neuroinflammation (inverse)", pct: 60 },
                    ].map((item) => (
                      <div key={item.label} className="mb-2.5">
                        <div className="flex justify-between text-[10px] text-white/35 mb-1">
                          <span>{item.label}</span>
                          <span className="text-emerald-400/70">↑ improved</span>
                        </div>
                        <div className="h-1.5 bg-white/8 rounded-full">
                          <div className="h-full bg-emerald-500/70 rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-xl p-3 border border-blue-500/15">
                  <p className="text-xs text-white/50 leading-relaxed">
                    <span className="text-blue-300 font-medium">The ketone bypass:</span>{" "}
                    <GlossaryTerm termKey="ketones">Ketones</GlossaryTerm> don&apos;t require insulin to enter brain cells.
                    Fasting, low-carb diets, or <GlossaryTerm termKey="mctOil">MCT oil</GlossaryTerm> can produce ketones that
                    directly fuel insulin-resistant neurons — potentially slowing cognitive decline when glucose can&apos;t get in.<Cite id={5} />
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Glucose, Mood & Cravings */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-violet-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Brain size={16} className="text-violet-400" />
                  <h2 className="text-base font-semibold text-white">Glucose, Mood & The Craving Trap</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-300/80 border-violet-500/15">
                    Behavior Science
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  Blood sugar isn&apos;t just a metabolic number — it directly controls mood, willpower, and decision-making.
                  Glucose crashes don&apos;t just make you hungry; they impair your brain&apos;s capacity to resist anything.
                </p>

                {/* Voodoo doll study */}
                <div className="glass rounded-xl p-4 border border-violet-500/20 mb-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">🪆</span>
                    <div>
                      <p className="text-xs font-semibold text-violet-400 mb-1">The Voodoo Doll Study</p>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Researchers gave married couples a voodoo doll representing their spouse and asked them to insert a pin every time their partner annoyed them.
                        After two weeks, participants with the <span className="text-violet-300">lowest glucose levels</span> had inserted the most pins.
                        Scientists confirmed through glucose monitoring that unsteady glucose disrupts the neurotransmitter <span className="text-violet-300">tyrosine</span>, which governs mood stability — making you significantly more reactive and irritable toward the people closest to you.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Three mechanisms */}
                <p className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">Why Glucose Crashes Rob Your Willpower</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {[
                    {
                      icon: "🔋",
                      title: "Prefrontal Cortex Dims",
                      color: "text-violet-400",
                      border: "border-violet-500/20",
                      body: "During a glucose crash, the prefrontal cortex — responsible for decision-making and willpower — is the first area to dim to conserve energy for vital functions. Executive function shuts down, making it nearly impossible to resist impulses like snacking or doom scrolling.",
                    },
                    {
                      icon: "📲",
                      title: "The Dopamine Trap",
                      color: "text-blue-400",
                      border: "border-blue-500/20",
                      body: "Sugar releases dopamine — the exact same molecule released by Instagram scrolling. Both create spike-and-crash dopamine cycles. A glucose crash makes you significantly more likely to doom scroll because it simultaneously weakens willpower AND activates dopamine-seeking circuits in the brain.",
                    },
                    {
                      icon: "😤",
                      title: "Emotional Regulation Fails",
                      color: "text-red-400",
                      border: "border-red-500/20",
                      body: "Unsteady glucose destabilizes emotional regulation. You feel more reactive, less in control, and prone to compulsive behavior — not a personality flaw, but a fuel supply problem. Stable glucose means stable mood. This is biology, not character.",
                    },
                  ].map((card) => (
                    <div key={card.title} className={`glass rounded-xl p-3.5 border ${card.border}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span>{card.icon}</span>
                        <span className={`text-xs font-semibold ${card.color}`}>{card.title}</span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">{card.body}</p>
                    </div>
                  ))}
                </div>

                {/* Two voices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="glass rounded-xl p-4 border border-red-500/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
                    <div className="relative">
                      <p className="text-xs font-semibold text-red-400 mb-2">🚨 The Addiction Voice</p>
                      <p className="text-xs text-white/50 leading-relaxed italic mb-2">&ldquo;I need sugar right now. Whatever&apos;s in the kitchen. I can&apos;t feel good without it.&rdquo;</p>
                      <p className="text-xs text-white/40 leading-relaxed">This is a <span className="text-red-300">biological crash signal</span> — not a lack of willpower. A glucose crash triggers a near-irresistible craving mechanism that cannot be overridden by telling yourself to eat less sugar. You have to fix the underlying crash first.</p>
                    </div>
                  </div>
                  <div className="glass rounded-xl p-4 border border-emerald-500/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                    <div className="relative">
                      <p className="text-xs font-semibold text-emerald-400 mb-2">✓ The Enjoyment Voice</p>
                      <p className="text-xs text-white/50 leading-relaxed italic mb-2">&ldquo;That cookie looks great. I&apos;ll do some calf raises after.&rdquo;</p>
                      <p className="text-xs text-white/40 leading-relaxed">This is what <span className="text-emerald-300">stable glucose</span> sounds like. The goal isn&apos;t to never eat sugar — it&apos;s to reach a state where sugar is a <span className="text-emerald-300">choice, not a compulsion</span>. Reduce the crashes and the addiction voice goes quiet on its own.</p>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-3 border border-amber-500/15 flex items-start gap-2">
                  <AlertCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/50 leading-relaxed">
                    <span className="text-white/70 font-medium">The Protein Leverage Hypothesis:</span>{" "}
                    Your body will keep you hungry and seeking food until you&apos;ve consumed enough protein. A breakfast of oats and toast fires hunger signals all morning — no matter how many calories it contained.
                    40g of protein at breakfast shuts down the cascade. Your body got what it actually needed and stops signaling for more.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Muscle */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/6 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell size={16} className="text-emerald-400" />
                  <h2 className="text-base font-semibold text-white">Muscle: Your Metabolic Organ</h2>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  Skeletal muscle is the largest consumer of glucose in the body. When you contract a muscle,{" "}
                  <GlossaryTerm termKey="glut4">GLUT4 transporters</GlossaryTerm> move to the cell surface without insulin —
                  glucose enters regardless of insulin resistance. This is the core mechanism behind why resistance training is the
                  single most powerful intervention for insulin resistance.<Cite id={3} />
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "At rest", barPct: 25, sub: "~25% of glucose disposal" },
                    { label: "During exercise", barPct: 85, sub: "~85% of glucose disposal" },
                    { label: "Post-training", barPct: 60, sub: "Elevated for 24–48h" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-[10px] text-white/40 mb-2">{s.label}</p>
                      <div className="h-20 bg-white/5 rounded-lg flex items-end overflow-hidden">
                        <div
                          className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-lg"
                          style={{ height: `${s.barPct}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-emerald-400/70 mt-1.5 leading-tight">{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Post-Meal Glucose Hacks */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-teal-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Zap size={16} className="text-teal-400" />
                  <h2 className="text-base font-semibold text-white">Post-Meal Glucose Hacks</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-teal-500/10 text-teal-300/80 border-teal-500/15">
                    Practical
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  You have roughly <span className="text-white/75 font-medium">90 minutes</span> after eating before a glucose spike peaks.
                  During this window, muscle contractions pull glucose from your bloodstream independently of insulin.
                  You don&apos;t need a gym — you need movement.
                </p>

                {/* 90-min window */}
                <div className="glass rounded-xl p-4 border border-teal-500/15 mb-5">
                  <p className="text-xs font-semibold text-teal-400 mb-3">Your 90-Minute Glucose Window</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 relative">
                      <div className="h-3 rounded-full bg-white/8 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500/70 via-amber-500/80 to-red-500/60 rounded-full" />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-emerald-400">Eat</span>
                        <span className="text-[10px] text-amber-400">Spike builds</span>
                        <span className="text-[10px] text-red-400/70">~90 min peak</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Move within this window to channel incoming glucose into muscles instead of blood.
                    The earlier you move after eating, the more of the spike you intercept.
                  </p>
                </div>

                {/* Hacks grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {[
                    {
                      emoji: "🦵",
                      title: "Calf Raises",
                      subtitle: "Anywhere, at your desk",
                      effectiveness: "High",
                      effectClass: "text-teal-400",
                      border: "border-teal-500/20",
                      body: "The soleus muscle in your calf is exceptionally efficient at soaking up glucose from the bloodstream. Lift your heels up and down — nobody notices. Even 5 minutes at your desk significantly blunts the spike from a sweet meal.",
                    },
                    {
                      emoji: "🏋️",
                      title: "Squats",
                      subtitle: "5–10 reps every 5 min",
                      effectiveness: "Very High",
                      effectClass: "text-emerald-400",
                      border: "border-emerald-500/20",
                      body: "Your glutes are the largest muscle group in the body. Squats put the biggest glucose sink to work. Studies show 5–10 squats every 5 minutes is one of the most powerful post-meal glucose interventions available without equipment.",
                    },
                    {
                      emoji: "🚶",
                      title: "Walking After Meals",
                      subtitle: "10–15 min walk",
                      effectiveness: "High",
                      effectClass: "text-teal-400",
                      border: "border-teal-500/20",
                      body: "A 10-minute walk after eating reduces post-meal glucose spikes by approximately 30%. This is the biological basis of the cultural tradition of walking after dinner — the practice predates the science, but the mechanism is now clear.",
                    },
                    {
                      emoji: "🥦",
                      title: "Vegetables First",
                      subtitle: "Fiber before carbs",
                      effectiveness: "High",
                      effectClass: "text-teal-400",
                      border: "border-teal-500/20",
                      body: "Fiber eaten at the start of a meal forms a viscous mesh in the intestine that physically slows how quickly glucose from carbs enters the bloodstream — smaller, flatter spike. Eat your salad or vegetables before the rice, bread, or pasta. This is called \"crudités\" in France.",
                    },
                    {
                      emoji: "🍾",
                      title: "Vinegar Before Eating",
                      subtitle: "1 tbsp in water",
                      effectiveness: "Moderate",
                      effectClass: "text-amber-400",
                      border: "border-amber-500/20",
                      body: "A tablespoon of vinegar before a carbohydrate-heavy meal blunts the glucose spike — acetic acid slows gastric emptying and reduces glucose absorption rate. Use pasteurized vinegar. Especially useful before high-carb meals at restaurants or social events.",
                    },
                    {
                      emoji: "🍗",
                      title: "Protein Before Sugar",
                      subtitle: "Front-load protein",
                      effectiveness: "High",
                      effectClass: "text-teal-400",
                      border: "border-teal-500/20",
                      body: "Eating protein before a sweet food reduces glucose spike height — for everyone. If two people both ate chicken before honey, both would get a smaller spike than without the protein. Protein slows gastric emptying and blunts the glucose response universally, regardless of individual baseline variability.",
                    },
                  ].map((hack) => (
                    <div key={hack.title} className={`glass rounded-xl p-4 border ${hack.border} flex items-start gap-3`}>
                      <span className="text-xl shrink-0">{hack.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-white/75">{hack.title}</p>
                          <span className={`text-[9px] font-semibold ${hack.effectClass}`}>{hack.effectiveness}</span>
                        </div>
                        <p className="text-[10px] text-white/35 mb-1.5">{hack.subtitle}</p>
                        <p className="text-xs text-white/45 leading-relaxed">{hack.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass rounded-xl p-3 border border-white/8 flex items-start gap-2">
                  <AlertCircle size={13} className="text-teal-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/50 leading-relaxed">
                    <span className="text-white/70 font-medium">Individual variability:</span>{" "}
                    Two people eating identical meals will get different absolute glucose spikes — based on microbiome, muscle mass, hydration, stress, and sleep.
                    But hacks work for <span className="text-white/65">everyone in relative terms</span> — protein before a meal will produce a smaller spike for you regardless of your baseline, and the same is true for walking, calf raises, and fiber-first meal order.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Four Pillars */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-5">
                <Shield size={16} className="text-amber-400" />
                <h2 className="text-base font-semibold text-white">Four Pillars to Fix Insulin Resistance</h2>
              </div>
              <p className="text-xs text-white/40 mb-4">Tap a pillar to expand details.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fourPillars.map((pillar, i) => {
                  const Icon = pillar.icon;
                  const isOpen = expandedPillar === i;
                  return (
                    <div
                      key={pillar.title}
                      className={`glass rounded-xl border ${pillar.borderClass} transition-all duration-300 relative overflow-hidden`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${pillar.gradientClass} to-transparent pointer-events-none`} />
                      <button
                        onClick={() => setExpandedPillar(isOpen ? null : i)}
                        className="relative w-full text-left p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={15} className={pillar.iconClass} />
                          <span className="text-sm font-semibold text-white/85">{pillar.title}</span>
                        </div>
                        <ChevronDown
                          size={13}
                          className={`text-white/30 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      <div className="relative px-4 pb-4">
                        {isOpen ? (
                          <ul className="space-y-1.5">
                            {pillar.points.map((point, pi) => (
                              <li key={pi} className="flex items-start gap-2 text-xs text-white/55">
                                <ChevronRight size={10} className={`${pillar.chevronClass} shrink-0 mt-0.5`} />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-white/40 -mt-1">{pillar.preview}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* Sweetener Table */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical size={16} className="text-amber-400" />
                <h2 className="text-base font-semibold text-white">Not All Sweeteners Are Equal</h2>
              </div>
              <p className="text-sm text-white/50 leading-relaxed mb-4">
                The type of sugar matters as much as the amount. Fructose is processed entirely by the liver and doesn&apos;t directly
                spike insulin — but it creates liver fat, leading to hepatic insulin resistance. Artificial sweeteners can still trigger
                insulin via the <GlossaryTerm termKey="cephalicPhase">cephalic phase response</GlossaryTerm> — the brain anticipates sweetness and pre-loads insulin before any calories arrive.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/8">
                      {["Sweetener", "Insulin Spike", "Liver Load", "Verdict"].map((h) => (
                        <th key={h} className="text-left text-white/35 font-medium pb-2.5 pr-4 last:pr-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sweeteners.map((row, i) => (
                      <tr key={row.name} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`}>
                        <td className="py-2.5 pr-4 text-white/65 font-medium">{row.name}</td>
                        <td className="py-2.5 pr-4 text-white/45">{row.insulinSpike}</td>
                        <td className="py-2.5 pr-4 text-white/45">{row.liverLoad}</td>
                        <td className={`py-2.5 font-medium ${row.verdictClass}`}>{row.verdict}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-white/25 mt-3 italic">
                * Artificial sweeteners vary — some studies show a <GlossaryTerm termKey="cephalicPhase">cephalic phase</GlossaryTerm> insulin release even with zero caloric content
              </p>
            </div>
          </Section>

          {/* Surprising Triggers */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <AlertCircle size={16} className="text-amber-400" />
                <h2 className="text-base font-semibold text-white">Surprising Causes of Insulin Resistance</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-300/80 border-amber-500/15">
                  Often Overlooked
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {surprisingTriggers.map((t) => (
                  <div key={t.title} className="glass rounded-xl p-4 border border-white/8 flex items-start gap-3">
                    <span className="text-xl shrink-0">{t.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold text-white/75 mb-1">{t.title}</p>
                      <p className="text-xs text-white/45 leading-relaxed">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Energy Equation */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-orange-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Flame size={16} className="text-orange-400" />
                  <h2 className="text-base font-semibold text-white">The Energy Equation: Calories vs. Insulin</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-orange-500/10 text-orange-300/80 border-orange-500/15">
                    Rethink
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  The standard model says obesity is about calories in vs. calories out. But this ignores insulin — the hormone
                  that decides whether incoming energy is burned or stored. <span className="text-white/75 font-medium">Without insulin, you physically cannot store fat.</span>{" "}
                  Insulin is the gatekeeper of fat storage.<Cite id={7} />
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {[
                    {
                      icon: "🔥",
                      title: "Thermic Effect",
                      color: "text-orange-400",
                      border: "border-orange-500/20",
                      body: <><GlossaryTerm termKey="thermicEffect">Protein burns 25–30%</GlossaryTerm> of its own calories in digestion. Two 500-cal meals — one protein-heavy, one carb-heavy — leave very different net energy. Macros matter as much as totals.<Cite id={8} /></>,
                    },
                    {
                      icon: "🧠",
                      title: "Hunger Mechanism",
                      color: "text-blue-400",
                      border: "border-blue-500/20",
                      body: "High insulin locks fat in cells AND blocks ketone production — starving the brain of both its fuel sources simultaneously. The result: intense, uncontrollable hunger that is a physiological signal, not a willpower failure.",
                    },
                    {
                      icon: "📉",
                      title: "Metabolic Slowdown",
                      color: "text-red-400",
                      border: "border-red-500/20",
                      body: "Calorie-cutting while insulin stays high causes the body to lower metabolic rate — burning fewer calories at rest. Low-carb approaches lower insulin first, allowing fat cells to release energy without triggering starvation physiology.",
                    },
                  ].map((card) => (
                    <div key={card.title} className={`glass rounded-xl p-3.5 border ${card.border}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span>{card.icon}</span>
                        <span className={`text-xs font-semibold ${card.color}`}>{card.title}</span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">{card.body}</p>
                    </div>
                  ))}
                </div>
                <div className="glass rounded-xl p-3 border border-orange-500/15 flex items-start gap-2">
                  <AlertCircle size={13} className="text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/50 leading-relaxed">
                    <span className="text-white/70 font-medium">Key insight:</span>{" "}
                    <GlossaryTerm termKey="lipolysis">Lipolysis</GlossaryTerm> — fat breakdown — is almost completely inhibited by insulin.
                    Even moderate insulin levels keep fat locked in adipose tissue. The goal of any fat-loss strategy should be lowering insulin first, not just cutting calories.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Ketones Full Picture */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-violet-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={16} className="text-violet-400" />
                  <h2 className="text-base font-semibold text-white">Ketones: Fuel, Signal & Therapy</h2>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  Ketones are far more than a backup fuel. <GlossaryTerm termKey="betaHydroxybutyrate">Beta-hydroxybutyrate (BHB)</GlossaryTerm> acts
                  as a signaling molecule — reducing inflammation, supporting the heart, and enabling metabolic flexibility across multiple organ systems.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {[
                    {
                      emoji: "❤️",
                      title: "Heart Health",
                      border: "border-red-500/20",
                      body: "The heart actually prefers ketones over glucose as fuel. L-BHB specifically has been studied in heart failure — research shows it may restore ejection fraction in failing hearts. Ketones provide ~28% more energy per unit of oxygen than glucose — a meaningful efficiency gain for a working heart.",
                    },
                    {
                      emoji: "🧠",
                      title: "Brain Disorders",
                      border: "border-blue-500/20",
                      body: "Ketogenic diets are showing promise across a remarkable range of neurological and psychiatric conditions: Alzheimer's, Parkinson's, schizophrenia, bipolar disorder, depression, multiple sclerosis, and epilepsy (where it has decades of established clinical use).",
                    },
                    {
                      emoji: "🔥",
                      title: "Fat Tissue Metabolism",
                      border: "border-orange-500/20",
                      body: "Ketosis increases fat tissue metabolism by approximately 3× compared to glucose-burning states. Adipose cells in ketosis actively break down triglycerides and release fatty acids — the opposite of the fat-storing, insulin-driven state.",
                    },
                    {
                      emoji: "🦠",
                      title: "Cancer & The Warburg Effect",
                      border: "border-amber-500/20",
                      body: <><GlossaryTerm termKey="warburg">Cancer cells (Warburg effect)</GlossaryTerm> are highly dependent on glucose fermentation and are poorly adapted to use ketones. Researchers like Dr. Thomas Seyfried propose carbohydrate restriction as a metabolic adjunct to cancer therapy — starving tumors of their preferred fuel.</>,
                    },
                  ].map((card) => (
                    <div key={card.title} className={`glass rounded-xl p-4 border ${card.border} flex items-start gap-3`}>
                      <span className="text-lg shrink-0">{card.emoji}</span>
                      <div>
                        <p className="text-xs font-semibold text-white/75 mb-1">{card.title}</p>
                        <p className="text-xs text-white/45 leading-relaxed">{card.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Sex Differences */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-pink-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/6 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-pink-400" />
                  <h2 className="text-base font-semibold text-white">Sex Differences in Ketogenic Adaptation</h2>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-4">
                  Women don&apos;t respond identically to men on low-carb or ketogenic diets — hormonal fluctuations across
                  the menstrual cycle significantly affect metabolic fuel preferences and ketone production.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-4 border border-emerald-500/20">
                    <p className="text-xs font-semibold text-emerald-400 mb-2">Follicular Phase (Days 1–14)</p>
                    <ul className="space-y-1.5">
                      {[
                        "Estrogen is dominant — improves metabolic flexibility",
                        "Faster ketosis onset and easier adaptation",
                        "Best window for introducing dietary changes or extended fasting",
                        "Insulin sensitivity is higher in this phase",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs text-white/50">
                          <ChevronRight size={10} className="text-emerald-400 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="glass rounded-xl p-4 border border-amber-500/20">
                    <p className="text-xs font-semibold text-amber-400 mb-2">Luteal Phase (Days 15–28)</p>
                    <ul className="space-y-1.5">
                      {[
                        "Progesterone rises — promotes glucose storage",
                        "Harder to enter and maintain ketosis",
                        "Cortisol response to fasting is amplified",
                        "Dr. Isabella Cooper: cortisol spikes more steeply in this phase during carb restriction",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs text-white/50">
                          <ChevronRight size={10} className="text-amber-400 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-3 glass rounded-xl p-3 border border-white/8 flex items-start gap-2">
                  <AlertCircle size={13} className="text-pink-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/50 leading-relaxed">
                    Women who feel worse on keto during the luteal phase are not failing — they may be fighting their own hormonal biology.
                    Cycling carbohydrate intake to match the menstrual phase is a practical adaptation worth exploring.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Daily Framework */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/6 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Shield size={16} className="text-emerald-400" />
                  <h2 className="text-base font-semibold text-white">A Daily Framework for Insulin Control</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-300/80 border-emerald-500/15">
                    Practical
                  </span>
                </div>
                <p className="text-xs text-white/40 mb-4">Evidence-based daily protocol — adapt to your context and goals.</p>
                <div className="space-y-2">
                  {[
                    { time: "Morning", icon: "🌅", color: "text-amber-400", border: "border-amber-500/20", actions: ["Skip carbs at breakfast — protein + fat only (eggs, meat, avocado)", "Coffee or tea without sugar is fine; black coffee may slightly raise insulin acutely but context matters", "Morning is the best time to exercise — leverages overnight fasting state"] },
                    { time: "Midday", icon: "☀️", color: "text-orange-400", border: "border-orange-500/20", actions: ["Largest meal of the day — front-load calories early", "High protein lunch keeps insulin steady and prevents afternoon energy crash", "A 10-minute walk after eating lowers post-meal glucose spike by ~30%"] },
                    { time: "Evening", icon: "🌙", color: "text-violet-400", border: "border-violet-500/20", actions: ["Early dinner — aim to finish eating by 6–7pm", "Late-night eating disrupts overnight fasting and raises morning insulin", "No snacking after dinner — the overnight fast is metabolically protective"] },
                    { time: "Recovery", icon: "❄️", color: "text-blue-400", border: "border-blue-500/20", actions: ["Cold exposure (cold shower or ice bath) acutely improves insulin sensitivity", "7–9 hours of sleep is non-negotiable — even one poor night costs ~25% insulin sensitivity", "Deep sleep enables glymphatic brain clearance of metabolic waste"] },
                  ].map((block) => (
                    <div key={block.time} className={`glass rounded-xl p-4 border ${block.border}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span>{block.icon}</span>
                        <span className={`text-xs font-semibold ${block.color}`}>{block.time}</span>
                      </div>
                      <ul className="space-y-1">
                        {block.actions.map((a) => (
                          <li key={a} className="flex items-start gap-2 text-xs text-white/50">
                            <ChevronRight size={10} className="text-white/25 shrink-0 mt-0.5" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Know Your Numbers */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <FlaskConical size={16} className="text-amber-400" />
                <h2 className="text-base font-semibold text-white">Know Your Numbers</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-300/80 border-amber-500/15">
                  Lab Tests
                </span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed mb-5">
                Standard blood panels often miss insulin resistance entirely — they measure glucose, not insulin.
                These are the markers that actually reveal your metabolic status.
              </p>
              <div className="space-y-2">
                {[
                  { marker: "Fasting Insulin", target: "< 7 μIU/mL", optimal: "< 5", note: "Most labs flag anything under ~25 as 'normal' — this is far too permissive. Functional medicine targets <7. Anything above 10 fasting suggests meaningful resistance.", color: "text-amber-400", border: "border-amber-500/20" },
                  { marker: "HOMA-IR Score", target: "< 1.0", optimal: "< 0.5", note: <><GlossaryTerm termKey="homaScore">HOMA-IR</GlossaryTerm> = (fasting insulin × fasting glucose) ÷ 405. Requires both values. Above 2.0 = early resistance; above 2.9 = significant IR. More sensitive than glucose alone.</>, color: "text-orange-400", border: "border-orange-500/20" },
                  { marker: "Fasting Glucose", target: "< 90 mg/dL", optimal: "70–85", note: "Standard 'normal' is 70–99 mg/dL but research suggests optimal metabolic health tracks with 70–85. 90–99 is borderline; insulin resistance is already present for many at that level.", color: "text-blue-400", border: "border-blue-500/20" },
                  { marker: "Continuous Glucose Monitor", target: "< 140 mg/dL post-meal", optimal: "< 120 peak", note: <><GlossaryTerm termKey="cgm">CGM</GlossaryTerm> reveals real-time glucose responses invisible to fasting labs. Spikes above 140 mg/dL after meals indicate impaired glucose disposal — even if fasting labs look normal.</>, color: "text-violet-400", border: "border-violet-500/20" },
                  { marker: "Testosterone (Men)", target: "500–900 ng/dL", optimal: "> 600", note: "Insulin resistance strongly suppresses testosterone. Low testosterone is often a downstream consequence, not a primary problem. Fixing insulin resistance frequently restores testosterone without TRT.", color: "text-emerald-400", border: "border-emerald-500/20" },
                  { marker: "Coronary Calcium Score (CAC)", target: "0", optimal: "0", note: <><GlossaryTerm termKey="coronaryCalcium">CAC score of 0</GlossaryTerm> means no detectable arterial plaque. Any score above 0 indicates atherosclerosis is already present. Score 1–99 = mild; 100–399 = moderate; 400+ = severe. Recommended for anyone over 30 with cardiovascular risk factors. Cannot detect soft (uncalcified) plaque — a perfect score doesn't rule out early disease.</>, color: "text-rose-400", border: "border-rose-500/20" },
                  { marker: "Inflammatory Panel (CRP + IL-6)", target: "CRP < 1.0 mg/L", optimal: "< 0.5", note: "High-sensitivity CRP (hsCRP), interleukin-6, and tumor necrosis factor-alpha directly measure systemic inflammation — the driver of plaque formation and rupture. Cleveland Heart Labs panel includes LDL particle size (small dense vs. large fluffy), oxidized LDL, and lipoprotein(a). More actionable than standard cholesterol for cardiovascular risk.", color: "text-pink-400", border: "border-pink-500/20" },
                ].map((row) => (
                  <div key={row.marker} className={`glass rounded-xl p-4 border ${row.border}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className={`text-xs font-semibold ${row.color}`}>{row.marker}</p>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-white/40">Target: <span className="text-white/65">{row.target}</span></p>
                        <p className="text-[10px] text-emerald-400/70">Optimal: {row.optimal}</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">{row.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Supplements */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <FlaskConical size={16} className="text-violet-400" />
                <h2 className="text-base font-semibold text-white">Supplements Worth Considering</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-300/80 border-violet-500/15">
                  Evidence-Based
                </span>
              </div>
              <p className="text-xs text-white/35 mb-4 italic">Not medical advice. Review with your physician, especially if on medications.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { emoji: "💪", name: "Creatine Monohydrate", dose: "5g (muscle) · 10–15g (brain)", evidence: "High", color: "text-amber-400", border: "border-amber-500/20", body: <><GlossaryTerm termKey="creatineSupp">Creatine</GlossaryTerm> is one of the most researched supplements in existence. Strong evidence for muscle strength, power, and recovery. Emerging evidence for brain function, depression, and neuroprotection. Affordable and exceptionally safe.</> },
                  { emoji: "🐟", name: "Omega-3 (EPA + DHA)", dose: "2–4g combined daily", evidence: "High", color: "text-blue-400", border: "border-blue-500/20", body: "Reduces systemic inflammation — the chronic background fire that worsens insulin resistance. Also improves cell membrane fluidity, which enhances insulin receptor sensitivity. Look for high EPA:DHA ratio fish oil or algae-based versions." },
                  { emoji: "⚡", name: "Exogenous Ketones", dose: "Varies by product", evidence: "Moderate", color: "text-violet-400", border: "border-violet-500/20", body: <><GlossaryTerm termKey="betaHydroxybutyrate">BHB salts or esters</GlossaryTerm> raise blood ketone levels directly without dietary restriction. Useful for cognitive clarity during transition to low-carb, athletic performance, and potentially brain health. Not a replacement for metabolic change — a tool to accelerate access.</> },
                  { emoji: "🥩", name: "Collagen + Vitamin C", dose: "10–15g collagen + 50mg C", evidence: "Moderate", color: "text-orange-400", border: "border-orange-500/20", body: "Collagen is rich in glycine and proline — amino acids critical for connective tissue, gut lining integrity, and skin. Vitamin C is required for collagen synthesis. Insulin resistance accelerates collagen degradation; supplementing supports structural repair." },
                  { emoji: "🌿", name: "Ashwagandha (KSM-66)", dose: "300–600mg daily", evidence: "Moderate", color: "text-emerald-400", border: "border-emerald-500/20", body: <><GlossaryTerm termKey="ashwagandha">Ashwagandha</GlossaryTerm> reduces cortisol, improves sleep quality, and supports testosterone in men. Since elevated cortisol directly worsens insulin sensitivity (via gluconeogenesis), cortisol management has real downstream metabolic value.</> },
                  { emoji: "🍬", name: "Allulose", dose: "Use as sweetener", evidence: "Moderate", color: "text-pink-400", border: "border-pink-500/20", body: "A rare sugar that tastes like sugar but is not metabolized — zero insulin response, zero liver load. Unlike artificial sweeteners, it does not trigger a cephalic phase insulin response. Unique mechanism: allulose also appears to blunt glucose spikes from concurrent carbohydrate consumption." },
                  { emoji: "☀️", name: "Vitamin D3 + K2", dose: "D3: 2,000–5,000 IU · K2: 100–200mcg (MK-7)", evidence: "High", color: "text-yellow-400", border: "border-yellow-500/20", body: "D3 improves calcium absorption from food. K2 (menaquinone-7) directs calcium to bones and away from arteries — preventing the coronary calcification that calcium supplements alone can cause. This combination replaces the outdated advice to simply 'take calcium.' Dr. Jay stops all calcium supplements and replaces with D3+K2 in cardiac patients." },
                  { emoji: "🧬", name: "Nattokinase", dose: "2,000–8,000 FU daily", evidence: "Moderate", color: "text-red-400", border: "border-red-500/20", body: <><GlossaryTerm termKey="nattokinase">Nattokinase</GlossaryTerm> is a fibrinolytic enzyme from fermented soybeans that dissolves fibrin clots. Metabolic syndrome creates a hypercoagulable state — blood that clots too easily. Nattokinase addresses this directly. Dr. Jay takes 8,000 FU daily. Avoid with prescription blood thinners.</> },
                  { emoji: "🌾", name: "Inulin + FOS (Prebiotic Fiber)", dose: "1 scoop (~5g) in water daily", evidence: "High", color: "text-lime-400", border: "border-lime-500/20", body: "Inulin with fructooligosaccharides (FOS) is a soluble prebiotic fiber that feeds beneficial gut bacteria. Most people are 40–50% fiber deficient. Prebiotic fiber fosters keystone bacterial species that produce short-chain fatty acids (SCFAs), maintain gut wall integrity, and reduce the leaky gut that drives cardiovascular inflammation." },
                  { emoji: "⚡", name: "Magnesium (Glycinate or Malate)", dose: "300–400mg nightly", evidence: "High", color: "text-cyan-400", border: "border-cyan-500/20", body: "Magnesium is a cofactor in over 300 enzymatic reactions including ATP production, insulin signaling, and blood pressure regulation. ~50% of the population is deficient. Low magnesium independently predicts insulin resistance, cardiovascular disease, and poor sleep quality. Glycinate form is best tolerated; malate supports energy." },
                ].map((supp) => (
                  <div key={supp.name} className={`glass rounded-xl p-4 border ${supp.border} flex items-start gap-3`}>
                    <span className="text-lg shrink-0">{supp.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-xs font-semibold ${supp.color}`}>{supp.name}</p>
                        <span className="text-[9px] text-white/30 shrink-0">{supp.evidence}</span>
                      </div>
                      <p className="text-[10px] text-white/35 mb-1.5">{supp.dose}</p>
                      <p className="text-xs text-white/45 leading-relaxed">{supp.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Heart-Insulin Connection */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-rose-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-base">❤️</span>
                  <h2 className="text-base font-semibold text-white">The Heart–Insulin Connection</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-rose-500/10 text-rose-300/80 border-rose-500/15">
                    Cardiology
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  Interventional cardiologist Dr. Praep Nadas has performed over 30,000 cardiac procedures. His observation:
                  heart disease is not primarily a cholesterol problem — it is a{" "}
                  <GlossaryTerm termKey="hyperinsulinemia">hyperinsulinemia</GlossaryTerm> and inflammation problem.
                  Elevated insulin makes LDL particles smaller and denser, damages arterial walls, and drives the
                  inflammatory cascade that ruptures plaque and causes heart attacks.
                </p>

                <p className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">How a Heart Attack Actually Happens</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { step: "1", emoji: "🧱", label: "Plaque Formation", desc: "sdLDL particles penetrate arterial walls, oxidize, and trigger macrophages to form 'foam cells' — early plaque", color: "text-rose-400", border: "border-rose-500/25", bg: "bg-rose-500/10" },
                    { step: "2", emoji: "🔥", label: "Inflammation", desc: "Chronic insulin elevation keeps the immune system inflamed. Plaque grows and becomes unstable as inflammatory cells accumulate", color: "text-orange-400", border: "border-orange-500/25", bg: "bg-orange-500/10" },
                    { step: "3", emoji: "💥", label: "Plaque Rupture", desc: "Unstable, inflamed plaque ruptures — exposing the arterial interior to blood. The trigger is often a cortisol or adrenaline spike", color: "text-amber-400", border: "border-amber-500/25", bg: "bg-amber-500/10" },
                    { step: "4", emoji: "🩸", label: "Blood Clot", desc: "The body responds to rupture by forming a blood clot. If it fully blocks the artery, heart muscle is starved of oxygen — heart attack", color: "text-red-400", border: "border-red-500/25", bg: "bg-red-500/10" },
                  ].map((s) => (
                    <div key={s.step} className={`glass rounded-xl p-4 border ${s.border} text-center`}>
                      <div className={`w-6 h-6 rounded-full ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                        <span className={`text-[10px] font-bold ${s.color}`}>{s.step}</span>
                      </div>
                      <div className="text-xl mb-2">{s.emoji}</div>
                      <p className={`text-[10px] font-bold ${s.color} mb-1.5`}>{s.label}</p>
                      <p className="text-[10px] text-white/40 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: "50%", label: "of cardiac patients are now under 65 — a demographic shift driven by metabolic disease", icon: "📉", color: "text-rose-400" },
                    { value: "28", label: "year-old patients presenting with heart attacks — increasingly common in metabolically sick young adults", icon: "⚡", color: "text-orange-400" },
                    { value: "3×", label: "higher heart disease risk with hyperinsulinemia — independent of LDL cholesterol levels", icon: "📊", color: "text-amber-400" },
                  ].map((stat) => (
                    <div key={stat.value} className="glass rounded-xl p-4 border border-white/8 flex items-center gap-3">
                      <span className="text-2xl shrink-0">{stat.icon}</span>
                      <div>
                        <p className={`text-2xl font-bold ${stat.color} leading-none mb-1`}>{stat.value}</p>
                        <p className="text-[10px] text-white/40 leading-relaxed">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Fasting Timeline */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Moon size={16} className="text-emerald-400" />
                  <h2 className="text-base font-semibold text-white">What Happens When You Fast</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-300/80 border-emerald-500/15">
                    Fasting Timeline
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  Fasting isn&apos;t just calorie restriction — it triggers a cascade of metabolic and regenerative processes
                  that calorie restriction alone cannot replicate. Here&apos;s what actually happens at each stage:
                </p>

                <div className="space-y-3">
                  {[
                    {
                      time: "0–6h",
                      label: "Fed → Fasted Transition",
                      color: "text-yellow-400",
                      border: "border-yellow-500/25",
                      bg: "bg-yellow-500/10",
                      dot: "bg-yellow-400",
                      events: [
                        "Blood glucose falls as glycogen (liver glucose stores) are consumed",
                        "Insulin levels begin dropping — the fat-storage gate starts to open",
                        "Body shifts from glucose-burning to mixed fuel use",
                      ] as React.ReactNode[],
                    },
                    {
                      time: "6–12h",
                      label: "Fat Burning Begins",
                      color: "text-orange-400",
                      border: "border-orange-500/25",
                      bg: "bg-orange-500/10",
                      dot: "bg-orange-400",
                      events: [
                        <><GlossaryTerm termKey="lipolysis">Lipolysis</GlossaryTerm> kicks in — adipose tissue releases fatty acids into circulation</>,
                        <><GlossaryTerm termKey="visceralFat">Visceral fat</GlossaryTerm> is mobilized first (it&apos;s the most metabolically active), before subcutaneous fat</>,
                        "Liver begins producing early ketone bodies as fatty acid oxidation ramps up",
                      ] as React.ReactNode[],
                    },
                    {
                      time: "12–18h",
                      label: "Ketosis & Mental Clarity",
                      color: "text-amber-400",
                      border: "border-amber-500/25",
                      bg: "bg-amber-500/10",
                      dot: "bg-amber-400",
                      events: [
                        <><GlossaryTerm termKey="ketones">Ketone production</GlossaryTerm> accelerates — brain switches to ketones as primary fuel</>,
                        "Many people report improved focus, reduced brain fog, and enhanced mood at this stage",
                        "Inflammation markers begin declining as insulin remains low",
                      ] as React.ReactNode[],
                    },
                    {
                      time: "18–24h",
                      label: "Autophagy & Repair",
                      color: "text-emerald-400",
                      border: "border-emerald-500/25",
                      bg: "bg-emerald-500/10",
                      dot: "bg-emerald-400",
                      events: [
                        <><GlossaryTerm termKey="autophagy">Autophagy</GlossaryTerm> peaks — cells dismantle damaged proteins, defective mitochondria, and cellular debris</>,
                        "BDNF (brain-derived neurotrophic factor) rises significantly — promotes neuron growth and protection",
                        "Growth hormone surges up to 5× baseline, preserving muscle during the fast",
                        "Stem cell mobilization begins — the body enters deep regeneration mode",
                      ] as React.ReactNode[],
                    },
                    {
                      time: "24–72h",
                      label: "Deep Metabolic Reset",
                      color: "text-violet-400",
                      border: "border-violet-500/25",
                      bg: "bg-violet-500/10",
                      dot: "bg-violet-400",
                      events: [
                        "Visceral fat mobilization continues — the deepest, most inflammatory fat is consumed",
                        "Immune system reset: old immune cells cleared, new ones produced from stem cells",
                        "Insulin sensitivity improves dramatically — cells become more receptive to insulin signal",
                        "Supervised 3–5 day fasts have been studied for diabetes remission and immune reconstitution",
                      ] as React.ReactNode[],
                    },
                  ].map((phase) => (
                    <div key={phase.time} className={`glass rounded-xl p-4 border ${phase.border}`}>
                      <div className="flex items-start gap-3">
                        <div className={`shrink-0 ${phase.bg} rounded-lg px-2.5 py-1.5 mt-0.5`}>
                          <p className={`text-xs font-bold ${phase.color} whitespace-nowrap`}>{phase.time}</p>
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-semibold ${phase.color} mb-2`}>{phase.label}</p>
                          <ul className="space-y-1.5">
                            {phase.events.map((ev, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${phase.dot} mt-1.5 shrink-0 opacity-60`} />
                                <p className="text-xs text-white/45 leading-relaxed">{ev}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass rounded-xl p-3.5 border border-emerald-500/15 flex items-start gap-2 mt-4">
                  <AlertCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/50 leading-relaxed">
                    <span className="text-white/70 font-medium">Key distinction:</span>{" "}
                    Calorie restriction with frequent eating keeps insulin elevated throughout the day — preventing autophagy and visceral fat mobilization even when calories are low.
                    Fasting uniquely lowers insulin long enough to unlock these deeper repair processes.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Fasting Protocol Guide */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-amber-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Moon size={16} className="text-amber-400" />
                  <h2 className="text-base font-semibold text-white">Fasting Protocol Guide</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-300/80 border-amber-500/15">
                    Comparison
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  Not all fasting protocols activate the same processes. Duration determines which metabolic benefits you unlock.
                  Choose based on your goal and current metabolic health.
                </p>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-xs border-collapse min-w-[520px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03]">
                        <th className="text-left p-3 text-white/50 font-semibold">Protocol</th>
                        <th className="text-left p-3 text-white/50 font-semibold">Fast Duration</th>
                        <th className="text-left p-3 text-white/50 font-semibold">Eating Window</th>
                        <th className="text-left p-3 text-white/50 font-semibold">Best For</th>
                        <th className="text-left p-3 text-white/50 font-semibold">Key Benefit Unlocked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { protocol: "12:12", fast: "12h", window: "12h", bestFor: "Beginners, maintenance", benefit: "Metabolic reset baseline, mild fat burning", color: "text-emerald-400", dot: "bg-emerald-400" },
                        { protocol: "16:8", fast: "16h", window: "8h", bestFor: "Ongoing metabolic health", benefit: "Consistent fat burning + autophagy onset", color: "text-amber-400", dot: "bg-amber-400" },
                        { protocol: "18:6", fast: "18h", window: "6h", bestFor: "Weight loss, IR reversal", benefit: "Strong ketosis, meaningful autophagy", color: "text-orange-400", dot: "bg-orange-400" },
                        { protocol: "OMAD", fast: "23h", window: "1 meal", bestFor: "Aggressive fat loss", benefit: "Maximum daily autophagy, GH surge, visceral fat", color: "text-rose-400", dot: "bg-rose-400" },
                        { protocol: "36-hour", fast: "36h", window: "None", bestFor: "Monthly reset, deep visceral fat", benefit: "Immune cell turnover, deep metabolic repair", color: "text-violet-400", dot: "bg-violet-400" },
                        { protocol: "48-hour", fast: "48h", window: "None", bestFor: "Diabetes reversal (supervised)", benefit: "Profound insulin sensitivity restoration", color: "text-blue-400", dot: "bg-blue-400" },
                      ].map((row, i) => (
                        <tr key={row.protocol} className={`border-b border-white/[0.06] ${i % 2 === 0 ? "" : "bg-white/[0.015]"} hover:bg-white/[0.04] transition-colors`}>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${row.dot} opacity-70 shrink-0`} />
                              <span className={`font-bold ${row.color}`}>{row.protocol}</span>
                            </div>
                          </td>
                          <td className="p-3 text-white/60">{row.fast}</td>
                          <td className="p-3 text-white/60">{row.window}</td>
                          <td className="p-3 text-white/50">{row.bestFor}</td>
                          <td className="p-3 text-white/40">{row.benefit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-start gap-2 mt-3">
                  <AlertCircle size={12} className="text-amber-400/60 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-white/35 italic leading-relaxed">
                    Extended fasts (36h+) should be supervised by a physician, especially if diabetic or on medications. Start with 12:12 and extend progressively as your body adapts.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Gut & Heart */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-lime-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-500/6 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-base">🦠</span>
                  <h2 className="text-base font-semibold text-white">Your Gut & Your Heart</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-lime-500/10 text-lime-300/80 border-lime-500/15">
                    Gut–Cardiac Axis
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  The gut is the body&apos;s second immune system. A dysfunctional gut microbiome doesn&apos;t just cause digestive
                  problems — it directly drives cardiovascular disease through an inflammatory cascade that most
                  cardiologists aren&apos;t testing for.
                </p>

                <div className="glass rounded-xl p-4 border border-lime-500/20 mb-5">
                  <p className="text-xs font-semibold text-lime-400 mb-3">The Fiber Deficit Crisis</p>
                  <div className="grid grid-cols-2 gap-5 mb-3">
                    {[
                      { gender: "Men", deficit: "50%", label: "are fiber deficient", color: "text-blue-400", barColor: "bg-blue-500", fill: 50 },
                      { gender: "Women", deficit: "40%", label: "are fiber deficient", color: "text-pink-400", barColor: "bg-pink-500", fill: 40 },
                    ].map((d) => (
                      <div key={d.gender}>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-xs text-white/50">{d.gender}</span>
                          <span className={`text-lg font-bold ${d.color}`}>{d.deficit}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                          <div className={`h-full ${d.barColor} rounded-full opacity-60`} style={{ width: `${d.fill}%` }} />
                        </div>
                        <p className="text-[10px] text-white/35 mt-1">{d.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    The recommended intake is 25–38g fiber/day. Most people consume under 15g.{" "}
                    <GlossaryTerm termKey="resistantStarch">Resistant starch</GlossaryTerm> from cooled rice and
                    potatoes dramatically reduces the glucose and insulin response from these foods.
                  </p>
                </div>

                <p className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">The Leaky Gut → Heart Disease Cascade</p>
                <div className="space-y-2 mb-5">
                  {[
                    { icon: "🦠", step: "Low fiber → microbiome imbalance", desc: "Without fiber, beneficial bacteria starve. Pathogenic bacteria overgrow. The gut lining loses its protective mucus layer." },
                    { icon: "💧", step: "Leaky gut (intestinal permeability)", desc: "Tight junctions between gut cells loosen. Bacterial LPS endotoxins and inflammatory molecules enter circulation." },
                    { icon: "🏥", step: "Fatty liver (NAFLD)", desc: "LPS hits the liver via the portal vein, triggering hepatic inflammation. The liver fills with fat — worsening insulin resistance and systemic inflammation." },
                    { icon: "❤️", step: "Coronary artery disease", desc: "Chronic hepatic inflammation raises small dense LDL, oxidized LDL, and inflammatory cytokines — driving plaque formation and cardiovascular risk." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm">
                          {item.icon}
                        </div>
                        {i < 3 && <div className="w-px h-3 bg-white/10 mt-1" />}
                      </div>
                      <div className="pt-1">
                        <p className="text-xs font-semibold text-white/65 mb-0.5">{item.step}</p>
                        <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass rounded-xl p-4 border border-teal-500/20">
                  <p className="text-xs font-semibold text-teal-400 mb-3">
                    <GlossaryTerm termKey="vagusNerve">Vagus Nerve</GlossaryTerm> Activation — Simple Daily Hacks
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { emoji: "😮‍💨", name: "4:8 Breathing", desc: "4s inhale, 8s exhale. Exhale-emphasis activates the parasympathetic (rest & repair) nervous system" },
                      { emoji: "🧊", name: "Cold Front-of-Neck", desc: "Cold pack on front of neck for 30–60s activates the vagal trunk and triggers a parasympathetic response" },
                      { emoji: "🎵", name: "Humming / Singing", desc: "Vibrates the vagus nerve directly through the throat. Gargling water achieves the same effect" },
                      { emoji: "😂", name: "Deep Laughter", desc: "Genuine belly laughter is one of the most powerful known vagal activators — reduces heart rate and blood pressure" },
                    ].map((hack) => (
                      <div key={hack.name} className="glass rounded-lg p-3 border border-white/8 text-center">
                        <div className="text-2xl mb-1.5">{hack.emoji}</div>
                        <p className="text-[10px] font-semibold text-teal-300/80 mb-1">{hack.name}</p>
                        <p className="text-[10px] text-white/35 leading-relaxed">{hack.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Cholesterol Reframed */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-blue-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-base">🧬</span>
                  <h2 className="text-base font-semibold text-white">Cholesterol Reframed: LDL Isn&apos;t the Enemy</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-300/80 border-blue-500/15">
                    Lipid Science
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  Total LDL is a poor predictor of heart attack risk. What matters is LDL{" "}
                  <em>particle type</em>. The same total LDL reading can mean very different cardiovascular risk
                  depending on whether your particles are large and fluffy or small and dense.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div className="glass rounded-xl p-4 border border-emerald-500/25">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-emerald-500/15 border-2 border-emerald-400/30 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-emerald-400">LDL-A</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-400">Large, Fluffy LDL</p>
                        <p className="text-[10px] text-white/40">Pattern A — Low Risk</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {[
                        "Too large to penetrate artery walls",
                        "Not easily oxidized",
                        "Associated with good metabolic health",
                        "Raised by dietary saturated fat (non-inflammatory)",
                      ].map((pt) => (
                        <li key={pt} className="flex items-start gap-2">
                          <span className="text-emerald-400 text-xs mt-0.5">✓</span>
                          <span className="text-xs text-white/45">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="glass rounded-xl p-4 border border-rose-500/25">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-7 h-7 rounded-full bg-rose-500/15 border-2 border-rose-400/30 flex items-center justify-center shrink-0">
                        <span className="text-[8px] font-bold text-rose-400">LDL-B</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-rose-400">Small, Dense LDL</p>
                        <p className="text-[10px] text-white/40">Pattern B — High Risk</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {[
                        "Small enough to penetrate arterial walls",
                        "Oxidizes easily → triggers macrophages",
                        "Creates \"foam cells\" → plaque formation",
                        "Raised by insulin resistance and glucose spikes",
                      ].map((pt) => (
                        <li key={pt} className="flex items-start gap-2">
                          <span className="text-rose-400 text-xs mt-0.5">✗</span>
                          <span className="text-xs text-white/45">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">5 Root Causes of Small Dense LDL</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
                  {[
                    { num: "1", cause: "Glucose Spikes", emoji: "🍬", desc: "Glycation modifies LDL particles, making them smaller and more atherogenic", color: "text-amber-400", border: "border-amber-500/20" },
                    { num: "2", cause: "Excess Omega-6", emoji: "🌻", desc: "Seed oils high in linoleic acid oxidize easily and promote sdLDL formation", color: "text-orange-400", border: "border-orange-500/20" },
                    { num: "3", cause: "AGEs", emoji: "🍟", desc: "Advanced glycation end products from high-heat cooking cross-link and damage LDL particles", color: "text-red-400", border: "border-red-500/20" },
                    { num: "4", cause: "Toxins & Mold", emoji: "🍄", desc: "Mycotoxins and heavy metals oxidize LDL and impair hepatic LDL clearance", color: "text-violet-400", border: "border-violet-500/20" },
                    { num: "5", cause: "Leaky Gut (LPS)", emoji: "🦠", desc: "Bacterial endotoxins from leaky gut trigger hepatic inflammation that shifts LDL to smaller particles", color: "text-blue-400", border: "border-blue-500/20" },
                  ].map((c) => (
                    <div key={c.num} className={`glass rounded-xl p-3 border ${c.border} text-center`}>
                      <div className="text-xl mb-1.5">{c.emoji}</div>
                      <p className={`text-[10px] font-bold ${c.color} mb-1`}>{c.cause}</p>
                      <p className="text-[10px] text-white/35 leading-relaxed">{c.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="glass rounded-xl p-3.5 border border-blue-500/15 flex items-start gap-2">
                  <AlertCircle size={13} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/50 leading-relaxed">
                    <span className="text-white/70 font-medium">Ask your doctor for this instead:</span>{" "}
                    Request an <GlossaryTerm termKey="smallDenseLdl">NMR LipoProfile or LDL particle size test</GlossaryTerm> instead of a standard lipid panel.
                    Cleveland Heart Labs and Boston Heart Diagnostics offer comprehensive panels that include sdLDL, oxidized LDL, and lipoprotein(a) — the markers that actually predict risk.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Sources */}
          <Section>
            <div id="sources" className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen size={16} className="text-amber-400" />
                <h2 className="text-base font-semibold text-white">Sources & Further Reading</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {studies.map((study) => (
                  <a
                    key={study.url}
                    href={study.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass rounded-xl p-4 border border-white/8 hover:border-amber-500/25 transition-all duration-200 group block"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-[10px] font-bold text-amber-400/60 bg-amber-500/10 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                        [{study.id}]
                      </span>
                      <div className="flex-1 flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-white/70 leading-snug group-hover:text-white/90 transition-colors">
                          {study.title}
                        </p>
                        <ExternalLink size={11} className="text-white/20 group-hover:text-amber-400 transition-colors shrink-0 mt-0.5" />
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-400/60 mb-1.5 pl-8">
                      {study.journal} · {study.year}
                    </p>
                    <p className="text-[10px] text-white/40 leading-relaxed pl-8">{study.summary}</p>
                  </a>
                ))}
              </div>

              <div className="border-t border-white/8 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={13} className="text-white/40" />
                  <p className="text-xs font-semibold text-white/50">Expert Contributors</p>
                </div>
                <div className="space-y-2">
                  {contributors.map((c) => (
                    <div key={c.name} className="glass rounded-xl p-3.5 border border-white/8 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-amber-400/70">{c.initials}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white/70">{c.name}</p>
                        <p className="text-[10px] text-amber-400/60">{c.credentials} · {c.affiliation}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{c.focus}</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-white/25 italic pl-1">Additional experts and sources will be cited as content expands.</p>
                </div>
              </div>
            </div>
          </Section>

        </div>
      </div>

      {/* Glossary Bottom Sheet */}
      <AnimatePresence>
        {activeGlossaryEntry && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/55 z-40 backdrop-blur-sm"
              onClick={() => setActiveGlossary(null)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-2xl mx-auto"
            >
              <div className="glass rounded-t-3xl border border-white/12 border-b-0 p-6 pb-10 shadow-2xl">
                <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-[10px] font-semibold text-amber-400/70 tracking-widest uppercase mb-1">Glossary</p>
                    <h3 className="text-xl font-bold text-white leading-snug">
                      {activeGlossaryEntry.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveGlossary(null)}
                    className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 transition-colors flex items-center justify-center shrink-0 mt-1"
                  >
                    <X size={14} className="text-white/60" />
                  </button>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-4">
                  {activeGlossaryEntry.body}
                </p>
                {activeGlossaryEntry.learnMore && (
                  <a
                    href={activeGlossaryEntry.learnMore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-300 transition-colors"
                  >
                    <ExternalLink size={11} />
                    View research
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </GlossaryContext.Provider>
  );
}
