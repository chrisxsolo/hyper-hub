"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  Zap,
  Shield,
  Moon,
  AlertCircle,
  ChevronDown,
  X,
  BookOpen,
  FlaskConical,
  Activity,
  Eye,
  Pill,
  HeartPulse,
  Dumbbell,
  TrendingUp,
  Timer,
} from "lucide-react";

// ─── Animation ────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Section({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div id={id || undefined} ref={ref} initial="hidden" animate={inView ? "show" : "hidden"} variants={fadeUp} className={className}>
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

const glossaryData: Record<string, GlossaryEntry> = {
  dopamine: {
    title: "Dopamine",
    body: "A neurotransmitter that drives motivation, focus, pleasure, and mood. The nucleus accumbens is the primary dopamine reward center. Constant high-stimulation inputs (porn, cocaine, social media, gambling) flood dopamine so repeatedly that receptors downregulate — you need more stimulation to feel anything. This is the neurological engine behind addiction and the reason 'brain rot' from social media is neurologically real.",
  },
  nucleusAccumbens: {
    title: "Nucleus Accumbens",
    body: "The brain's reward and motivation center. Repeated dopamine spikes from pornography, social media scrolling, or cocaine cause it to 'deaden' — receptors reduce in number and sensitivity. This makes everyday pleasures feel flat and drives compulsive seeking behavior to recover the signal. The same mechanism makes early exposure especially dangerous for developing brains.",
  },
  prefrontalCortex: {
    title: "Prefrontal Cortex (PFC)",
    body: "The front third of the brain responsible for judgment, impulse control, planning, self-regulation, and emotional modulation. Not fully developed until age 25. Alcohol, marijuana, poor sleep, and chronic stress all directly suppress PFC activity — which is why bad decisions cluster around those states. Conscientious people (those who reliably follow through on commitments) show better frontal lobe function and live measurably longer.",
  },
  hippocampus: {
    title: "Hippocampus",
    body: "A seahorse-shaped structure deep in the temporal lobes critical for memory formation, spatial orientation, and mood. Generates ~700 new stem cells per day through neurogenesis. The first region to shrink in Alzheimer's disease — explaining why short-term memory is the first symptom. Alcohol, marijuana, chronic stress, and insulin resistance all suppress hippocampal neurogenesis. Exercise, omega-3s, saffron, and sleep all promote it.",
  },
  amyloidPlaques: {
    title: "Amyloid-Beta & Plaques",
    body: "Amyloid-beta is a protein fragment that lives inside neurons. When it accumulates in excess, it clumps into sticky plaques between brain cells — a primary hallmark of Alzheimer's pathology. One single night of sleep deprivation raises amyloid-beta by ~4%. The brain's glymphatic system clears it mainly during deep slow-wave sleep. Insulin resistance impairs both clearance and the signaling that prevents aggregation — the basis for calling Alzheimer's 'Type 3 Diabetes.'",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/30154698/",
  },
  tauTangles: {
    title: "Tau Tangles (Neurofibrillary Tangles)",
    body: "Twisted fibers of tau protein accumulating inside neurons. Normally tau stabilizes structural 'tracks' inside cells. When it becomes hyperphosphorylated (driven by insulin resistance and inflammation), it detaches and clumps, blocking nutrient transport and killing neurons. Tau tangles correlate more closely with cognitive decline than amyloid plaques do.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/30154698/",
  },
  glymphatic: {
    title: "Glymphatic System",
    body: "The brain's waste-clearance network. Cerebrospinal fluid is pumped through channels surrounding blood vessels to flush metabolic waste — including amyloid-beta and tau — from brain tissue. It operates almost exclusively during deep slow-wave sleep (60% more active than when awake). This is the mechanistic reason chronic sleep deprivation is a direct Alzheimer's risk factor: you are literally not cleaning your brain.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/28776956/",
  },
  spect: {
    title: "SPECT Scan (Brain Imaging)",
    body: "Single Photon Emission Computed Tomography. Dr. Amen uses SPECT to measure blood flow and metabolic activity in living brain tissue — showing function, not just anatomy. It reveals overactivity, underactivity, and damage patterns linked to psychiatric and neurological conditions. How Amen identified the 'scalloping' appearance of alcoholic brains, patterns associated with trauma and PTSD, and documented damage in 80% of NFL players scanned.",
  },
  ants: {
    title: "ANTs (Automatic Negative Thoughts)",
    body: "Thoughts that arise automatically and distort reality toward worst-case interpretations: catastrophizing, mind-reading, fortune-telling, emotional reasoning. ANTs decrease prefrontal cortex activity and increase amygdala firing. Large-scale studies show negativity bias measurably reduces PFC function — impairing motivation, focus, and mood. CBT-derived techniques to challenge ANTs are head-to-head as effective as antidepressants for mild-moderate depression.",
  },
  bloodBrainBarrier: {
    title: "Blood-Brain Barrier / 'Leaky Brain'",
    body: "A selective barrier of tightly-joined endothelial cells lining brain capillaries — acting like a bouncer deciding what enters the brain. High blood pressure kills the one-cell-thick capillaries feeding the BBB, causing it to degrade. A leaky BBB allows passive diffusion of inflammatory molecules, toxins, and pathogens into neural tissue — accelerating neurodegeneration. Alcohol, processed foods, insulin resistance, and chronic hypertension all degrade it.",
  },
  neuroinflammation: {
    title: "Neuroinflammation",
    body: "Inflammatory processes within the brain — involving microglia (the brain's immune cells), cytokines, and oxidative stress. A key driver in Alzheimer's, depression, bipolar disorder, and TBI recovery. COVID-19 causes neuroinflammation, explaining post-COVID anxiety and cognitive symptoms — which respond to anti-inflammatory protocols, not SSRIs. Exercise-released IL-6 acts as an anti-inflammatory myokine in the brain (opposite to its role in disease contexts).",
  },
  insulinResistanceBrain: {
    title: "Insulin Resistance in the Brain (Type 3 Diabetes)",
    body: "Brain neurons require glucose for fuel, and insulin receptors exist throughout the brain. When neurons become insulin-resistant, they are starved of energy — accelerating amyloid plaque formation and tau tangles. A 2019 study showed people on high simple-carb diets had a 400% increased Alzheimer's risk. Some researchers now call Alzheimer's 'Type 3 Diabetes' to reflect this metabolic root cause.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/30154698/",
  },
  serotonin: {
    title: "Serotonin",
    body: "A neurotransmitter involved in mood, appetite, sleep, and social behavior. ~95% is produced in the gut. SSRIs increase serotonin availability by blocking reuptake. However, the 'chemical imbalance' theory of depression has been substantially challenged — a 2022 landmark meta-analysis (Moncrieff et al.) found no consistent difference in serotonin between depressed and non-depressed people. SSRIs may work for some people, but not through the mechanism that was marketed.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/35854107/",
  },
  anteriorCingulate: {
    title: "Anterior Cingulate Gyrus",
    body: "Dr. Amen calls this the 'brain's gear shifter' — it lets you shift attention between thoughts, be cognitively flexible, and go with the flow. When overactive (seen with trauma, OCD, and childhood adversity), people get stuck on thoughts and have trouble letting go. The past stays 'in front of them.' Amen uses timeline orientation as a clinical indicator of trauma: people who visualize the past in front of rather than behind them tend to show this overactivation.",
  },
  bdnf: {
    title: "BDNF (Brain-Derived Neurotrophic Factor)",
    body: "Called 'fertilizer for the brain.' BDNF promotes neuronal growth, survival, and formation of new synaptic connections — essential for learning, memory, and mood. Exercise is the most potent natural trigger: aerobic training releases it abundantly, and resistance training releases it via the myokine irisin. Low BDNF is consistently associated with depression and Alzheimer's risk. Chronic stress, processed food, and alcohol suppress it.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/32629136/",
  },
  cognitiveReserve: {
    title: "Cognitive Reserve",
    body: "The brain's resilience against damage — its ability to maintain function despite accumulating pathology. Like VO2 max for the brain: higher reserve = larger buffer against Alzheimer's plaques, strokes, and other insults. Two people can have identical amyloid loads — one retains full cognition (high reserve), the other has lost it (low reserve). Built over decades through exercise, novelty, learning, and social engagement.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/31558099/",
  },
  myokines: {
    title: "Myokines",
    body: "Signaling proteins secreted by contracting muscle fibers during exercise — acting like hormones that travel to the brain, liver, bones, and fat. Key brain-health myokines: irisin (signals BDNF expression in the hippocampus), IL-6 from exercise context (anti-inflammatory — opposite to its disease-context role), and lactate (Zone 3–5 fuel AND signaling molecule). Pharmaceuticals are spending billions trying to replicate them.",
  },
  irisin: {
    title: "Irisin (FNDC5)",
    body: "A myokine released by muscle during heavy resistance training. Irisin crosses the blood-brain barrier and signals BDNF to express itself in the hippocampus — directly stimulating new neuron growth. It's a core molecular link between lifting heavy and building a bigger, healthier brain. Named after Iris, the Greek goddess of the rainbow (a bridge between worlds).",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/32629136/",
  },
  apoe4: {
    title: "APOE E4 Gene",
    body: "The strongest known genetic risk factor for late-onset Alzheimer's. APOE comes in three variants: E2 (protective), E3 (neutral — most common), E4 (risk). One copy of E4 raises risk ~3× for men and ~6× for women. Two copies: ~10× for men and ~15× for women. Chris Hemsworth carries two copies. APOE4 is not a death sentence — lifestyle interventions (especially exercise) substantially offset the elevated risk. Test with a simple blood test.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/23423380/",
  },
  mildCognitiveImpairment: {
    title: "Mild Cognitive Impairment (MCI)",
    body: "The pre-dementia state — measurable cognitive decline beyond normal aging, but not severe enough to fully impair daily life. It represents early neuronal loss, primarily in the hippocampus. MCI is the critical intervention window: you can slow or partially reverse its progression through exercise, sleep, and metabolic control. Once MCI progresses to Alzheimer's, there is no reversal. ~10–15% of MCI cases progress to dementia per year.",
  },
  vo2max: {
    title: "VO2 Max",
    body: "The maximum rate your body can consume oxygen during intense exercise — the gold standard of cardiovascular fitness and the single strongest predictor of all-cause mortality. Begins declining around age 35. The Norwegian 4×4 protocol (4 min at 90–95% max HR, 4 min rest, × 4) is the gold standard for improving it. Higher VO2 max correlates directly with preserved cognitive function and lower Alzheimer's risk.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/30694702/",
  },
  creatine: {
    title: "Creatine Monohydrate",
    body: "One of the most researched supplements. For muscles: replenishes ATP faster during high-intensity efforts. For the brain: the brain uses creatine as an energy buffer. During sleep deprivation, concussion, stroke, or metabolic stress, supplemental creatine protects cognitive function by keeping neurons fueled. An Alzheimer's study found creatine patients preserved cognitive function AND had more energy to exercise. Dose: 3–5g/day of monohydrate.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/35882604/",
  },
  grayWhiteMatter: {
    title: "Gray Matter vs. White Matter",
    body: "Gray matter = outer cortex containing neuron cell bodies — responsible for processing and computation. White matter = deeper brain tissue containing myelinated axons (the 'highways' connecting regions). With age and disease, gray matter thins (atrophy) and white matter develops lesions. Resistance training slows gray matter atrophy. Hypertension and poor sleep are the primary drivers of white matter lesions.",
  },
  leftVentricularHypertrophy: {
    title: "Left Ventricular Hypertrophy",
    body: "Age-related thickening and stiffening of the heart's main pumping chamber. As the wall thickens, the cavity shrinks and less blood is pumped per beat — reducing delivery to the brain. Driven by chronic hypertension and sedentary aging. Ben Lavine's study showed that Zone 5 HIIT can reverse this and remodel a 50-year-old heart to function like a 30-year-old's — but only if started before age 65.",
  },
} as const;

type GlossaryKey = keyof typeof glossaryData;
const GlossaryContext = createContext<(key: GlossaryKey) => void>(() => {});

function GlossaryTerm({ termKey, children }: { termKey: GlossaryKey; children: React.ReactNode }) {
  const open = useContext(GlossaryContext);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); open(termKey); }}
      className="text-cyan-300/85 underline decoration-dotted decoration-cyan-400/35 underline-offset-2 hover:text-cyan-200 transition-colors"
    >
      {children}
    </button>
  );
}

function Cite({ id }: { id: number }) {
  return (
    <a href="#sources" className="text-[9px] text-cyan-400/50 hover:text-cyan-400 transition-colors align-super leading-none ml-0.5">
      [{id}]
    </a>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = false, accentClass = "border-cyan-500/20", iconColor = "text-cyan-400" }: {
  title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; accentClass?: string; iconColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`glass rounded-xl border ${accentClass} overflow-hidden`}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="text-sm font-medium text-white/90">{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={16} className={iconColor} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="c" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-5 pb-5 text-sm text-readable-soft leading-relaxed">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const quickStats = [
  { value: "60M", label: "People with Alzheimer's worldwide", note: "Tripling to 150M by 2050", valueClass: "text-red-400", gradientClass: "from-red-500/10" },
  { value: "95%", label: "Of cases were preventable", note: "Disease of lifestyle, not genetics", valueClass: "text-violet-400", gradientClass: "from-violet-500/10" },
  { value: "70%", label: "Of sufferers are women", note: "Being female is itself a risk factor", valueClass: "text-pink-400", gradientClass: "from-pink-500/10" },
  { value: "4%", label: "Amyloid spike per bad night", note: "One night of sleep deprivation", valueClass: "text-amber-400", gradientClass: "from-amber-500/10" },
  { value: "400%", label: "Higher Alzheimer's risk", note: "From a high simple-carb diet", valueClass: "text-orange-400", gradientClass: "from-orange-500/10" },
  { value: "25", label: "Age PFC fully matures", note: "Protect your brain until then", valueClass: "text-cyan-400", gradientClass: "from-cyan-500/10" },
];

const alzStages: { stage: string; timeframe: string; desc: string; action: string; colorClass: string; borderClass: string }[] = [
  {
    stage: "Silent Phase",
    timeframe: "30s → 50s",
    desc: "Amyloid-beta begins accumulating. No symptoms. The brain compensates through cognitive reserve. Lifestyle choices made right now dictate whether you cross the threshold into disease.",
    action: "Highest-leverage prevention window — exercise, sleep, and metabolic health matter most here.",
    colorClass: "text-emerald-400",
    borderClass: "border-emerald-500/20",
  },
  {
    stage: "Mild Cognitive Impairment (MCI)",
    timeframe: "50s → early 60s",
    desc: "Measurable memory and processing decline — beyond normal aging but not yet dementia. Neuronal loss begins in the hippocampus. Progression can still be slowed significantly.",
    action: "Resistance training 2–3× per week preserved and enhanced cognitive function in MCI patients (SMART trial).",
    colorClass: "text-amber-400",
    borderClass: "border-amber-500/20",
  },
  {
    stage: "Alzheimer's Diagnosis",
    timeframe: "Late 60s → 70s+",
    desc: "Widespread neuronal death, plaques, and tangles. Short-term memory goes first (hippocampus), then language, spatial navigation, then all executive function. No reversal exists — the disease eventually removes the brain's signal to swallow, causing death by aspiration pneumonia or infection.",
    action: "Once diagnosed: no cure. Alzheimer's is like end-stage cancer — prevention is the only option.",
    colorClass: "text-red-400",
    borderClass: "border-red-500/20",
  },
];

const brainDamagers: { emoji: string; title: string; desc: React.ReactNode; severity: "critical" | "high" | "moderate" }[] = [
  {
    emoji: "🍺",
    severity: "critical",
    title: "Alcohol",
    desc: <>Causes global brain shrinkage and a 'scalloping' pattern on SPECT scans. Even moderate drinking disrupts <GlossaryTerm termKey="grayWhiteMatter">white matter</GlossaryTerm> — the brain's communication highways. Reduces new <GlossaryTerm termKey="hippocampus">hippocampal</GlossaryTerm> stem cell production by up to 58%, impairs REM sleep, crashes frontal lobe function, and increases Alzheimer's risk. The US Surgeon General now recommends cancer warning labels on all alcohol.<Cite id={1} /></>,
  },
  {
    emoji: "🌿",
    severity: "critical",
    title: "Marijuana",
    desc: <>A JAMA study of 21,000+ users found decreased activity across every brain region, especially the <GlossaryTerm termKey="hippocampus">hippocampus</GlossaryTerm>. Adolescent use significantly increases risk of anxiety, depression, and suicide in adulthood. Legalization has been dangerously conflated with safety — the neuroscience does not support that claim.<Cite id={2} /></>,
  },
  {
    emoji: "🍩",
    severity: "critical",
    title: "Simple Carbohydrate Diet",
    desc: <>High-carb diets drive <GlossaryTerm termKey="insulinResistanceBrain">brain insulin resistance</GlossaryTerm>. A 2019 study found people with simple-carb-heavy diets had a 400% increased Alzheimer's risk. Neurons starved of fuel form <GlossaryTerm termKey="amyloidPlaques">amyloid plaques</GlossaryTerm> and <GlossaryTerm termKey="tauTangles">tau tangles</GlossaryTerm>. Some researchers now call Alzheimer's 'Type 3 Diabetes.'<Cite id={3} /></>,
  },
  {
    emoji: "😴",
    severity: "critical",
    title: "Sleep Deprivation",
    desc: <>Just one night of sleep deprivation raises <GlossaryTerm termKey="amyloidPlaques">amyloid-beta</GlossaryTerm> levels by 4%. The <GlossaryTerm termKey="glymphatic">glymphatic system</GlossaryTerm> — which clears amyloid — operates only during deep sleep. Imagine a new mother or shift worker accumulating this night after night, compounding for years. Chronic sleep deprivation is one of the most direct and modifiable Alzheimer's risk factors.<Cite id={4} /></>,
  },
  {
    emoji: "🩺",
    severity: "critical",
    title: "Hypertension (High Blood Pressure)",
    desc: <>Blood pressure over 135 systolic begins killing the one-cell-thick capillaries feeding the brain's cortex. This degrades the <GlossaryTerm termKey="bloodBrainBarrier">blood-brain barrier</GlossaryTerm> — creating 'leaky brain.' <GlossaryTerm termKey="grayWhiteMatter">White matter</GlossaryTerm> lesions accumulate, neurons lose oxygen, and cognitive decline accelerates. The SPRINT trial proved aggressive BP management preserves gray matter and cognitive function.<Cite id={10} /></>,
  },
  {
    emoji: "🏈",
    severity: "critical",
    title: "Contact Sports (Football, Soccer Headers)",
    desc: "Dr. Amen's work with NFL players revealed 80% had significant brain damage on SPECT scans. Repeated sub-concussive impacts are just as damaging as concussions over time. Soccer headers cause measurable white-matter disruption. The brain does not 'bounce back' — it accumulates damage silently.",
  },
  {
    emoji: "📱",
    severity: "high",
    title: "Social Media & Passive Scrolling",
    desc: <>Constant short <GlossaryTerm termKey="dopamine">dopamine</GlossaryTerm> hits condition the brain to resist sustained attention. Scrolling does not build <GlossaryTerm termKey="cognitiveReserve">cognitive reserve</GlossaryTerm> — it depletes it. The <GlossaryTerm termKey="nucleusAccumbens">nucleus accumbens</GlossaryTerm> deadens from repeated stimulation, making focused reading, conversation, and deep work progressively harder. Oxford named 'brain rot' its 2024 word of the year for exactly this reason.</>,
  },
  {
    emoji: "🔞",
    severity: "high",
    title: "Pornography (especially in adolescents)",
    desc: <>Exposes developing brains to extreme <GlossaryTerm termKey="dopamine">dopamine</GlossaryTerm> flooding before the prefrontal cortex can filter it. The <GlossaryTerm termKey="nucleusAccumbens">nucleus accumbens</GlossaryTerm> becomes deadened — requiring more extreme content to register any reward. 8–10 year old boys are being exposed during the most vulnerable developmental window via unrestricted internet access.</>,
  },
  {
    emoji: "😤",
    severity: "high",
    title: "Chronic Negative Thinking (ANTs)",
    desc: <>A large study found negativity bias directly decreases prefrontal cortex activity — impairing motivation, focus, and mood. <GlossaryTerm termKey="ants">Automatic Negative Thoughts</GlossaryTerm> are not just feelings — they measurably change brain physiology. Every depressed patient Dr. Amen scans has a high negativity bias.</>,
  },
  {
    emoji: "🧠",
    severity: "high",
    title: "Chronic Stress & Elevated Cortisol",
    desc: "Cortisol is directly neurotoxic to hippocampal neurons at chronically elevated levels. It suppresses neurogenesis, damages the blood-brain barrier, and drives hypertension and insulin resistance — hitting nearly every Alzheimer's risk pathway simultaneously. The anterior cingulate gets overactivated, trapping people in worry loops.",
  },
  {
    emoji: "💊",
    severity: "moderate",
    title: "Benzodiazepines (Xanax, Ativan, Klonopin)",
    desc: "Benzodiazepines make the brain look older than it is on SPECT scans and are highly addictive. They increase dementia risk with long-term use. Dr. Amen advocates for theanine, ashwagandha, magnesium, GABA, and diaphragmatic breathing before ever prescribing a benzo.",
  },
  {
    emoji: "🫁",
    severity: "moderate",
    title: "Mold & Environmental Toxins",
    desc: "Exposure to mycotoxins (mold), mercury, and environmental neurotoxins triggers neuroinflammation — showing up on SPECT as brain-wide suppression. Clinically actionable: Kendall Jenner's post-COVID anxiety responded to an anti-inflammatory protocol, not SSRIs, because the cause was identifiable inflammation.",
  },
];

const diseases: { title: string; icon: string; colorClass: string; borderClass: string; description: React.ReactNode; symptoms: string[]; insulinLink: React.ReactNode }[] = [
  {
    title: "Alzheimer's Disease",
    icon: "🧠",
    colorClass: "text-red-400",
    borderClass: "border-red-500/20",
    description: <>A progressive neurodegenerative disease caused by <GlossaryTerm termKey="amyloidPlaques">amyloid plaques</GlossaryTerm> and <GlossaryTerm termKey="tauTangles">tau tangles</GlossaryTerm> destroying memory, cognition, and eventually all brain function. The #1 cause of death in women in the UK and Australia. Has no disease-modifying cure — once diagnosed, there is no reversal. 95% of cases could have been prevented through lifestyle changes made decades earlier.</>,
    symptoms: ["Progressive memory loss (short-term first)", "Language difficulty", "Disorientation in familiar places", "Personality and mood changes", "Loss of planning and problem-solving"],
    insulinLink: <>Neurons with <GlossaryTerm termKey="insulinResistanceBrain">insulin resistance</GlossaryTerm> are starved of energy — accelerating amyloid formation and tau hyperphosphorylation. High simple-carb diets produce a 400% increased risk.<Cite id={3} /> Some researchers now classify Alzheimer's as 'Type 3 Diabetes.'</>,
  },
  {
    title: "Vascular Dementia",
    icon: "🫀",
    colorClass: "text-orange-400",
    borderClass: "border-orange-500/20",
    description: "The second most common dementia, caused by reduced blood flow to the brain — from stroke, small vessel disease, or atherosclerosis. Unlike Alzheimer's, symptoms often appear step-wise after vascular events. Metabolic syndrome and insulin resistance cause arterial damage and micro-infarcts that progressively destroy brain tissue.",
    symptoms: ["Step-wise cognitive decline", "Confusion and disorientation", "Difficulty walking", "Poor concentration", "Depression and apathy"],
    insulinLink: "Metabolic syndrome (driven by insulin resistance) causes hypertension, atherosclerosis, and micro-infarcts. Controlling blood sugar and blood pressure is the primary prevention strategy.",
  },
  {
    title: "Lewy Body Dementia",
    icon: "⚡",
    colorClass: "text-yellow-400",
    borderClass: "border-yellow-500/20",
    description: "Caused by abnormal clumps of alpha-synuclein protein (Lewy bodies) in neurons. Shares features with both Alzheimer's and Parkinson's — memory loss, vivid visual hallucinations, tremors, and severe alertness fluctuations. Robin Williams was posthumously diagnosed with it.",
    symptoms: ["Vivid visual hallucinations", "Fluctuating alertness and confusion", "Parkinson's-like motor symptoms", "REM sleep behavior disorder", "Sensitivity to antipsychotic medications"],
    insulinLink: "Alpha-synuclein aggregation is worsened by oxidative stress and mitochondrial dysfunction — both downstream consequences of chronic insulin resistance and metabolic inflammation.",
  },
  {
    title: "Frontotemporal Dementia (FTD)",
    icon: "🎭",
    colorClass: "text-purple-400",
    borderClass: "border-purple-500/20",
    description: "Degeneration of frontal and temporal lobes — the areas controlling personality, social behavior, language, and decision-making. Often misdiagnosed as a psychiatric disorder because behavioral changes precede memory loss. The most common dementia under age 60. Bruce Willis has FTD.",
    symptoms: ["Dramatic personality changes", "Social disinhibition", "Apathy and loss of empathy", "Repetitive behaviors", "Language problems (primary progressive aphasia)"],
    insulinLink: "While FTD has a stronger genetic component, neuroinflammation and oxidative stress from poor metabolic health accelerate the tau and TDP-43 protein accumulation that drives its pathology.",
  },
  {
    title: "Parkinson's Disease",
    icon: "🤝",
    colorClass: "text-teal-400",
    borderClass: "border-teal-500/20",
    description: "Caused by loss of dopamine-producing neurons in the substantia nigra. Best known for tremors and movement difficulties, but also causes significant cognitive and psychiatric symptoms. Environmental toxin exposure (pesticides, herbicides) is a major and under-discussed risk factor alongside genetics.",
    symptoms: ["Resting tremors", "Muscle rigidity", "Slowed movement (bradykinesia)", "Postural instability", "Cognitive decline in later stages"],
    insulinLink: <>Insulin resistance impairs the same mitochondrial pathways that dopaminergic neurons in the substantia nigra depend on. People with type 2 diabetes have a significantly elevated risk of Parkinson's — suggesting shared metabolic roots.<Cite id={15} /></>,
  },
];

const exerciseProtocol: { title: string; subtitle: string; icon: React.ElementType; iconClass: string; borderClass: string; gradientClass: string; study?: string; points: React.ReactNode[] }[] = [
  {
    title: "Resistance Training",
    subtitle: "The #1 intervention for Alzheimer's prevention",
    icon: Dumbbell,
    iconClass: "text-violet-400",
    borderClass: "border-violet-500/20 hover:border-violet-500/35",
    gradientClass: "from-violet-500/8",
    study: "SMART Trial: 2–3× per week resistance training preserved cognitive function and enhanced processing speed in MCI patients",
    points: [
      <>Lift at ~80% of 1RM for neural benefits — hypertrophy can come from light weight, but brain adaptation requires heavy load</>,
      <>Heavy lifts release <GlossaryTerm termKey="myokines">myokines</GlossaryTerm> — specifically <GlossaryTerm termKey="irisin">irisin</GlossaryTerm> — which cross the blood-brain barrier and trigger <GlossaryTerm termKey="bdnf">BDNF</GlossaryTerm> expression in the hippocampus<Cite id={12} /></>,
      "Heavier loads = greater neural drive = more motor cortex 'brain real estate' activated",
      <>Leg strength is the most powerful single predictor — identical twin study showed the stronger-legged twin had a larger brain, more gray matter, and better cognitive scores over 10 years<Cite id={14} /></>,
      "The deadlift is the single best exercise: recruits nearly every muscle in the body, maximizing myokine release and neural drive",
      <>2–3 sessions per week is the evidence-based target<Cite id={7} /></>,
    ],
  },
  {
    title: "Zone 5 / High-Intensity Intervals",
    subtitle: "Heart remodeling & maximum neural drive",
    icon: Zap,
    iconClass: "text-orange-400",
    borderClass: "border-orange-500/20 hover:border-orange-500/35",
    gradientClass: "from-orange-500/8",
    study: "Ben Lavine study: 4 hrs/week for 2 years reversed cardiac aging by 20 years in sedentary 50-year-olds",
    points: [
      <>The Norwegian 4×4: 4 minutes at 90–95% max heart rate, 4 minutes full rest, repeated 4 times — gold standard for improving <GlossaryTerm termKey="vo2max">VO2 max</GlossaryTerm><Cite id={17} /></>,
      <>VO2 max is the strongest single predictor of all-cause mortality — begins declining at ~35<Cite id={17} /></>,
      <>Zone 5 remodels the <GlossaryTerm termKey="leftVentricularHypertrophy">left ventricle</GlossaryTerm> — reversing age-related thickening that reduces brain blood delivery</>,
      "Heart plasticity window: remodeling is only possible before ~age 65 — start in midlife",
      "Women specifically benefit more from Zone 5 than Zone 2 — higher return on investment per hour",
      "Do this 1–2× per week — once maintains VO2 max, twice builds it",
    ],
  },
  {
    title: "Zone 2 Aerobic Training",
    subtitle: "Sustained blood flow, mitochondria & BDNF",
    icon: Activity,
    iconClass: "text-emerald-400",
    borderClass: "border-emerald-500/20 hover:border-emerald-500/35",
    gradientClass: "from-emerald-500/8",
    points: [
      "Zone 2 = ~60% max heart rate — jogging pace where you can still hold a conversation with effort",
      <>Floods the brain with oxygenated blood for sustained periods, triggering abundant <GlossaryTerm termKey="bdnf">BDNF</GlossaryTerm> release</>,
      "Running outside adds cognitive stimulation from visual variety, sounds, and forward ambulation (dopamine/motivation) — engages more brain real estate than a treadmill",
      <>30 minutes of aerobic activity daily downregulates 13 cancer types via <GlossaryTerm termKey="myokines">myokines</GlossaryTerm> and natural killer cell mobilization</>,
      "For women: prioritize Zone 5 and resistance training first — add Zone 2 if time permits (men get proportionally more from Zone 2)",
    ],
  },
  {
    title: "The Anti-Sedentary Protocol",
    subtitle: "Breaking the active-sedentary trap",
    icon: Timer,
    iconClass: "text-cyan-400",
    borderClass: "border-cyan-500/20 hover:border-cyan-500/35",
    gradientClass: "from-cyan-500/8",
    points: [
      "Sitting >10 hours/day raises cardiovascular disease risk even if you meet weekly exercise goals",
      "Prolonged sitting shuts down lipoprotein lipase — an enzyme essential for burning fat and clearing glucose from blood",
      "10 air squats every hour on the hour offsets a sedentary lifestyle — a study confirmed this equals a 30-minute power walk when done across 8 hours",
      "Post-meal movement is especially powerful: any exercise after eating returns glucose to baseline faster, directly reducing amyloid risk",
    ],
  },
];

const brainProtectors: { icon: React.ElementType; title: string; iconClass: string; borderClass: string; gradientClass: string; points: React.ReactNode[] }[] = [
  {
    icon: Moon,
    title: "Sleep",
    iconClass: "text-violet-400",
    borderClass: "border-violet-500/20 hover:border-violet-500/35",
    gradientClass: "from-violet-500/8",
    points: [
      <>7–9 hours consistently activates the <GlossaryTerm termKey="glymphatic">glymphatic system</GlossaryTerm> — flushing amyloid and tau from the brain overnight</>,
      "Deep non-REM sleep is when memory consolidation happens — disrupted sleep = disrupted learning",
      "Alcohol: after 2 drinks, REM drops to ~1 hr; after 4 drinks, ~30 min; after 6 drinks, <2 min",
      "Cool, dark, consistent schedule → better slow-wave architecture and more glymphatic clearance",
    ],
  },
  {
    icon: FlaskConical,
    title: "Nutrition & Supplements",
    iconClass: "text-cyan-400",
    borderClass: "border-cyan-500/20 hover:border-cyan-500/35",
    gradientClass: "from-cyan-500/8",
    points: [
      <>Omega-3 fatty acids (EPA/DHA): head-to-head equal to SSRIs for depression; essential for hippocampal neurogenesis<Cite id={8} /></>,
      <>Saffron (30mg/day): 25 RCTs show equal efficacy to SSRIs — improves mood, memory, AND sexual function<Cite id={9} /></>,
      <>Creatine (3–5g/day): protects cognitive function during sleep deprivation, concussion, and metabolic stress; showed benefit in Alzheimer's patients<Cite id={13} /></>,
      "Vitamin D: deficiency linked to depression, cognitive decline, and Alzheimer's risk — test and optimize",
      "Low-carb / ketogenic eating: ketones bypass insulin resistance and fuel neurons directly",
    ],
  },
  {
    icon: Brain,
    title: "Mental Practices & Cognitive Reserve",
    iconClass: "text-amber-400",
    borderClass: "border-amber-500/20 hover:border-amber-500/35",
    gradientClass: "from-amber-500/8",
    points: [
      <>Kill the <GlossaryTerm termKey="ants">ANTs</GlossaryTerm>: actively challenge automatic negative thoughts — cognitive restructuring is neuroprotective and head-to-head as effective as antidepressants</>,
      "Positivity training: start each day stating 'today will be a great day' — programs the PFC to scan for confirming evidence, reducing threat-detection dominance",
      "Handwriting (not typing) preserves cognitive capacity — a recent study found it was one of the top predictors of maintained cognition at 75",
      "Reading sustained text builds the capacity for deep focus — not replicated by scrolling",
      "Novelty and new experiences: new environments create new dendritic connections — the physical substrate of cognitive reserve",
    ],
  },
  {
    icon: Shield,
    title: "Stress & Blood Pressure Management",
    iconClass: "text-blue-400",
    borderClass: "border-blue-500/20 hover:border-blue-500/35",
    gradientClass: "from-blue-500/8",
    points: [
      "Monitor blood pressure daily with a ~$25 automatic cuff — target ≤120/80 (SPRINT trial gold standard)",
      "Above 135 systolic = capillary damage begins in the brain; above 140 = standard pharmacological management",
      "Diaphragmatic breathing: direct vagal stimulation that shifts the brain out of sympathetic overdrive",
      "Ashwagandha (KSM-66, 300–600mg): reduces cortisol, improves sleep quality, studied in RCTs",
      "L-theanine (200mg): calm alertness without sedation — found naturally in green tea",
      "Social connection is a documented cognitive reserve builder and neurological stress buffer",
    ],
  },
];

const ssriPoints = [
  {
    label: "The core problem with SSRIs",
    text: "SSRIs don't fix the underlying cause of depression — they suppress symptoms while changing your brain's chemistry so it needs the drug to feel normal. Stopping becomes difficult because the brain has adapted. 85% of psychiatric drugs in the US are prescribed by non-psychiatrists in 7-minute visits — and only 12% of those prescriptions follow evidence-based guidelines.",
    colorClass: "border-red-500/20",
  },
  {
    label: "The serotonin deficiency myth",
    text: "The 'chemical imbalance' theory — low serotonin causes depression, SSRIs fix it — was always a marketing hypothesis. A 2022 landmark meta-analysis (Moncrieff et al., Molecular Psychiatry) found no consistent evidence that people with depression have lower serotonin. The mechanism by which SSRIs help some people remains genuinely unclear.",
    colorClass: "border-orange-500/20",
  },
  {
    label: "Sexual function side effects",
    text: "SSRIs reliably impair sexual function in a significant proportion of users — decreasing libido and making orgasm difficult. Post-SSRI sexual dysfunction (PSSD) can persist long after stopping. When someone is already depressed and isolated, removing sexual function further damages their intimate relationships and quality of life.",
    colorClass: "border-amber-500/20",
  },
  {
    label: "Why prescribing one-size SSRIs is like giving all chest pain patients nitroglycerin",
    text: "Depression is a symptom, not a diagnosis. Chest pain can come from a heart attack, gas, grief, or infection — each needing a different treatment. Depression can come from low thyroid, head injury, mold exposure, COVID inflammation, trauma, or low omega-3. Giving everyone an SSRI assumes a single underlying cause that doesn't exist. If you don't look, you're flying blind.",
    colorClass: "border-violet-500/20",
  },
  {
    label: "What head-to-head evidence shows works as well as SSRIs",
    text: "Walking 45 min 4×/week, saffron (30mg/day), omega-3 fatty acids, and cognitive restructuring (challenging ANTs) have all been shown head-to-head equal to SSRIs in peer-reviewed trials — with dramatically better side effect profiles. These should always be tried first.",
    colorClass: "border-emerald-500/20",
  },
  {
    label: "Psychedelics: the new overreach?",
    text: "Psilocybin-associated psychosis has risen 300% in recent years. These compounds can flip vulnerable people into psychotic episodes — and we don't know who is vulnerable in advance. The historical pattern: benzos ('Mommy's Little Helper') → opioids (pain as the fifth vital sign) → SSRIs → now psychedelics. Widespread prescribing before adequate safety data has caused three crises already.",
    colorClass: "border-red-500/20",
  },
];

const myths: { myth: string; reality: React.ReactNode; borderClass: string; labelClass: string }[] = [
  {
    myth: "You can't change your brain — it is what it is.",
    reality: <>False. 80% of Dr. Amen's NFL players — people with severe documented brain damage — got measurably better on rehabilitation programs. <GlossaryTerm termKey="hippocampus">Hippocampal</GlossaryTerm> neurogenesis continues throughout life and reactivates within months of the right interventions. The brain is far more plastic than most people believe.</>,
    borderClass: "border-cyan-500/20",
    labelClass: "text-cyan-400",
  },
  {
    myth: "Alzheimer's is a disease of old age that you either get or you don't.",
    reality: <>It starts silently in your 30s and compounds for 20–30 years. 95% of cases are driven by lifestyle, not genetics. Only ~3% are caused by the genetic mutations you were born with. The window to act is now — not at 70.<Cite id={3} /></>,
    borderClass: "border-red-500/20",
    labelClass: "text-red-400",
  },
  {
    myth: "Moderate drinking is fine — even beneficial.",
    reality: <>There is no safe level of alcohol for the brain. Even light drinkers show disrupted white matter compared to non-drinkers. The 'J-curve' cardiovascular benefit is largely attributed to confounding. The American Cancer Society no longer endorses any alcohol — drinking any amount increases risk of seven different cancers.<Cite id={1} /></>,
    borderClass: "border-amber-500/20",
    labelClass: "text-amber-400",
  },
  {
    myth: "Marijuana is harmless medicine.",
    reality: <>The science is clear: marijuana decreases activity in every brain region, particularly the <GlossaryTerm termKey="hippocampus">hippocampus</GlossaryTerm>. Adolescent use reliably raises risk of anxiety, depression, and suicide in adulthood. Legalization has been dangerously conflated with neuroscientific safety.<Cite id={2} /></>,
    borderClass: "border-green-500/20",
    labelClass: "text-green-400",
  },
  {
    myth: "Depression is just low serotonin — that's why SSRIs work.",
    reality: <>The serotonin deficiency hypothesis is not established science. A 2022 meta-analysis found no consistent evidence linking low serotonin to depression. SSRIs may work through other mechanisms for some people, but the explanation marketed to patients was invented for pharmaceutical positioning, not derived from evidence.<Cite id={16} /></>,
    borderClass: "border-violet-500/20",
    labelClass: "text-violet-400",
  },
  {
    myth: "Brain damage from drugs/alcohol is permanent.",
    reality: "With clean diet, structured exercise, optimized sleep, and targeted supplements, SPECT scans show measurable improvement in brain blood flow and activity within months. The brain has significant rehabilitative capacity when given the inputs it needs.",
    borderClass: "border-emerald-500/20",
    labelClass: "text-emerald-400",
  },
  {
    myth: "You only need to worry about brain health when you're old.",
    reality: <>Alzheimer's plaque accumulation begins 20+ years before symptoms appear. The <GlossaryTerm termKey="prefrontalCortex">prefrontal cortex</GlossaryTerm> isn't complete until 25 — damage before then has outsized consequences for decades. Every lifestyle choice from your 30s forward is either building or eroding your 70-year-old brain.</>,
    borderClass: "border-red-500/20",
    labelClass: "text-red-400",
  },
];

const womenFacts = [
  { point: "Being female is itself a risk factor", detail: "Not simply because women live longer — substantial evidence now shows biological sex independently elevates Alzheimer's risk, separate from age. 70% of all Alzheimer's cases are women. Dementia is the #1 cause of death in women in the UK and the #1 cause of death in Australia for both men and women." },
  { point: "APOE E4 hits women twice as hard", detail: "One copy raises male risk ~3×, but female risk ~6×. Two copies: 10× for men, 15× for women. Hormonal factors — specifically the neuroprotective effects of estrogen declining at menopause — likely amplify gene expression." },
  { point: "Women have been underrepresented and their symptoms downplayed", detail: "Women are more likely to attribute early cognitive symptoms to stress, menopause, or aging — and less likely to seek evaluation. Medical culture historically underrepresented women in clinical trials, leaving practitioners with guidance built on male-derived data." },
  { point: "Exercise recommendations differ by sex", detail: "Men get greater return on investment from Zone 2 training. Women don't. For women, Zone 5 HIIT and resistance training deliver more cognitive and cardiovascular benefit per hour. Prioritize heavy lifting and intervals first — Zone 2 comes after." },
  { point: "Menopause is a critical brain health window", detail: "The estrogen drop at menopause removes a neuroprotective layer. This is not only a reproductive event — it is a neurological event that substantially shifts Alzheimer's risk trajectory. Emerging evidence supports hormone therapy as a neuroprotective intervention when started early (within the 'critical window')." },
];

const studies = [
  { id: 1, title: "Alcohol and the Brain: Neuroimaging, Neuropsychology, and Neurological Effects", journal: "Journal of Studies on Alcohol", year: 2019, url: "https://pubmed.ncbi.nlm.nih.gov/31284890/", summary: "Documents white matter disruption at all levels of alcohol consumption, including moderate intake" },
  { id: 2, title: "Association of Cannabis Use Disorder on Brain Structure and Cognitive Function", journal: "JAMA Network Open", year: 2023, url: "https://pubmed.ncbi.nlm.nih.gov/37000449/", summary: "21,000+ users — hippocampal volume reduction and working memory deficits in heavy cannabis users" },
  { id: 3, title: "Diet and Alzheimer's Disease Risk Factors or Prevention", journal: "Journal of Alzheimer's Disease", year: 2019, url: "https://pubmed.ncbi.nlm.nih.gov/29914035/", summary: "Simple carbohydrate diets associated with 400% increased Alzheimer's risk through insulin resistance pathways" },
  { id: 4, title: "Sleep Deprivation Increases Amyloid-Beta in Human Cerebrospinal Fluid", journal: "Science", year: 2017, url: "https://pubmed.ncbi.nlm.nih.gov/28776956/", summary: "Single night of sleep deprivation elevated CSF amyloid-beta by ~4% — direct mechanistic link to Alzheimer's" },
  { id: 5, title: "Sleep and the Risk of Dementia: A Systematic Review", journal: "Sleep Medicine Reviews", year: 2021, url: "https://pubmed.ncbi.nlm.nih.gov/33551356/", summary: "Chronic sleep disruption impairs glymphatic clearance of amyloid and tau, elevating Alzheimer's risk" },
  { id: 6, title: "Exercise and Pharmacotherapy in the Treatment of Major Depressive Disorder", journal: "Psychosomatic Medicine", year: 2007, url: "https://pubmed.ncbi.nlm.nih.gov/17846259/", summary: "Walking 45 min 4×/week found head-to-head equivalent to sertraline (SSRI) in treating major depression" },
  { id: 7, title: "Resistance Training and Cognitive Function in MCI: The SMART Trial", journal: "Journal of the American Geriatrics Society", year: 2017, url: "https://pubmed.ncbi.nlm.nih.gov/28120366/", summary: "2–3× weekly resistance training preserved and enhanced cognitive function in mild cognitive impairment patients" },
  { id: 8, title: "Omega-3 Fatty Acids vs. Antidepressants for Depression", journal: "Lancet Psychiatry", year: 2021, url: "https://pubmed.ncbi.nlm.nih.gov/33631107/", summary: "Meta-analysis confirming omega-3 EPA supplementation is comparably effective to antidepressants in mild-moderate depression" },
  { id: 9, title: "Saffron in the Treatment of Depression, Anxiety and Other Mental Disorders", journal: "Journal of Affective Disorders", year: 2019, url: "https://pubmed.ncbi.nlm.nih.gov/30669337/", summary: "Review of 25+ RCTs showing saffron equivalence to SSRIs with superior side effect profile and enhanced sexual function" },
  { id: 10, title: "SPRINT-MIND: Intensive vs Standard Blood Pressure Control and Brain Health", journal: "JAMA", year: 2019, url: "https://pubmed.ncbi.nlm.nih.gov/31157327/", summary: "Targeting systolic BP <120 mmHg reduced mild cognitive impairment and preserved gray matter versus 140 target" },
  { id: 11, title: "APOE E4 Allele and Alzheimer's Disease Risk — Sex-Stratified Analysis", journal: "JAMA Neurology", year: 2023, url: "https://pubmed.ncbi.nlm.nih.gov/23423380/", summary: "One APOE4 copy = ~3× risk (men), ~6× (women); two copies = ~10× (men), ~15× (women)" },
  { id: 12, title: "Irisin Crosses the Blood-Brain Barrier and Mediates BDNF Expression", journal: "Nature Metabolism", year: 2020, url: "https://pubmed.ncbi.nlm.nih.gov/32629136/", summary: "Resistance training releases irisin, which crosses the BBB and directly triggers hippocampal BDNF — the molecular link between lifting and brain growth" },
  { id: 13, title: "Creatine Supplementation in Alzheimer's Disease: Cognitive and Physical Effects", journal: "Nutrients", year: 2022, url: "https://pubmed.ncbi.nlm.nih.gov/35882604/", summary: "Creatine supplementation preserved cognitive function and improved exercise capacity in Alzheimer's patients" },
  { id: 14, title: "Leg Strength and Cognitive Aging: Identical Twin Study", journal: "Gerontology", year: 2015, url: "https://pubmed.ncbi.nlm.nih.gov/26068048/", summary: "Twin with greater leg strength had a larger brain, more gray matter, and better cognitive scores over 10 years — controlling for identical genetics" },
  { id: 15, title: "Type 2 Diabetes and Risk of Parkinson's Disease: A Systematic Review", journal: "Diabetes Care", year: 2020, url: "https://pubmed.ncbi.nlm.nih.gov/32079614/", summary: "Type 2 diabetes associated with ~30% increased Parkinson's risk — suggesting shared metabolic pathways" },
  { id: 16, title: "The Serotonin Theory of Depression: A Systematic Umbrella Review", journal: "Molecular Psychiatry", year: 2022, url: "https://pubmed.ncbi.nlm.nih.gov/35854107/", summary: "Moncrieff et al. — no consistent evidence that depression involves low serotonin activity" },
  { id: 17, title: "Exercise Dose and Cardiac Remodeling — The Lavine Protocol", journal: "Circulation", year: 2018, url: "https://pubmed.ncbi.nlm.nih.gov/29987132/", summary: "4 hrs/week structured exercise (Zone 5 HIIT + resistance + aerobic) for 2 years reversed cardiac aging by 20 years in sedentary middle-aged adults" },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BrainClient() {
  const [glossaryKey, setGlossaryKey] = useState<GlossaryKey | null>(null);
  const openGlossary = useCallback((key: GlossaryKey) => setGlossaryKey(key), []);
  const entry = glossaryKey ? glossaryData[glossaryKey] : null;

  useEffect(() => {
    if (glossaryKey) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [glossaryKey]);

  return (
    <GlossaryContext.Provider value={openGlossary}>
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Back */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Link href="/health" className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors mb-10">
            <ArrowLeft size={14} /> Back to Health
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
              <Brain size={20} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Brain Health</h1>
              <p className="text-sm text-readable-soft">Dr. Daniel Amen · Louisa Nicola — clinician, neuroscientist</p>
            </div>
          </div>
          <p className="text-readable-soft text-sm leading-relaxed max-w-xl">
            Your brain controls everything you are. Alzheimer's starts in your 30s, is 95% preventable, and has no cure once diagnosed.
            Here is the full picture — what damages it, what builds it, the diseases, the drugs, and the science.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Alzheimer's Prevention", "Cognitive Reserve", "SSRIs", "APOE E4", "Dopamine", "Insulin Resistance", "BDNF", "Creatine"].map((tag) => (
              <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/15 text-cyan-300/80">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <Section className="mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickStats.map((s) => (
              <div key={s.label} className={`glass rounded-xl p-4 border border-white/5 bg-gradient-to-br ${s.gradientClass} to-transparent`}>
                <div className={`text-2xl font-bold ${s.valueClass} leading-none mb-1`}>{s.value}</div>
                <div className="text-[11px] text-white/80 font-medium leading-tight">{s.label}</div>
                <div className="text-[10px] text-readable-faint mt-1">{s.note}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* The Case for Prevention */}
        <Section className="mb-12">
          <div className="glass rounded-xl border border-cyan-500/20 p-6 bg-gradient-to-br from-cyan-500/6 to-transparent">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Brain size={16} className="text-cyan-400" /> Why This Matters Right Now
            </h2>
            <div className="space-y-3 text-sm text-readable-soft leading-relaxed">
              <p>Alzheimer's disease is <span className="text-white font-medium">not a disease of old age</span> — it is a disease of midlife that doesn't show symptoms until it's too late to reverse. It starts silently in your 30s, compounds over decades, and delivers its diagnosis in your late 60s or 70s — at which point there is no cure, no reversal, no way back.</p>
              <p>Of all current Alzheimer's cases, <span className="text-cyan-300 font-medium">95% could have been prevented</span> through lifestyle. Only ~3% are driven by genetic mutations you were born with. Everything else is a disease of what you eat, how you move, how you sleep — starting right now.</p>
              <p>The number will <span className="text-red-300 font-medium">triple by 2050</span>. 110 million women will have Alzheimer's by then. Your brain fully develops around age 25 — after that, every decision either builds or erodes the brain you'll have at 70.</p>
            </div>
          </div>
        </Section>

        {/* Alzheimer's Timeline */}
        <Section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">How Alzheimer's Develops</h2>
          </div>
          <div className="space-y-3">
            {alzStages.map((s, i) => (
              <div key={s.stage} className={`glass rounded-xl border ${s.borderClass} p-5`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono text-readable-faint bg-white/5 px-2 py-0.5 rounded">Stage {i + 1}</span>
                  <h3 className={`font-semibold text-sm ${s.colorClass}`}>{s.stage}</h3>
                  <span className="ml-auto text-[10px] text-readable-faint">{s.timeframe}</span>
                </div>
                <p className="text-sm text-readable-soft leading-relaxed mb-2">{s.desc}</p>
                <div className={`text-xs border-l-2 ${s.borderClass.split(" ")[0]} pl-3 text-readable-faint italic`}>{s.action}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* What Damages the Brain */}
        <Section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <AlertCircle size={16} className="text-red-400" />
            <h2 className="text-lg font-semibold text-white">What Damages & Deteriorates Your Brain</h2>
          </div>
          <div className="space-y-2">
            {brainDamagers.map((d) => {
              const sev = {
                critical: { label: "Critical", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
                high: { label: "High Risk", bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
                moderate: { label: "Moderate", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
              }[d.severity];
              return (
                <Accordion
                  key={d.title}
                  accentClass={sev.border}
                  iconColor={sev.text}
                  title={
                    <span className="flex items-center gap-2">
                      <span>{d.emoji}</span>
                      <span>{d.title}</span>
                      <span className={`ml-auto mr-2 text-[9px] px-2 py-0.5 rounded-full ${sev.bg} ${sev.text} border ${sev.border}`}>{sev.label}</span>
                    </span>
                  }
                >
                  {d.desc}
                </Accordion>
              );
            })}
          </div>
        </Section>

        {/* Brain Diseases */}
        <Section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <HeartPulse size={16} className="text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Brain Diseases In Depth</h2>
          </div>
          <div className="space-y-4">
            {diseases.map((d) => (
              <div key={d.title} className={`glass rounded-xl border ${d.borderClass} p-5`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{d.icon}</span>
                  <h3 className={`font-semibold ${d.colorClass}`}>{d.title}</h3>
                </div>
                <p className="text-sm text-readable-soft leading-relaxed mb-3">{d.description}</p>
                <div className="mb-3">
                  <p className="text-[10px] text-readable-faint font-semibold uppercase tracking-wider mb-2">Key Symptoms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.symptoms.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/60">{s}</span>
                    ))}
                  </div>
                </div>
                <div className={`rounded-lg border ${d.borderClass} bg-white/3 p-3`}>
                  <p className="text-[10px] text-readable-faint font-semibold uppercase tracking-wider mb-1.5">Metabolic / Insulin Connection</p>
                  <p className="text-xs text-readable-soft leading-relaxed">{d.insulinLink}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Cognitive Reserve */}
        <Section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Cognitive Reserve: Your Brain's Buffer</h2>
          </div>
          <div className="glass rounded-xl border border-emerald-500/20 p-6 mb-4">
            <p className="text-sm text-readable-soft leading-relaxed mb-4">
              <GlossaryTerm termKey="cognitiveReserve">Cognitive reserve</GlossaryTerm> is the reason two people with identical amyloid loads can have completely different outcomes — one retains sharp cognition, the other has lost it. Think of it like VO2 max for the brain: the more reserve you've built, the more pathology you can absorb without losing function.
            </p>
            <p className="text-sm text-readable-soft leading-relaxed mb-4">
              You have around 5,000–10,000 connections per neuron. Every time you have a thought, you build a connection. The more novelty, challenge, and learning you give your brain, the richer and more stable these networks become. They fail when you stop using them — and passive scrolling does not use them.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {[
                { label: "Builds Reserve", items: ["Heavy resistance training", "Handwriting (not typing)", "Sustained reading", "Learning new skills / instruments", "Deep social engagement", "Novel environments", "High-intensity cardio"], colorClass: "border-emerald-500/20 text-emerald-400" },
                { label: "Depletes Reserve", items: ["Passive social media scrolling", "Sedentary lifestyle", "Chronic sleep deprivation", "High simple-carb diet", "Social isolation", "Repeated head impacts", "Alcohol & marijuana"], colorClass: "border-red-500/20 text-red-400" },
              ].map((col) => (
                <div key={col.label} className={`glass rounded-xl border ${col.colorClass.split(" ")[0]} p-4`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${col.colorClass.split(" ")[1]}`}>{col.label}</p>
                  <ul className="space-y-1">
                    {col.items.map((item) => (
                      <li key={item} className="text-xs text-readable-soft flex items-center gap-1.5">
                        <span className="text-white/20">·</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Exercise */}
        <Section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Dumbbell size={16} className="text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Exercise: The Most Powerful Intervention</h2>
          </div>
          <div className="space-y-4">
            {exerciseProtocol.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className={`glass rounded-xl border ${p.borderClass} p-5 bg-gradient-to-br ${p.gradientClass} to-transparent`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className={p.iconClass} />
                    <h3 className="font-semibold text-white text-sm">{p.title}</h3>
                  </div>
                  <p className="text-[11px] text-readable-faint mb-3">{p.subtitle}</p>
                  {p.study && (
                    <div className="text-[10px] bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-readable-faint italic mb-3">
                      📊 {p.study}
                    </div>
                  )}
                  <ul className="space-y-2">
                    {p.points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-readable-soft">
                        <span className="text-white/20 mt-1 shrink-0">·</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-4 glass rounded-xl border border-cyan-500/15 p-5">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">Evidence-Based Weekly Template</p>
            <div className="space-y-2">
              {[
                { freq: "2–3×", activity: "Resistance training at ~80% 1RM", note: "Deadlift / barbell squat as anchor" },
                { freq: "1–2×", activity: "Norwegian 4×4 Zone 5 intervals", note: "4 min at 90–95% max HR × 4" },
                { freq: "1×", activity: "Long aerobic session (60 min)", note: "Hike, cycle, tennis — Zone 2–3" },
                { freq: "Daily", activity: "10 air squats every hour", note: "If you have a desk job" },
                { freq: "Daily", activity: "Post-meal walk (10–15 min)", note: "Glucose clearance + BDNF" },
              ].map((row) => (
                <div key={row.activity} className="flex items-center gap-3 text-sm">
                  <span className="text-[10px] font-mono text-cyan-400 shrink-0 w-10">{row.freq}</span>
                  <span className="text-white/80 flex-1">{row.activity}</span>
                  <span className="text-[10px] text-readable-faint hidden sm:block">{row.note}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* How to Protect Your Brain */}
        <Section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={16} className="text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">How to Optimize & Protect Your Brain</h2>
          </div>
          <div className="space-y-3">
            {brainProtectors.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className={`glass rounded-xl border ${p.borderClass} p-5 bg-gradient-to-br ${p.gradientClass} to-transparent`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={16} className={p.iconClass} />
                    <h3 className="font-semibold text-white text-sm">{p.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {p.points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-readable-soft">
                        <span className="text-white/20 mt-1 shrink-0">·</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Section>

        {/* APOE E4 */}
        <Section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={16} className="text-amber-400" />
            <h2 className="text-lg font-semibold text-white">APOE E4: The Genetic Risk Factor</h2>
          </div>
          <div className="glass rounded-xl border border-amber-500/20 p-5">
            <p className="text-sm text-readable-soft leading-relaxed mb-4">
              The <GlossaryTerm termKey="apoe4">APOE E4 gene</GlossaryTerm> is the strongest known genetic risk factor for late-onset Alzheimer's — but it is not a death sentence. Only ~3% of total Alzheimer's cases are caused by the genetic mutations you were born with. APOE4 raises your risk, but lifestyle interventions (especially resistance training and sleep) substantially offset it.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[
                { variant: "APOE E2", label: "Protective", desc: "One copy lowers your risk below the population average", colorClass: "text-emerald-400", borderClass: "border-emerald-500/20", bg: "bg-emerald-500/8" },
                { variant: "APOE E3", label: "Neutral", desc: "Most common — one copy neither raises nor lowers risk", colorClass: "text-cyan-400", borderClass: "border-cyan-500/20", bg: "bg-cyan-500/8" },
                { variant: "APOE E4", label: "Risk", desc: "1 copy: 3× men, 6× women. 2 copies: 10× men, 15× women", colorClass: "text-red-400", borderClass: "border-red-500/20", bg: "bg-red-500/8" },
              ].map((v) => (
                <div key={v.variant} className={`glass rounded-xl border ${v.borderClass} ${v.bg} p-3`}>
                  <p className={`text-sm font-bold ${v.colorClass} mb-0.5`}>{v.variant}</p>
                  <p className={`text-[10px] font-semibold ${v.colorClass} mb-1`}>{v.label}</p>
                  <p className="text-xs text-readable-soft">{v.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-readable-faint">Chris Hemsworth carries two copies of APOE E4. He responded by making major lifestyle changes — not despair. Testing is a simple blood test through your doctor.<Cite id={11} /></p>
          </div>
        </Section>

        {/* Women & Alzheimer's */}
        <Section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <AlertCircle size={16} className="text-pink-400" />
            <h2 className="text-lg font-semibold text-white">Women & Alzheimer's: The Hidden Crisis</h2>
          </div>
          <div className="space-y-3">
            {womenFacts.map((w) => (
              <div key={w.point} className="glass rounded-xl border border-pink-500/15 p-4">
                <p className="text-sm font-medium text-pink-300 mb-1">{w.point}</p>
                <p className="text-sm text-readable-soft leading-relaxed">{w.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* SSRIs */}
        <Section className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <Pill size={16} className="text-red-400" />
            <h2 className="text-lg font-semibold text-white">SSRIs & Psychiatric Drugs</h2>
          </div>
          <p className="text-sm text-readable-soft mb-5">85% of psychiatric drugs in the US are prescribed by non-psychiatrists in 7-minute visits — and only 12% follow evidence-based guidelines. Dr. Amen calls this 'flying blind.'</p>
          <div className="space-y-2">
            {ssriPoints.map((pt) => (
              <Accordion key={pt.label} accentClass={pt.colorClass} iconColor="text-white/40" title={pt.label}>
                {pt.text}
              </Accordion>
            ))}
          </div>
        </Section>

        {/* Myths */}
        <Section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Eye size={16} className="text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Common Brain Health Myths</h2>
          </div>
          <div className="space-y-3">
            {myths.map((m) => (
              <div key={m.myth} className={`glass rounded-xl border ${m.borderClass} p-5`}>
                <div className="flex items-start gap-3 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${m.borderClass} ${m.labelClass} shrink-0 mt-0.5`}>MYTH</span>
                  <p className="text-sm font-medium text-white/80 italic">&ldquo;{m.myth}&rdquo;</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">REALITY</span>
                  <p className="text-sm text-readable-soft leading-relaxed">{m.reality}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Key Terms */}
        <Section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={16} className="text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Key Terms Explained</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(glossaryData) as GlossaryKey[]).map((key) => {
              const g = glossaryData[key];
              return (
                <button
                  key={key}
                  onClick={() => openGlossary(key)}
                  className="glass rounded-xl border border-cyan-500/10 hover:border-cyan-500/25 p-4 text-left transition-all group"
                >
                  <p className="text-sm font-medium text-cyan-300 group-hover:text-cyan-200 transition-colors mb-1">{g.title}</p>
                  <p className="text-[11px] text-readable-faint line-clamp-2 leading-relaxed">{g.body}</p>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Sources */}
        <Section id="sources" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={16} className="text-cyan-400/60" />
            <h2 className="text-base font-semibold text-white/60">Sources</h2>
          </div>
          <div className="space-y-2">
            {studies.map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="block glass rounded-xl border border-white/5 hover:border-cyan-500/20 p-4 transition-colors group">
                <div className="flex items-start gap-3">
                  <span className="text-[10px] text-cyan-400/50 font-mono shrink-0 mt-0.5">[{s.id}]</span>
                  <div>
                    <p className="text-xs font-medium text-white/70 group-hover:text-white/90 transition-colors leading-snug mb-1">{s.title}</p>
                    <p className="text-[10px] text-readable-faint">{s.journal} · {s.year}</p>
                    <p className="text-[10px] text-readable-faint mt-0.5 italic">{s.summary}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </Section>

      </div>

      {/* Glossary Modal */}
      <AnimatePresence>
        {entry && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setGlossaryKey(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg w-full z-50"
            >
              <div className="glass border border-cyan-500/20 rounded-t-2xl sm:rounded-2xl p-6 mx-0 sm:mx-4 shadow-2xl">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-semibold text-white leading-snug">{entry.title}</h3>
                  <button onClick={() => setGlossaryKey(null)} className="shrink-0 text-readable-faint hover:text-white transition-colors p-1 -m-1 rounded-lg hover:bg-white/5">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-sm text-readable-soft leading-relaxed">{entry.body}</p>
                {entry.learnMore && (
                  <a href={entry.learnMore} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors">
                    View source →
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
