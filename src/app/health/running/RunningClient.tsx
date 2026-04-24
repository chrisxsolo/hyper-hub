"use client";

import { createContext, useContext, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Activity,
  Heart,
  Zap,
  Shield,
  Dumbbell,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  X,
  BookOpen,
  Users,
  Brain,
  Wind,
  TrendingUp,
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
  persistenceHunting: {
    title: "Persistence Hunting",
    body: "A hunting technique where humans track and chase prey over long distances — not through speed, but through sustained jogging that prevents the prey from resting. Used by hunter-gatherers in Africa and documented in San Bushmen and Tarahumara peoples. Prey animals overheat because they can't pant while galloping, while humans cool via sweating. Lieberman and Bramble's 2004 Nature paper identified persistence hunting as a key evolutionary driver of the human body's unique running anatomy.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/15549097/",
  },
  VO2max: {
    title: "VO2 Max (Maximal Oxygen Uptake)",
    body: "The maximum rate at which your body can consume oxygen during intense exercise — a ceiling on your aerobic engine. It is arguably the single best predictor of all-cause mortality. Even small improvements (moving from 'low' to 'below average' fitness) reduce mortality risk by 50%. Improvements come fastest from high-intensity intervals (4×4 min at 90–95% max HR) combined with consistent Zone 2 training.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/30646238/",
  },
  cartilage: {
    title: "Articular Cartilage",
    body: "The smooth, white tissue covering the ends of bones where they form joints. Unlike bone, cartilage has no blood supply — it gets nutrients from synovial fluid through cyclic compression. This is the key insight: moderate loading (like running) actually pumps nutrients INTO cartilage and stimulates chondrocyte activity (cartilage cell production). Complete immobilization or extreme overuse — not moderate running — is what degrades cartilage.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/26782888/",
  },
  osteoarthritis: {
    title: "Osteoarthritis (OA)",
    body: "A degenerative joint disease characterized by breakdown of cartilage. Risk factors include: obesity (excess loading), previous joint injury, genetics, and extreme athletic mileage — but NOT regular moderate running. The 2017 Arthritis Care & Research study found recreational runners had a 3.5% knee OA rate vs. 10.2% for sedentary non-runners. The 'running wears out your knees' belief is a myth directly contradicted by the data.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/28002867/",
  },
  mismatchDisease: {
    title: "Mismatch Disease",
    body: "Diseases caused by a mismatch between our evolved biology and modern environment — coined by Daniel Lieberman in 'The Story of the Human Body' (2013). Our genome evolved under conditions requiring daily vigorous physical activity. Modern sedentary life creates chronic diseases our evolutionary ancestors never experienced: type 2 diabetes, osteoporosis, certain cancers, and cardiovascular disease. Physical inactivity is not the 'normal' baseline — it's the evolutionary mismatch.",
  },
  boneRemodeling: {
    title: "Wolff's Law / Bone Remodeling",
    body: "The principle that bone adapts its structure to the mechanical stresses placed on it. Bones are living tissue with osteoblasts (builders) and osteoclasts (resorbers) in constant activity. Load-bearing exercise — running, jumping, lifting — stimulates osteoblast activity, increasing bone density. Astronauts in microgravity and bed-ridden patients rapidly lose bone density — proof that loading is essential, not destructive. Tennis players' dominant arm bone is up to 40% thicker than their non-dominant arm.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/8059534/",
  },
  zone2: {
    title: "Zone 2 Training",
    body: "Low-intensity aerobic training at approximately 60–70% of max heart rate — just below the threshold where lactate begins accumulating faster than it clears. At this intensity, fat is the primary fuel and mitochondrial adaptations are maximized. Elite endurance athletes do 80% of their training volume in Zone 2. A practical test: you can hold a full conversation, but feel consistent effort. Heart rate monitors or lactate tests provide precise zone thresholds.",
  },
  sweatGlands: {
    title: "Eccrine Sweat Glands",
    body: "Humans have approximately 2–5 million eccrine sweat glands distributed across the body — a density roughly 10× higher than chimpanzees. This evolutionary adaptation allows extraordinary thermoregulation during sustained physical activity. While running mammals (like horses and dogs) must pause to pant, humans can simultaneously run and sweat-cool their entire body surface. Lieberman identifies this as one of the key anatomical adaptations that made humans the dominant persistence hunters.",
  },
  mitochondria: {
    title: "Mitochondrial Biogenesis",
    body: "The process of creating new mitochondria within cells, primarily triggered by aerobic exercise, fasting, and cold exposure. Mitochondria are the 'power plants' of cells — the more you have, the better your cells burn fat and the more efficiently they produce ATP. Zone 2 training is uniquely effective at driving mitochondrial biogenesis via the PGC-1α pathway. More mitochondria = better endurance, better fat metabolism, and better overall metabolic health.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/31328293/",
  },
  BDNF: {
    title: "BDNF (Brain-Derived Neurotrophic Factor)",
    body: "A protein that promotes the survival, growth, and maintenance of neurons — often called 'Miracle-Gro for the brain.' Aerobic exercise is the most reliable way to increase BDNF levels. BDNF drives neurogenesis (new neuron formation) in the hippocampus, the brain region central to memory and learning. Chronic stress and sedentary behavior suppress BDNF. Running-induced BDNF elevation is thought to be responsible for the well-documented antidepressant effects of exercise.",
  },
  lt1: {
    title: "Lactate Threshold 1 (LT1 / Aerobic Threshold)",
    body: "The first lactate threshold is the exercise intensity at which blood lactate first begins rising above resting levels — but is still being cleared as fast as it's produced. Below LT1, your aerobic system handles everything cleanly and fat is the dominant fuel. Above LT1 (Zones 3+), lactate accumulates, carbohydrate becomes dominant, and fatigue accelerates. Zone 2 training sits just below LT1. It is precisely this boundary that makes Zone 2 the mitochondrial sweet spot: you maximally stress the aerobic system without triggering the anaerobic shift that changes the training stimulus. LT1 can be measured precisely via blood lactate testing during an incremental exercise test.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/29921710/",
  },
  pgc1alpha: {
    title: "PGC-1α — The Mitochondrial Master Switch",
    body: "Peroxisome proliferator-activated receptor gamma coactivator 1-alpha (PGC-1α) is the master transcriptional regulator of mitochondrial biogenesis — the construction of new mitochondria. When activated by sustained aerobic exercise, PGC-1α triggers production of hundreds of mitochondrial proteins, growing both the number and size of mitochondria inside muscle cells. Zone 2 provides the optimal sustained stimulus for PGC-1α: the intensity is high enough to activate it, the duration can be sustained for hours (unlike HIIT), and it can be repeated daily without excessive fatigue. PGC-1α is also activated by fasting, cold exposure, and HIIT — but Zone 2 at high weekly volume is the most powerful driver of chronic mitochondrial adaptation.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/12872135/",
  },
  slowTwitch: {
    title: "Type I Slow-Twitch Muscle Fibers",
    body: "Muscle fibers come in two primary types. Type I (slow-twitch) fibers are densely packed with mitochondria, highly fatigue-resistant, and rely primarily on fat for fuel — making them the workhorse of aerobic endurance. Type II (fast-twitch) fibers produce more force quickly but fatigue fast and rely more on anaerobic glycolysis. Zone 2 intensity specifically recruits and trains Type I fibers, driving mitochondrial adaptations in exactly the fibers that matter for aerobic performance and metabolic health. With months of Zone 2 training, some Type IIa fibers can adopt Type I-like metabolic properties — expanding the pool of aerobically efficient muscle.",
  },
  lactateShuttle: {
    title: "The Lactate Shuttle",
    body: "First described by exercise physiologist George Brooks (UC Berkeley), the lactate shuttle overturned the old idea that lactate is simply 'waste' from anaerobic metabolism. In reality, lactate produced by working muscles is actively transported into adjacent mitochondria (and the heart) and oxidized as a premium fuel. Athletes with high mitochondrial density don't produce less lactate than untrained people — they clear it dramatically faster, because more mitochondria means more shuttle capacity. This is why trained athletes can run at faster paces before hitting their lactate threshold. Zone 2 training is the primary way to improve lactate shuttle efficiency.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/11279330/",
  },
  lactate: {
    title: "Lactate (Not Lactic Acid)",
    body: "Lactate and lactic acid are not the same molecule — a critical distinction. At the pH of human blood, lactic acid instantly dissociates into lactate + a hydrogen ion (H⁺). The H⁺ ion causes cellular acidosis and the burning sensation during hard exercise. Lactate itself is not the culprit. It is a metabolic intermediate produced continuously — even at rest — whenever glucose is broken down via glycolysis. At low intensities, mitochondria clear lactate as fast as it's produced. At higher intensities, production exceeds clearance and blood lactate rises. George Brooks' decades of research (UC Berkeley) established that lactate is a premium fuel, an energy carrier between tissues, and a signaling molecule with systemic effects — one of the most important and misunderstood molecules in exercise physiology.",
    learnMore: "https://pubmed.ncbi.nlm.nih.gov/29617640/",
  },
  MCT: {
    title: "MCT Proteins (Monocarboxylate Transporters)",
    body: "Monocarboxylate transporter proteins (primarily MCT1 and MCT4) are the gatekeepers of lactate movement between cells. MCT4 exports lactate from fast-twitch muscle fibers that produce it; MCT1 imports it into slow-twitch fibers and the heart that burn it. Endurance training dramatically increases MCT1 and MCT4 expression — this is a key adaptation that raises lactate threshold. More MCT proteins = faster lactate shuttling = better performance at higher intensities. This is a direct molecular reason why trained athletes handle higher workloads before lactate accumulates.",
  },
} as const;

type GlossaryKey = keyof typeof glossaryData;

const GlossaryContext = createContext<(key: GlossaryKey) => void>(() => {});

function GlossaryTerm({ termKey, children }: { termKey: GlossaryKey; children: React.ReactNode }) {
  const open = useContext(GlossaryContext);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); open(termKey); }}
      className="text-emerald-300/85 underline decoration-dotted decoration-emerald-400/35 underline-offset-2 hover:text-emerald-200 transition-colors"
    >
      {children}
    </button>
  );
}

function Cite({ id }: { id: number }) {
  return (
    <a
      href="#sources"
      className="text-[9px] text-emerald-400/50 hover:text-emerald-400 transition-colors align-super leading-none ml-0.5"
    >
      [{id}]
    </a>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const quickStats = [
  { value: "2M+", label: "Years humans evolved running", note: "Persistence hunting shaped our anatomy", valueClass: "text-emerald-400", gradientClass: "from-emerald-500/10" },
  { value: "3×", label: "Lower knee OA in runners", note: "vs. sedentary individuals", valueClass: "text-green-400", gradientClass: "from-green-500/10" },
  { value: "40%", label: "Lower all-cause mortality", note: "High cardio fitness vs. low", valueClass: "text-teal-400", gradientClass: "from-teal-500/10" },
  { value: "30–50%", label: "Lower cancer risk", note: "Regular vigorous activity", valueClass: "text-lime-400", gradientClass: "from-lime-500/10" },
];

const myths = [
  {
    number: "01",
    myth: "Running destroys your knees",
    reality: "Recreational runners have nearly 3× lower knee osteoarthritis rates than sedentary non-runners. Cartilage is living tissue that adapts and strengthens under cyclic loading.",
    data: "3.5% OA in runners vs 10.2% in non-runners",
    source: 3,
  },
  {
    number: "02",
    myth: "Running is hard on your heart",
    reality: "Running is one of the most cardioprotective activities known. Highly fit individuals have 40–50% lower cardiovascular mortality. Hunter-gatherers who run daily maintain youthful blood pressure into their 80s.",
    data: "40–50% lower CV mortality in high-fitness individuals",
    source: 7,
  },
  {
    number: "03",
    myth: "You must breathe through your nose while running",
    reality: "Humans evolved mouth breathing specifically for running. The nasal passage provides only ~35% of mouth airflow capacity. Nose breathing at high intensity starves muscles of oxygen — the mouth is the evolved high-output airway.",
    data: "Nasal passage: ~35% of mouth airflow capacity",
    source: 1,
  },
  {
    number: "04",
    myth: "Running causes bone damage and stress fractures",
    reality: "Progressive running builds bone density via Wolff's Law. Bone remodels stronger under repeated load. Stress fractures occur from rapid mileage jumps — not from running itself.",
    data: "Loaded bone: up to 40% greater density than unloaded",
    source: 6,
  },
  {
    number: "05",
    myth: "Running is unnatural and humans aren't built for it",
    reality: "Humans have 26+ anatomical features evolved specifically for running: nuchal ligament, Achilles tendon, gluteus maximus, elastic arches, and eccrine sweat glands at 10× chimp density.",
    data: "26 features identified by Bramble & Lieberman (2004)",
    source: 1,
  },
  {
    number: "06",
    myth: "Runners age faster and die younger from joint wear",
    reality: "A 21-year longitudinal study found runners had ~50% lower mortality and significantly lower disability scores than non-runners — even into their 70s and 80s.",
    data: "~50% lower mortality across 21-year follow-up",
    source: 8,
  },
];

const benefits = [
  {
    icon: Heart,
    title: "Cardiovascular Health",
    iconClass: "text-red-400",
    borderClass: "border-red-500/20 hover:border-red-500/35",
    gradientClass: "from-red-500/8",
    chevronClass: "text-red-400",
    preview: "Hunter-gatherers maintain the same BP at 80 as at 20",
    points: [
      "Hunter-gatherers who remain active maintain same blood pressure at 80 as at 20",
      "Running reduces resting heart rate — the heart pumps more blood per stroke",
      "Lowers LDL, raises HDL, reduces the dangerous small dense LDL particles",
      "Reduces arterial stiffness and improves endothelial function",
      "40–50% lower cardiovascular disease mortality in highly fit individuals",
    ] as React.ReactNode[],
  },
  {
    icon: Shield,
    title: "Cancer Prevention",
    iconClass: "text-purple-400",
    borderClass: "border-purple-500/20 hover:border-purple-500/35",
    gradientClass: "from-purple-500/8",
    chevronClass: "text-purple-400",
    preview: "30–50% lower breast cancer risk in physically active women",
    points: [
      "30–50% lower breast cancer risk in physically active women",
      <>Moore et al. 2016 <Cite id={4} />: exercise reduces risk for 13 of 26 cancer types studied</>,
      "Mechanisms: lower circulating estrogens, reduced inflammation, better immune surveillance",
      "Colon cancer risk reduced 40–50% with regular vigorous activity",
      "GDP and cancer rates track nearly as a straight line: the richer (and more sedentary) the country, the higher the cancer incidence — Lieberman",
      "Bangladeshi women who move to England see cancer rates rise sharply — diet, inactivity, and stress are the primary drivers, not genetics",
    ] as React.ReactNode[],
  },
  {
    icon: Brain,
    title: "Brain & Mental Health",
    iconClass: "text-blue-400",
    borderClass: "border-blue-500/20 hover:border-blue-500/35",
    gradientClass: "from-blue-500/8",
    chevronClass: "text-blue-400",
    preview: "Running is as effective as antidepressants for mild-moderate depression",
    points: [
      <><GlossaryTerm termKey="BDNF">BDNF</GlossaryTerm> (brain-derived neurotrophic factor) surges with aerobic exercise — new neurons grow in the hippocampus</>,
      "Comparable efficacy to antidepressants for mild-to-moderate depression",
      "Runner's high: endocannabinoid system activation — not just endorphins as commonly believed",
      "Reduces Alzheimer's risk — BDNF and improved insulin sensitivity both protect neurons",
      "Reduces cortisol baseline and improves stress resilience over time",
    ] as React.ReactNode[],
  },
  {
    icon: Dumbbell,
    title: "Metabolic Health",
    iconClass: "text-emerald-400",
    borderClass: "border-emerald-500/20 hover:border-emerald-500/35",
    gradientClass: "from-emerald-500/8",
    chevronClass: "text-emerald-400",
    preview: "Insulin-sensitizing effects persist 24–48h after each run",
    points: [
      "GLUT4 transporters activate independently of insulin during muscle contractions",
      "Insulin-sensitizing effects last 24–48 hours after each session",
      <><GlossaryTerm termKey="zone2">Zone 2 running</GlossaryTerm> maximizes fat oxidation and <GlossaryTerm termKey="mitochondria">mitochondrial density</GlossaryTerm></>,
      "Reduces visceral fat more effectively than caloric restriction alone",
      <>Improves <GlossaryTerm termKey="VO2max">VO2 max</GlossaryTerm> — the single strongest predictor of longevity</>,
      "Exercise outperforms intermittent fasting: both activate overlapping cellular repair genes, but exercise triggers more of them more acutely — fasting is not a movement substitute (Lieberman)",
    ] as React.ReactNode[],
  },
];

const studies = [
  {
    id: 1,
    title: "Endurance Running and the Evolution of Homo",
    journal: "Nature",
    year: 2004,
    url: "https://pubmed.ncbi.nlm.nih.gov/15549097/",
    summary: "Bramble & Lieberman identify 26+ anatomical features in humans evolved specifically for sustained running — the foundational paper on human running evolution",
  },
  {
    id: 2,
    title: "Is Exercise Really Medicine? An Evolutionary Perspective",
    journal: "Current Sports Medicine Reports",
    year: 2015,
    url: "https://pubmed.ncbi.nlm.nih.gov/26166056/",
    summary: "Lieberman frames physical inactivity as the true mismatch disease — not running. Reviews evidence that human physiology requires daily movement to function properly",
  },
  {
    id: 3,
    title: "Is There an Association Between a History of Running and Symptomatic Knee Osteoarthritis? A Cross-Sectional Study From the Osteoarthritis Initiative",
    journal: "Arthritis Care & Research",
    year: 2017,
    url: "https://pubmed.ncbi.nlm.nih.gov/27333572/",
    summary: "Recreational runners: 3.5% knee OA. Non-runners: 10.2%. Competitive high-mileage runners: 13.3%. Moderate running is protective, not harmful",
  },
  {
    id: 4,
    title: "Association of Leisure-Time Physical Activity With Risk of 26 Types of Cancer",
    journal: "JAMA Internal Medicine",
    year: 2016,
    url: "https://pubmed.ncbi.nlm.nih.gov/27183032/",
    summary: "1.44 million adults: exercise significantly reduces risk for 13 of 26 cancer types — breast (−10%), colon (−16%), esophagus, kidney, liver and more",
  },
  {
    id: 5,
    title: "Sedentary Time and Its Association With Risk for Disease Incidence, Mortality, and Hospitalization",
    journal: "Annals of Internal Medicine",
    year: 2015,
    url: "https://pubmed.ncbi.nlm.nih.gov/25599350/",
    summary: "Sitting is independently associated with all-cause mortality regardless of leisure physical activity level — both leisure AND occupational sitting carry independent risk",
  },
  {
    id: 6,
    title: "Effect of Long-Term Unilateral Activity on Bone Mineral Density of Female Junior Tennis Players",
    journal: "Journal of Bone and Mineral Research",
    year: 1998,
    url: "https://pubmed.ncbi.nlm.nih.gov/9495526/",
    summary: "Tennis players' dominant arm bone density significantly higher than non-dominant — direct proof that repeated mechanical loading builds bone density via Wolff's Law",
  },
  {
    id: 7,
    title: "Cardiorespiratory Fitness as a Quantitative Predictor of All-Cause Mortality and Cardiovascular Events in Healthy Men and Women: A Meta-Analysis",
    journal: "JAMA",
    year: 2009,
    url: "https://pubmed.ncbi.nlm.nih.gov/19454641/",
    summary: "Kodama et al. meta-analysis: high cardiorespiratory fitness associated with significantly lower all-cause and cardiovascular mortality compared to low fitness",
  },
  {
    id: 8,
    title: "Reduced Disability and Mortality Among Aging Runners",
    journal: "Archives of Internal Medicine",
    year: 2008,
    url: "https://pubmed.ncbi.nlm.nih.gov/18695077/",
    summary: "21-year longitudinal study: runners showed significantly lower disability and ~50% lower mortality rate than non-runners",
  },
  {
    id: 9,
    title: "Exercise and Mitochondrial Health",
    journal: "Journal of Physiology",
    year: 2021,
    url: "https://pubmed.ncbi.nlm.nih.gov/31674658/",
    summary: "Memme et al. comprehensive review: endurance exercise drives mitochondrial biogenesis, dynamics, and quality control — covering PGC-1α signaling and the role of aerobic training in metabolic health",
  },
  {
    id: 10,
    title: "Exercise Capacity and Mortality Among Men Referred for Exercise Testing",
    journal: "New England Journal of Medicine",
    year: 2002,
    url: "https://pubmed.ncbi.nlm.nih.gov/11893790/",
    summary: "Myers et al.: each 1-MET increase in exercise capacity associated with 12% lower mortality. Low fitness was a stronger mortality predictor than smoking, hypertension, or diabetes",
  },
  {
    id: 11,
    title: "Assessment of Metabolic Flexibility by Means of Measuring Blood Lactate, Fat, and Carbohydrate Oxidation Responses to Exercise in Professional Endurance Athletes and Less-Fit Individuals",
    journal: "Sports Medicine",
    year: 2018,
    url: "https://pubmed.ncbi.nlm.nih.gov/28623613/",
    summary: "San Millán & Brooks: Zone 2 intensity (below LT1) maximally stimulates mitochondrial biogenesis and metabolic flexibility — foundational science behind Zone 2's metabolic health benefits",
  },
  {
    id: 12,
    title: "Adaptations of Skeletal Muscle to Endurance Exercise and Their Metabolic Consequences",
    journal: "Journal of Applied Physiology",
    year: 1984,
    url: "https://pubmed.ncbi.nlm.nih.gov/6373687/",
    summary: "Holloszy & Coyle: endurance training causes mitochondrial proliferation in muscle, increasing fat oxidation capacity, raising lactate threshold, and improving performance at submaximal intensities",
  },
  {
    id: 13,
    title: "Limiting Factors for Maximum Oxygen Uptake and Determinants of Endurance Performance",
    journal: "Medicine & Science in Sports & Exercise",
    year: 2000,
    url: "https://pubmed.ncbi.nlm.nih.gov/10647532/",
    summary: "Bassett & Howley: VO2 max is limited by cardiac output (central) and mitochondrial oxygen extraction (peripheral). Zone 2 improves peripheral extraction; HIIT improves cardiac output — both are required",
  },
  {
    id: 14,
    title: "Aerobic High-Intensity Intervals Improve VO2max More Than Moderate Training",
    journal: "Medicine & Science in Sports & Exercise",
    year: 2007,
    url: "https://pubmed.ncbi.nlm.nih.gov/17414804/",
    summary: "Helgerud et al.: 4×4 min intervals at 90–95% HRmax produce significantly greater VO2max gains than continuous moderate or threshold training — the evidence base for the Norwegian 4×4 protocol",
  },
  {
    id: 15,
    title: "The Science and Translation of Lactate Shuttle Theory",
    journal: "Cell Metabolism",
    year: 2018,
    url: "https://pubmed.ncbi.nlm.nih.gov/29617642/",
    summary: "Brooks' landmark review: lactate is a premium fuel, energy carrier, and signaling molecule — not waste. Covers the cell-cell and intracellular lactate shuttles, the heart's preference for lactate, and lactate's role in angiogenesis and metabolic signaling",
  },
  {
    id: 16,
    title: "The Lactate Shuttle During Exercise and Recovery",
    journal: "Medicine & Science in Sports & Exercise",
    year: 1986,
    url: "https://pubmed.ncbi.nlm.nih.gov/3523107/",
    summary: "Brooks' original lactate shuttle paper — overturning the 'lactic acid = waste' dogma and establishing that lactate is actively transported between cells and oxidized as a premium fuel during and after exercise",
  },
  {
    id: 17,
    title: "Lactate Mediates the Effects of Exercise on Learning and Memory Through SIRT1-Dependent Activation of Hippocampal Brain-Derived Neurotrophic Factor (BDNF)",
    journal: "Journal of Neuroscience",
    year: 2019,
    url: "https://pubmed.ncbi.nlm.nih.gov/30692222/",
    summary: "Lactate produced during exercise crosses the blood-brain barrier and mediates improvements in learning and memory via hippocampal BDNF signaling — establishing lactate as a direct neuroprotective signal from working muscle to brain",
  },
];

const contributors = [
  {
    initials: "DL",
    name: "Daniel Lieberman",
    credentials: "PhD · Professor of Human Evolutionary Biology",
    affiliation: "Harvard University",
    focus: "Evolution of human running; mismatch diseases; endurance running anatomy; physical activity science. Author of 'Exercised' (2020) and 'The Story of the Human Body' (2013)",
  },
  {
    initials: "PM",
    name: "Philip Maffetone",
    credentials: "MAc · Coach · Author",
    affiliation: "Independent",
    focus: "MAF Method (Maximum Aerobic Function); Zone 2 training protocols; fat adaptation and aerobic base building for endurance athletes",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RunningClient() {
  const [expandedBenefit, setExpandedBenefit] = useState<number | null>(null);
  const [activeGlossary, setActiveGlossary] = useState<GlossaryKey | null>(null);
  const activeGlossaryEntry: GlossaryEntry | null = activeGlossary ? glossaryData[activeGlossary] : null;

  return (
    <GlossaryContext.Provider value={setActiveGlossary}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Link
            href="/health"
            className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors mb-10"
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
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-xl shrink-0">
              🏃
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Running & Aerobic Training</h1>
              <p className="text-sm text-readable-soft mt-1">Evolutionary biology · Sports science · Longevity</p>
            </div>
          </div>
          <p className="text-readable-soft text-sm leading-relaxed max-w-2xl">
            Humans are the premier endurance athletes of the animal kingdom. We evolved to run —
            and the science is clear: running doesn&apos;t wear you down. Inactivity does.{" "}
            <span className="text-emerald-300/80">Every major chronic disease of modernity is a <GlossaryTerm termKey="mismatchDisease">mismatch disease</GlossaryTerm> — a consequence of not doing what our bodies evolved to do.</span>
          </p>
        </motion.div>

        {/* Glossary hint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 border border-white/10">
            <span className="text-[10px] text-emerald-400/70 font-semibold tracking-wide">TIP</span>
            <span className="text-[10px] text-readable-soft">
              Tap <span className="text-emerald-300/70 underline decoration-dotted underline-offset-1">highlighted terms</span> for in-depth explanations
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
                <p className="text-[11px] text-readable-muted leading-snug mb-1">{stat.label}</p>
                <p className="text-[10px] text-readable-faint">{stat.note}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Content */}
        <div className="space-y-5">

          {/* ── The Evolutionary Runner ─────────────────────────────────────── */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Activity size={16} className="text-emerald-400" />
                  <h2 className="text-base font-semibold text-white">The Evolutionary Runner</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-300/80 border-emerald-500/15">
                    Evolutionary Biology
                  </span>
                </div>

                <p className="text-sm text-readable-muted leading-relaxed mb-5">
                  Humans are the best long-distance runners on the planet. We can outrun a horse in sustained heat.<Cite id={1} />{" "}
                  Not because we&apos;re fast — we&apos;re not. But because we can run for hours without overheating.
                  This is the product of{" "}
                  <span className="text-emerald-300/80 font-medium">2+ million years of evolution shaped by <GlossaryTerm termKey="persistenceHunting">persistence hunting</GlossaryTerm></span>.
                </p>

                {/* Evolutionary adaptations grid */}
                <p className="text-xs font-semibold text-readable-soft uppercase tracking-wider mb-3">
                  26 Anatomical Features Evolved for Running<Cite id={1} />
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {[
                    {
                      emoji: "💦",
                      title: "Eccrine Sweat Glands",
                      desc: <>Humans have ~10× the sweat gland density of chimpanzees. <GlossaryTerm termKey="sweatGlands">2–5 million glands</GlossaryTerm> coat our skin, enabling full-body cooling while running — impossible for panting animals. This is why we can outrun horses in heat over distance.</>,
                    },
                    {
                      emoji: "🦵",
                      title: "Achilles Tendon",
                      desc: "A large elastic tendon absent in chimps. It stores and releases energy like a spring with each stride — reducing running metabolic cost by ~50%. Without it, running as bipeds would be energetically impossible.",
                    },
                    {
                      emoji: "🍑",
                      title: "Gluteus Maximus",
                      desc: "Humans have disproportionately large glutes compared to all other primates. The glute is inactive during walking but powerfully engages during running to prevent the trunk from pitching forward. It's a running muscle.",
                    },
                    {
                      emoji: "🦶",
                      title: "Elastic Foot Arch",
                      desc: "The human foot arch is a spring — unique among primates. It deflects under load and recoils to return ~17% of energy per step. Flat feet reduce running efficiency but don't increase injury risk when foot strength is maintained.",
                    },
                    {
                      emoji: "🧠",
                      title: "Nuchal Ligament",
                      desc: "A ligament at the back of the skull found in fast-running animals (dogs, horses) but absent in chimps and gorillas. In humans, it connects the skull to the spine — stabilizing the head during the forward lean of running without any muscle effort.",
                    },
                    {
                      emoji: "👃",
                      title: "Short Toes",
                      desc: "Human toes are dramatically shorter than ape toes — increasing running economy. Longer toes would require more force to push off and would reduce stability. Short toes are a running-specific adaptation, not a walking one.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="glass rounded-xl p-4 border border-white/8 flex items-start gap-3">
                      <span className="text-xl shrink-0 mt-0.5">{item.emoji}</span>
                      <div>
                        <p className="text-xs font-semibold text-emerald-300/80 mb-1">{item.title}</p>
                        <p className="text-xs text-readable-soft leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Callout */}
                <div className="glass rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-xs font-semibold text-emerald-400 mb-1">The Man vs. Horse Marathon</p>
                  <p className="text-xs text-readable-soft leading-relaxed">
                    Since 1980, Llanwrtyd Wells, Wales has hosted a race pitting humans against horses over 22 miles.
                    Humans have won{" "}
                    <span className="text-emerald-300 font-medium">multiple times</span> — exclusively on hot days.
                    In the heat, horses must slow to pant-cool themselves. Humans keep running.
                    This race illustrates what Lieberman&apos;s research confirmed: humans didn&apos;t evolve to be fast — we evolved to be{" "}
                    <em>unstoppable over distance</em>.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Common Running Myths ────────────────────────────────────────── */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-rose-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <AlertCircle size={16} className="text-rose-400" />
                  <h2 className="text-base font-semibold text-white">6 Running Myths — Debunked by Science</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-rose-500/10 text-rose-300/80 border-rose-500/15">
                    Evidence-Based
                  </span>
                </div>

                <p className="text-sm text-readable-soft leading-relaxed mb-5">
                  Running has accumulated a library of misconceptions — many of which keep people from doing the one activity
                  their body evolved to do. Here&apos;s what the evidence actually shows.
                </p>

                <div className="space-y-3">
                  {myths.map((myth) => (
                    <div key={myth.number} className="glass rounded-xl border border-white/8 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-[10px] font-bold text-rose-400/60 bg-rose-500/10 rounded px-1.5 py-0.5 shrink-0 mt-0.5 font-mono">
                            {myth.number}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-rose-400 text-xs shrink-0 mt-0.5">✗</span>
                              <p className="text-xs font-semibold text-rose-300/80 line-through decoration-rose-400/40">
                                MYTH: {myth.myth}
                              </p>
                            </div>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-emerald-400 text-xs shrink-0 mt-0.5">✓</span>
                              <p className="text-xs text-readable-muted leading-relaxed">
                                <span className="text-emerald-400 font-semibold">REALITY: </span>
                                {myth.reality}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 pl-4">
                              <div className="h-px flex-1 bg-white/8" />
                              <span className="text-[10px] text-emerald-400/60 font-medium">{myth.data}</span>
                              <Cite id={myth.source} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* ── Running & Your Knees ────────────────────────────────────────── */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-teal-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-base">🦵</span>
                  <h2 className="text-base font-semibold text-white">Running Does NOT Destroy Your Knees</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-teal-500/10 text-teal-300/80 border-teal-500/15">
                    Deep Dive
                  </span>
                </div>

                <p className="text-sm text-readable-muted leading-relaxed mb-5">
                  The &quot;running ruins your knees&quot; myth is one of the most costly misconceptions in medicine —
                  it keeps millions of people from an activity that would actually <em>protect</em> their joints.
                  The data tells the opposite story.<Cite id={3} />
                </p>

                {/* OA Rate Visualization */}
                <div className="glass rounded-xl p-4 border border-teal-500/20 mb-5">
                  <p className="text-xs font-semibold text-teal-400 mb-4">Knee Osteoarthritis Rates by Activity Level<Cite id={3} /></p>
                  <div className="space-y-3">
                    {[
                      { label: "Recreational Runners", rate: 3.5, maxRate: 15, color: "bg-emerald-500", textColor: "text-emerald-400", note: "The protected group" },
                      { label: "Sedentary Non-Runners", rate: 10.2, maxRate: 15, color: "bg-amber-500", textColor: "text-amber-400", note: "Baseline comparison" },
                      { label: "Competitive Runners (elite/very high mileage)", rate: 13.3, maxRate: 15, color: "bg-orange-500", textColor: "text-orange-400", note: "Extreme volume carries risk" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <span className="text-xs text-readable-muted">{item.label}</span>
                            <span className="text-[10px] text-readable-faint ml-2">{item.note}</span>
                          </div>
                          <span className={`text-sm font-bold ${item.textColor}`}>{item.rate}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
                          <motion.div
                            className={`h-full ${item.color} rounded-full opacity-70`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(item.rate / item.maxRate) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-readable-faint mt-3 italic">
                    Source: Lo et al., Arthritis Care &amp; Research, 2017. n = 2,683 participants.
                  </p>
                </div>

                {/* Why the myth is wrong */}
                <p className="text-xs font-semibold text-readable-soft uppercase tracking-wider mb-3">Why the &quot;Wear &amp; Tear&quot; Theory Is Wrong</p>
                <div className="space-y-2 mb-5">
                  {[
                    {
                      icon: "🔬",
                      title: "Cartilage is not a rubber eraser",
                      desc: <><GlossaryTerm termKey="cartilage">Articular cartilage</GlossaryTerm> is living tissue with active cells (chondrocytes). The &quot;wear and tear&quot; model treats it like a passive material that wears down with use — but biology doesn&apos;t work that way. Cartilage responds to and adapts to load.</>,
                    },
                    {
                      icon: "💧",
                      title: "Running pumps nutrients into cartilage",
                      desc: "Cartilage has no blood vessels — it gets oxygen and nutrients from synovial fluid through cyclic compression. When you run, the repeated loading and unloading literally pumps nutrients in and waste products out. Immobilization starves cartilage.",
                    },
                    {
                      icon: "⚡",
                      title: "Moderate load triggers cartilage remodeling",
                      desc: "Chondrocytes respond to mechanical stress by producing more matrix proteins (collagen, proteoglycans). Regular running stimulates this production. Studies show recreational runners have measurably thicker knee cartilage than sedentary controls.",
                    },
                    {
                      icon: "⚠️",
                      title: "What actually causes knee OA",
                      desc: <>The real risk factors for <GlossaryTerm termKey="osteoarthritis">knee osteoarthritis</GlossaryTerm>: obesity (excess compressive load), previous ACL/meniscus injury, genetics, and extreme high-mileage competitive running. Moderate recreational running at healthy body weight is not on this list.</>,
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 glass rounded-xl p-3.5 border border-white/8">
                      <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-readable-strong mb-0.5">{item.title}</p>
                        <p className="text-xs text-readable-soft leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Insight */}
                <div className="glass rounded-xl p-4 border border-teal-500/25 bg-teal-500/5">
                  <div className="flex items-start gap-2">
                    <Zap size={14} className="text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-teal-400 mb-1">The Dose Makes the Medicine — or the Poison</p>
                      <p className="text-xs text-readable-soft leading-relaxed">
                        The data show a U-shaped curve: sedentary people and extreme competitive runners both have higher OA rates than moderate recreational runners.
                        The optimal dose is roughly <span className="text-teal-300 font-medium">15–25 miles/week at conversational pace</span>.
                        The problem has never been running — it&apos;s been doing too much too soon without adequate recovery and strength.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Benefits of Running ─────────────────────────────────────────── */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-emerald-500/15 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/6 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <h2 className="text-base font-semibold text-white">Why You Should Run: 4 Evidence-Based Benefits</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-300/80 border-emerald-500/15">
                    Tap to expand
                  </span>
                </div>
                <div className="space-y-2">
                  {benefits.map((benefit, i) => {
                    const Icon = benefit.icon;
                    const isOpen = expandedBenefit === i;
                    return (
                      <div
                        key={benefit.title}
                        className={`glass rounded-xl border ${benefit.borderClass} relative overflow-hidden transition-all duration-200 cursor-pointer`}
                        onClick={() => setExpandedBenefit(isOpen ? null : i)}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradientClass} to-transparent pointer-events-none`} />
                        <div className="relative p-4">
                          <div className="flex items-center gap-3">
                            <Icon size={16} className={benefit.iconClass} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white/85">{benefit.title}</p>
                              {!isOpen && (
                                <p className="text-xs text-readable-soft mt-0.5 truncate">{benefit.preview}</p>
                              )}
                            </div>
                            {isOpen
                              ? <ChevronDown size={14} className={benefit.chevronClass} />
                              : <ChevronRight size={14} className="text-readable-faint" />}
                          </div>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <ul className="mt-3 space-y-2">
                                  {benefit.points.map((pt, j) => (
                                    <li key={j} className="flex items-start gap-2">
                                      <span className={`${benefit.iconClass} text-xs shrink-0 mt-0.5`}>•</span>
                                      <span className="text-xs text-readable-muted leading-relaxed">{pt}</span>
                                    </li>
                                  ))}
                                </ul>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Section>

          {/* ── Zone 2 & Aerobic Base ───────────────────────────────────────── */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-green-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Wind size={16} className="text-green-400" />
                  <h2 className="text-base font-semibold text-white">Zone 2: The Foundation of Fitness</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-green-500/10 text-green-300/80 border-green-500/15">
                    80/20 Rule
                  </span>
                </div>

                <p className="text-sm text-readable-muted leading-relaxed mb-5">
                  <GlossaryTerm termKey="zone2">Zone 2 training</GlossaryTerm> — low-intensity aerobic effort at 60–70% of max heart rate — is
                  the single most important training adaptation you can build.<Cite id={9} />{" "}
                  Elite endurance athletes dedicate <span className="text-green-300/80 font-medium">80% of their training volume</span> to Zone 2.
                  It is where <GlossaryTerm termKey="mitochondria">mitochondrial biogenesis</GlossaryTerm> is maximized and fat oxidation is trained.
                </p>

                {/* Zone intensity visualization */}
                <div className="glass rounded-xl p-4 border border-green-500/20 mb-5">
                  <p className="text-xs font-semibold text-green-400 mb-3">Heart Rate Zones — Where the Adaptations Happen</p>
                  <div className="space-y-2.5">
                    {[
                      { zone: "Zone 1", pct: "50–60%", label: "Active Recovery", desc: "Walking pace. Minimal training stimulus.", width: 30, color: "bg-blue-500/50", textColor: "text-blue-400" },
                      { zone: "Zone 2", pct: "60–70%", label: "Fat Burning / Mitochondria", desc: "Conversational pace. Maximum mitochondrial adaptation. Dominant zone.", width: 80, color: "bg-green-500/60", textColor: "text-green-400", highlight: true },
                      { zone: "Zone 3", pct: "70–80%", label: "Aerobic Threshold", desc: "Moderate effort. Tempo zone. Use sparingly.", width: 55, color: "bg-yellow-500/50", textColor: "text-yellow-400" },
                      { zone: "Zone 4", pct: "80–90%", label: "VO2 Max Development", desc: "Hard. Intervals. 10–20% of total training volume.", width: 40, color: "bg-orange-500/50", textColor: "text-orange-400" },
                      { zone: "Zone 5", pct: "90–100%", label: "Neuromuscular / Sprint", desc: "All-out. Very short durations. Race-specific.", width: 20, color: "bg-red-500/50", textColor: "text-red-400" },
                    ].map((z) => (
                      <div key={z.zone} className={`flex items-center gap-3 ${z.highlight ? "glass rounded-lg p-2 border border-green-500/20" : ""}`}>
                        <div className="w-16 shrink-0">
                          <p className={`text-[10px] font-bold ${z.textColor}`}>{z.zone}</p>
                          <p className="text-[9px] text-readable-faint">{z.pct} HR</p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-readable-muted">{z.label}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                            <div className={`h-full ${z.color} rounded-full`} style={{ width: `${z.width}%` }} />
                          </div>
                          <p className="text-[9px] text-readable-faint mt-0.5">{z.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { emoji: "🔋", title: "Aerobic Base", desc: "Zone 2 training builds a large aerobic base. All higher-intensity training sits on top of this base — a bigger base allows a higher ceiling." },
                    { emoji: "🏭", title: "Mitochondrial Density", desc: "Zone 2 uniquely drives PGC-1α, the master regulator of mitochondrial biogenesis. More mitochondria per cell = better fat burning, better endurance, better metabolic health." },
                    { emoji: "🔥", title: "Fat Adaptation", desc: "At Zone 2, fat is the primary fuel. Over weeks, your body becomes a better fat-burning engine — sparing glycogen, sustaining effort longer, and improving insulin sensitivity." },
                  ].map((item) => (
                    <div key={item.title} className="glass rounded-xl p-4 border border-white/8 text-center">
                      <div className="text-2xl mb-2">{item.emoji}</div>
                      <p className="text-xs font-semibold text-green-300/80 mb-1">{item.title}</p>
                      <p className="text-[10px] text-readable-soft leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Why exactly 60-70%? */}
                <div className="mt-5">
                  <p className="text-xs font-semibold text-readable-soft uppercase tracking-wider mb-3">
                    Why Exactly 60–70%? The Physiology<Cite id={11} />
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        icon: "📉",
                        title: "Below the first lactate threshold (LT1)",
                        desc: <><GlossaryTerm termKey="lt1">LT1</GlossaryTerm> is the precise intensity where lactate first starts rising above resting. Below it, your body handles energy production almost entirely aerobically — fat burns cleanly, mitochondria run at near-full capacity, and you can sustain effort for hours. Above LT1 (Zone 3+), carbohydrate takes over, lactate accumulates, and the training stimulus changes character. Zone 2 sits just under this threshold, making it the most productive place to spend long training hours.</>,
                      },
                      {
                        icon: "💪",
                        title: "Slow-twitch fiber recruitment — the mitochondria-rich fibers",
                        desc: <><GlossaryTerm termKey="slowTwitch">Type I (slow-twitch) muscle fibers</GlossaryTerm> are packed with mitochondria and burn fat efficiently. Zone 2 intensity specifically recruits and stresses these fibers. Go harder (Zone 4+) and fast-twitch fibers take over — producing different adaptations with far less mitochondrial stimulus. Zone 2 is the sweet spot that loads the right fibers without fatiguing them, allowing you to accumulate high aerobic volume each week.</>,
                      },
                      {
                        icon: "🔥",
                        title: "Peak fat oxidation rate",
                        desc: "Fat can only be burned inside mitochondria. At Zone 2, fat oxidation (grams per minute) peaks in absolute terms. Above Zone 2 you shift progressively toward carbohydrate. Training consistently at Zone 2 teaches your body to mobilize and burn fat at higher rates — sparing glycogen, sustaining effort longer, and improving body composition even without caloric restriction.",
                      },
                      {
                        icon: "🧬",
                        title: "PGC-1α: the mitochondrial master switch fires here",
                        desc: <><GlossaryTerm termKey="pgc1alpha">PGC-1α</GlossaryTerm> is the protein that triggers construction of new mitochondria. Sustained aerobic exercise at Zone 2 provides the ideal PGC-1α stimulus: high enough intensity to activate it, long enough duration to drive meaningful expression, and repeatable daily without the recovery cost of hard intervals. This is the molecular mechanism behind everything Zone 2 does.</>,
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 glass rounded-xl p-3.5 border border-white/8">
                        <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-readable-strong mb-0.5">{item.title}</p>
                          <p className="text-xs text-readable-soft leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mitochondria deep dive */}
                <div className="glass rounded-xl p-4 border border-green-500/25 mt-4">
                  <p className="text-xs font-semibold text-green-400 mb-3">
                    What Mitochondria Actually Do — and Why Density Matters<Cite id={12} />
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {[
                      {
                        icon: "⚡",
                        title: "ATP Production",
                        desc: "Mitochondria produce ATP — the universal energy currency of every cell — via oxidative phosphorylation: combining oxygen with fuel to generate energy ~18× more efficiently than anaerobic glycolysis. More mitochondria per muscle cell = more ATP production capacity = higher sustainable power output and less fatigue at any given pace.",
                      },
                      {
                        icon: "🧈",
                        title: "Fat Burning (Beta-Oxidation)",
                        desc: "Fat can only be burned inside mitochondria. Fatty acids enter the mitochondrion and are broken down via beta-oxidation into acetyl-CoA, which fuels the Krebs cycle. A sedentary person burns fat slowly. A trained athlete with high mitochondrial density burns fat at dramatically higher rates — sustaining hours of effort while sparing carbohydrate.",
                      },
                      {
                        icon: "🔄",
                        title: "Lactate Clearance (Lactate Shuttle)",
                        desc: <><GlossaryTerm termKey="lactateShuttle">The lactate shuttle</GlossaryTerm>: lactate produced by working muscles is transported into mitochondria and oxidized as fuel. Trained athletes don&apos;t produce less lactate — their mitochondria clear it faster. This is why training raises your lactate threshold: more mitochondria = more clearance capacity. Zone 2 directly trains this mechanism.<Cite id={12} /></>,
                      },
                      {
                        icon: "🩺",
                        title: "Insulin Sensitivity",
                        desc: "Mitochondria-dense muscle cells have far more GLUT4 glucose transporters — the proteins that pull glucose out of blood. This makes mitochondria-rich muscle the primary driver of whole-body insulin sensitivity. Type 2 diabetes is fundamentally a disease of mitochondrial insufficiency in muscle. Zone 2 is among the most powerful anti-diabetic interventions known.",
                      },
                    ].map((item) => (
                      <div key={item.title} className="glass rounded-xl p-3.5 border border-white/8">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">{item.icon}</span>
                          <p className="text-xs font-semibold text-green-300/80">{item.title}</p>
                        </div>
                        <p className="text-[10px] text-readable-soft leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="glass rounded-xl p-3.5 border border-green-500/20 bg-green-500/5">
                    <p className="text-[10px] font-semibold text-green-400 mb-1.5">The Zone 2 Cascade</p>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px]">
                      {[
                        { text: "Zone 2 training", highlight: true },
                        { text: "→" }, { text: "PGC-1α activation" },
                        { text: "→" }, { text: "Mitochondrial biogenesis" },
                        { text: "→" }, { text: "More mitochondria / cell" },
                        { text: "→" }, { text: "Better fat oxidation" },
                        { text: "→" }, { text: "Higher lactate threshold" },
                        { text: "→" }, { text: "Improved VO2 max" },
                        { text: "→" }, { text: "Better insulin sensitivity" },
                      ].map((item, i) => (
                        <span key={i} className={item.text === "→" ? "text-green-400/35" : item.highlight ? "text-green-300/80 font-semibold" : "text-readable-soft"}>
                          {item.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Zone 2 ↔ VO2 Max connection */}
                <div className="glass rounded-xl p-4 border border-sky-500/20 mt-4">
                  <p className="text-xs font-semibold text-sky-400 mb-2">
                    Zone 2 and VO2 Max — How They Connect<Cite id={13} />
                  </p>
                  <p className="text-xs text-readable-soft leading-relaxed mb-3">
                    VO2 max is limited by two factors: <span className="text-readable-strong font-medium">cardiac output</span> (how much blood your heart pumps per minute) and <span className="text-readable-strong font-medium">peripheral extraction</span> (how efficiently your muscles extract oxygen from that blood). Mitochondrial density is the primary driver of peripheral extraction — and Zone 2 is what builds it.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    <div className="glass rounded-lg p-3 border border-green-500/20">
                      <p className="text-[10px] font-semibold text-green-400 mb-1">Zone 2 → peripheral extraction</p>
                      <p className="text-[10px] text-readable-soft leading-relaxed">More mitochondria per muscle cell → muscles extract more O₂ per liter of blood delivered → raises the ceiling on VO2 max</p>
                    </div>
                    <div className="glass rounded-lg p-3 border border-sky-500/20">
                      <p className="text-[10px] font-semibold text-sky-400 mb-1">HIIT → cardiac output<Cite id={14} /></p>
                      <p className="text-[10px] text-readable-soft leading-relaxed">4×4 intervals force the heart to pump near-maximally, enlarging stroke volume (blood per beat) — directly raising VO2 max</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap size={12} className="text-sky-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-readable-soft leading-relaxed italic">
                      Elite approach: 80% Zone 2 builds the mitochondrial base → 20% HIIT pushes cardiac output to the ceiling. Zone 2 without HIIT plateaus early. HIIT without a Zone 2 base produces rapid gains that stall — and injury follows. You need both, in that ratio.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Lactate: The Misunderstood Molecule ────────────────────────── */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-indigo-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-base">🧪</span>
                  <h2 className="text-base font-semibold text-white">Lactate: The Misunderstood Molecule</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-300/80 border-indigo-500/15">
                    George Brooks · UC Berkeley
                  </span>
                </div>

                <p className="text-sm text-readable-muted leading-relaxed mb-5">
                  For decades, lactate was blamed for the burn, for soreness, for fatigue. All of it was wrong.
                  George Brooks spent 40+ years at UC Berkeley demonstrating that <GlossaryTerm termKey="lactate">lactate</GlossaryTerm> is one of
                  the most important molecules in exercise physiology — a premium fuel, a signaling molecule, and a key
                  driver of the brain benefits of running.<Cite id={15} />
                </p>

                {/* Myth vs Reality */}
                <div className="glass rounded-xl p-4 border border-white/10 mb-5">
                  <p className="text-xs font-semibold text-readable-soft uppercase tracking-wider mb-3">The Old View vs. The Science</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-rose-400/70 uppercase tracking-wide mb-2">Old view (wrong)</p>
                      <ul className="space-y-2">
                        {[
                          "Lactate = 'lactic acid' = metabolic waste",
                          "Lactate causes the burning sensation",
                          "Lactate causes muscle soreness (DOMS)",
                          "High lactate = bad performance",
                          "Must be cleared to recover properly",
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="text-rose-400 text-[10px] shrink-0 mt-0.5">✗</span>
                            <span className="text-[10px] text-readable-faint line-through decoration-rose-400/25 leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wide mb-2">Current science (correct)</p>
                      <ul className="space-y-2">
                        {[
                          "Lactate ≠ lactic acid — chemically distinct",
                          "The burn is from H⁺ ions (acidosis), not lactate",
                          "DOMS is caused by micro-tears, not lactate",
                          "Trained athletes produce MORE lactate, clear it faster",
                          "Lactate is a fuel, signal, and neuroprotective molecule",
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="text-emerald-400 text-[10px] shrink-0 mt-0.5">✓</span>
                            <span className="text-[10px] text-readable-muted leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* What it is */}
                <div className="glass rounded-xl p-4 border border-indigo-500/20 mb-5">
                  <p className="text-xs font-semibold text-indigo-400 mb-2">What Lactate Actually Is</p>
                  <p className="text-xs text-readable-soft leading-relaxed">
                    When glucose is broken down via glycolysis, it produces pyruvate. When mitochondria
                    can&apos;t process all the pyruvate fast enough, it converts to <GlossaryTerm termKey="lactate">lactate</GlossaryTerm> — not as a failure, but as
                    a smart overflow valve. Lactate is produced continuously, even at rest. At low intensities,
                    mitochondria clear it as fast as it&apos;s made. At higher intensities, production exceeds
                    clearance and blood lactate rises. The burn and fatigue you feel? That comes from H⁺ ions (protons)
                    released from ATP hydrolysis — a separate process. Blaming lactate for the burn is like blaming
                    the ambulance for the crash.
                  </p>
                </div>

                {/* 6 Benefits */}
                <p className="text-xs font-semibold text-readable-soft uppercase tracking-wider mb-3">
                  6 Benefits of Lactate During Exercise<Cite id={15} /><Cite id={16} />
                </p>
                <div className="space-y-2 mb-5">
                  {[
                    {
                      icon: "❤️",
                      title: "Premium heart fuel — the heart prefers it over glucose",
                      desc: <span>The heart muscle preferentially oxidizes lactate over glucose during exercise. Cardiac mitochondria pull lactate directly from the bloodstream and burn it as a high-efficiency fuel. At high intensities, the working heart runs substantially on lactate — which is why your aerobic capacity and cardiac function are so tightly linked to lactate metabolism.<Cite id={15} /></span>,
                    },
                    {
                      icon: "🔀",
                      title: "Distributed energy currency — the lactate shuttle",
                      desc: <span>Brooks&apos; lactate shuttle<Cite id={16} /> showed that lactate is an energy carrier between tissues. Fast-twitch muscle fibers produce it; slow-twitch fibers and the heart import it via <GlossaryTerm termKey="MCT">MCT proteins</GlossaryTerm> and burn it. Trained athletes have far more MCT proteins — shuttling lactate more efficiently between producers and consumers. This is a major reason they sustain higher paces before accumulation.</span>,
                    },
                    {
                      icon: "🧠",
                      title: "Brain fuel and BDNF trigger — the cognitive upside of hard running",
                      desc: <span>Lactate crosses the blood-brain barrier and is oxidized by neurons as a fuel — particularly during exercise when glucose delivery may lag behind demand. Beyond fuel, lactate directly mediates exercise-induced improvements in learning and memory via hippocampal signaling.<Cite id={17} /> This is a key mechanism behind the well-documented brain benefits of running — not just endorphins.</span>,
                    },
                    {
                      icon: "🩸",
                      title: "Gluconeogenesis substrate — recycled into glucose (Cori cycle)",
                      desc: <span>The liver takes up circulating lactate and converts it back to glucose via the Cori cycle. This gluconeogenic recycling maintains blood glucose during prolonged exercise, providing a steady fuel supply to the brain and working muscles. Lactate is not wasted — it completes a full metabolic loop.</span>,
                    },
                    {
                      icon: "🫀",
                      title: "Angiogenesis signal — triggers new blood vessel growth",
                      desc: <span>Lactate stimulates VEGF (vascular endothelial growth factor), which drives angiogenesis — the formation of new capillaries inside muscle tissue.<Cite id={15} /> This is partly why endurance training produces dramatically denser muscle vasculature: the lactate produced during hard sessions signals the body to build more delivery infrastructure. More capillaries = better oxygen delivery = higher performance ceiling.</span>,
                    },
                    {
                      icon: "🛡️",
                      title: "Buffer contribution — not the cause of acidosis",
                      desc: <span>The conversion of pyruvate to lactate actually consumes H⁺ ions — partially buffering the very acidosis it is blamed for. The cellular pH crisis during intense exercise comes primarily from ATP hydrolysis, which releases H⁺ independently of lactate. Lactate production is a net pH-neutral or slightly pH-protective reaction. Blaming it for the burn is chemically backwards.</span>,
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 glass rounded-xl p-3.5 border border-white/8">
                      <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-readable-strong mb-0.5">{item.title}</p>
                        <p className="text-xs text-readable-soft leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Training improves lactate handling */}
                <div className="glass rounded-xl p-4 border border-indigo-500/20 bg-indigo-500/5">
                  <p className="text-xs font-semibold text-indigo-400 mb-3">How Zone 2 Training Makes You Better at Lactate</p>
                  <div className="space-y-2">
                    {[
                      { step: "Zone 2 training", detail: "Upregulates MCT1 and MCT4 protein expression in muscle fibers" },
                      { step: "More MCT proteins", detail: "Faster lactate transport between producing and consuming cells" },
                      { step: "More mitochondria (PGC-1α)", detail: "Greater capacity to oxidize lactate as fuel inside each cell" },
                      { step: "Net result", detail: "Higher lactate threshold — you sustain faster paces before accumulation, not because you produce less, but because you clear it faster" },
                    ].map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-[10px] font-bold text-indigo-400/60 bg-indigo-500/10 rounded px-1.5 py-0.5 shrink-0 mt-0.5 font-mono">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <span className="text-xs font-medium text-readable-muted">{s.step}</span>
                          <span className="text-xs text-readable-faint ml-2">{s.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ── VO2 Max ─────────────────────────────────────────────────────── */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-sky-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Zap size={16} className="text-sky-400" />
                  <h2 className="text-base font-semibold text-white">VO2 Max: Your Longevity Metric</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-sky-500/10 text-sky-300/80 border-sky-500/15">
                    #1 Mortality Predictor
                  </span>
                </div>

                <p className="text-sm text-readable-muted leading-relaxed mb-5">
                  <GlossaryTerm termKey="VO2max">VO2 max</GlossaryTerm> — your maximal oxygen consumption — is the single strongest predictor of all-cause mortality.<Cite id={10} />{" "}
                  Low fitness is a more powerful mortality predictor than smoking, hypertension, or diabetes.<Cite id={7} />{" "}
                  Every 1-MET increase in aerobic capacity is associated with{" "}
                  <span className="text-sky-300/80 font-medium">12% lower mortality risk</span>.
                </p>

                {/* VO2 Max reference ranges */}
                <div className="glass rounded-xl p-4 border border-sky-500/20 mb-5">
                  <p className="text-xs font-semibold text-sky-400 mb-3">VO2 Max Reference Ranges (Men, Age 20–39)</p>
                  <div className="space-y-2">
                    {[
                      { label: "Elite Athlete", range: ">60", fill: 100, color: "bg-emerald-500", textColor: "text-emerald-400", note: "Competitive endurance athletes" },
                      { label: "Excellent", range: "55–60", fill: 82, color: "bg-green-500", textColor: "text-green-400", note: "Top 10%" },
                      { label: "Good", range: "47–54", fill: 63, color: "bg-teal-500", textColor: "text-teal-400", note: "Above average" },
                      { label: "Average", range: "42–46", fill: 50, color: "bg-yellow-500", textColor: "text-yellow-400", note: "Typical recreational" },
                      { label: "Below Average", range: "37–41", fill: 37, color: "bg-orange-500", textColor: "text-orange-400", note: "Moderate risk" },
                      { label: "Poor", range: "<37", fill: 20, color: "bg-red-500", textColor: "text-red-400", note: "High mortality risk" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-3">
                        <div className="w-28 shrink-0">
                          <p className={`text-[10px] font-semibold ${row.textColor}`}>{row.label}</p>
                          <p className="text-[9px] text-readable-faint">{row.range} ml/kg/min</p>
                        </div>
                        <div className="flex-1">
                          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                            <motion.div
                              className={`h-full ${row.color} rounded-full opacity-70`}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${row.fill}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.7, delay: 0.05 }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-readable-faint w-28 text-right shrink-0">{row.note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-xl p-4 border border-sky-500/20">
                  <p className="text-xs font-semibold text-sky-400 mb-2">How to Improve VO2 Max (Norwegian 4×4 Protocol)</p>
                  <div className="space-y-1.5">
                    {[
                      { step: "Warm up", detail: "10 min easy jog or cycling" },
                      { step: "4 min at 90–95% max HR", detail: "Near all-out effort — barely sustainable" },
                      { step: "3 min active recovery", detail: "Drop to ~60% HR — walking or easy jog" },
                      { step: "Repeat ×4 rounds", detail: "Total interval time: ~28 min" },
                      { step: "Cool down", detail: "10 min easy. Do 2–3× per week for 8 weeks." },
                    ].map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-[10px] font-bold text-sky-400/60 bg-sky-500/10 rounded px-1.5 py-0.5 shrink-0 font-mono">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <span className="text-xs font-medium text-readable-muted">{s.step}</span>
                          <span className="text-xs text-readable-faint ml-2">{s.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Bone Health: Use It or Lose It ─────────────────────────────── */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-amber-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-base">🦴</span>
                  <h2 className="text-base font-semibold text-white">Bone Health: Use It or Lose It</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-300/80 border-amber-500/15">
                    Wolff&apos;s Law
                  </span>
                </div>

                <p className="text-sm text-readable-muted leading-relaxed mb-5">
                  Bone is living tissue that responds to mechanical stress. <GlossaryTerm termKey="boneRemodeling">Wolff&apos;s Law</GlossaryTerm> states that
                  bone adapts to the loads it bears — growing denser and stronger with repeated stress.
                  This is why <span className="text-amber-300/80 font-medium">running prevents osteoporosis</span>, not causes it.
                  The fear of bone damage from running is the inverse of the truth.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  {/* Tennis player callout */}
                  <div className="glass rounded-xl p-4 border border-amber-500/25">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🎾</span>
                      <p className="text-xs font-semibold text-amber-400">The Tennis Player Arm</p>
                    </div>
                    <p className="text-xs text-readable-soft leading-relaxed mb-3">
                      Tennis players&apos; dominant arm bone is up to{" "}
                      <span className="text-amber-300 font-bold text-sm">40% thicker</span> than their non-dominant arm —
                      both exposed to the same nutrition, hormones, and genetics.
                      The only difference is <em>loading</em>.<Cite id={6} />
                    </p>
                    <div className="flex items-end gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-6 bg-white/20 rounded-sm" style={{ height: "40px" }} />
                        <p className="text-[9px] text-readable-faint mt-1">Non-dom</p>
                        <p className="text-[9px] text-readable-soft">baseline</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-8 bg-amber-400/60 rounded-sm" style={{ height: "56px" }} />
                        <p className="text-[9px] text-amber-400/70 mt-1">Dominant</p>
                        <p className="text-[9px] text-amber-400/60 font-bold">+40%</p>
                      </div>
                    </div>
                  </div>

                  {/* Space vs running comparison */}
                  <div className="glass rounded-xl p-4 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🚀</span>
                      <p className="text-xs font-semibold text-blue-400">Astronauts vs. Runners</p>
                    </div>
                    <p className="text-xs text-readable-soft leading-relaxed">
                      Astronauts in microgravity lose{" "}
                      <span className="text-red-400 font-semibold">1–2% bone density per month</span> — with zero loading on their skeleton.
                      They exercise intensely but without gravity, bone still disappears.
                    </p>
                    <p className="text-xs text-readable-soft leading-relaxed mt-2">
                      Regular runners, conversely, maintain and increase bone density throughout life.
                      Loading is the signal that tells the body: <em>&quot;this bone needs to be strong.&quot;</em>
                    </p>
                  </div>
                </div>

                {/* Kids note */}
                <div className="glass rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-400 mb-1">Critical Window: Children &amp; Adolescents</p>
                      <p className="text-xs text-readable-soft leading-relaxed">
                        Daniel Lieberman emphasizes that{" "}
                        <span className="text-amber-300 font-medium">children need at least 1 hour of vigorous physical activity daily</span>{" "}
                        for proper bone and skeletal development. The bone mass accumulated during childhood and adolescence is the largest predictor of osteoporosis risk in old age.
                        Screen time replacing play is a genuine public health catastrophe — not just for fitness, but for skeletal architecture.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ── The Sitting Problem ─────────────────────────────────────────── */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-red-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <AlertCircle size={16} className="text-red-400" />
                  <h2 className="text-base font-semibold text-white">The Sitting Epidemic: The Real Danger</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-red-500/10 text-red-300/80 border-red-500/15">
                    Mismatch Disease
                  </span>
                </div>

                <p className="text-sm text-readable-muted leading-relaxed mb-5">
                  The fear of running has it completely backwards. The danger isn&apos;t running — it&apos;s sitting.
                  Prolonged sitting is independently associated with all-cause mortality<Cite id={5} /> <em>regardless</em>{" "}
                  of how much you exercise at other times. You cannot exercise your way out of 10 hours of sitting per day.
                </p>

                {/* Hunter-gatherer comparison */}
                <div className="glass rounded-xl p-4 border border-red-500/20 mb-4">
                  <p className="text-xs font-semibold text-red-400 mb-3">Hunter-Gatherer Health vs. Modern Sedentary Health</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        label: "Hunter-Gatherer",
                        icon: "🏃",
                        border: "border-emerald-500/25",
                        titleColor: "text-emerald-400",
                        stats: [
                          "Same blood pressure at 80 as at 20",
                          "No atherosclerosis (plaque buildup)",
                          "No type 2 diabetes",
                          "10–15k steps daily minimum",
                          "Vigorous activity multiple times per week",
                        ],
                        statColor: "text-emerald-400/80",
                      },
                      {
                        label: "Modern Sedentary",
                        icon: "💻",
                        border: "border-red-500/25",
                        titleColor: "text-red-400",
                        stats: [
                          "BP rises steadily with age",
                          "70%+ of adults have plaque by age 70",
                          "88M+ Americans have prediabetes",
                          "~3,500 avg daily steps",
                          "Only 25% meet exercise guidelines",
                        ],
                        statColor: "text-red-400/80",
                      },
                    ].map((side) => (
                      <div key={side.label} className={`glass rounded-xl p-4 border ${side.border}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{side.icon}</span>
                          <p className={`text-xs font-bold ${side.titleColor}`}>{side.label}</p>
                        </div>
                        <ul className="space-y-1.5">
                          {side.stats.map((s) => (
                            <li key={s} className="flex items-start gap-2">
                              <span className={`${side.statColor} text-xs shrink-0 mt-0.5`}>•</span>
                              <span className="text-xs text-readable-soft">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { emoji: "⏱️", title: "Break sitting every 20 min", desc: "Lieberman's specific recommendation. The Hadza sit ~10 hours a day — as much as Westerners — but they break it constantly: tending fires, caring for children, shifting camp. It's not total sitting time that harms you, it's sustained sitting bouts. Set a timer. Even 2 minutes resets the metabolic clock." },
                    { emoji: "🔙", title: "Back pain: the #1 medical complaint worldwide", desc: "Lieberman identifies back pain as the leading medical complaint globally — not because running causes it, but because chairs do. Sitting offloads all demand from back muscles, which lose endurance. Weak, fatigue-prone back muscles — not disc injury — are the strongest predictor of back pain episodes. The fix is back endurance, not comfort." },
                    { emoji: "🚶", title: "The 10-minute post-meal walk", desc: "A 10-minute walk after eating reduces glucose spike by ~30% by activating GLUT4 in leg muscles — one of the most practical blood sugar tools available." },
                    { emoji: "📱", title: "Track daily movement, not just workouts", desc: "Total daily steps matter independent of formal exercise. Hunter-gatherers accumulate 10,000–15,000+ steps on active days. The daily movement floor is as important as peak exercise." },
                  ].map((tip) => (
                    <div key={tip.title} className="flex items-start gap-3 glass rounded-xl p-3.5 border border-white/8">
                      <span className="text-base shrink-0">{tip.emoji}</span>
                      <div>
                        <p className="text-xs font-semibold text-readable-strong mb-0.5">{tip.title}</p>
                        <p className="text-xs text-readable-soft leading-relaxed">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/5 mt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-400 mb-1">Dis-Evolution: Why Mismatch Diseases Keep Rising</p>
                      <p className="text-xs text-readable-soft leading-relaxed">
                        Lieberman coined <span className="text-red-300 font-medium">dis-evolution</span> — when treating the symptoms of mismatch diseases removes the pressure to fix their cause.
                        Pills for hypertension, statins for cholesterol, metformin for diabetes keep people alive without resolving the mismatch.
                        Heart disease kills <span className="text-red-300 font-medium">~1 in 3</span> people in the Western world yet is essentially absent in active hunter-gatherer populations like the Tsimane of the Amazon.
                        The treatment is not the pill. The treatment is movement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Running Form & Injury Prevention ───────────────────────────── */}
          <Section>
            <div className="glass rounded-2xl p-6 border border-violet-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Activity size={16} className="text-violet-400" />
                  <h2 className="text-base font-semibold text-white">Running Form & Injury Prevention</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-300/80 border-violet-500/15">
                    Biomechanics
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-violet-400 mb-3">Key Form Cues</p>
                    <div className="space-y-2">
                      {[
                        { cue: "Cadence: 170–180 steps/min", why: "Higher cadence reduces ground contact time and peak impact forces" },
                        { cue: "Lean forward from the ankles", why: "Not from the hips — forward lean lets gravity assist propulsion" },
                        { cue: "Midfoot strike under hips", why: "Landing ahead of center of mass creates a braking force — avoid overstriding" },
                        { cue: "Relaxed arms at 90°", why: "Front-to-back swing, not crossing the body midline" },
                        { cue: "Soft, quiet footfalls", why: "Loud footstrike = high impact. Aim for quiet — your joints will thank you" },
                      ].map((item) => (
                        <div key={item.cue} className="flex items-start gap-2">
                          <span className="text-violet-400 text-xs shrink-0 mt-0.5">→</span>
                          <div>
                            <span className="text-xs font-medium text-readable-muted">{item.cue}</span>
                            <p className="text-[10px] text-readable-faint leading-relaxed">{item.why}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-violet-400 mb-3">Common Injuries & Prevention</p>
                    <div className="space-y-2">
                      {[
                        { injury: "Runner's Knee (PFPS)", fix: "Hip strengthening (glutes, abductors); reduce weekly mileage by 20%" },
                        { injury: "IT Band Syndrome", fix: "Hip abductor & TFL strength; foam rolling; avoid cambered roads" },
                        { injury: "Shin Splints", fix: "≤10% mileage increase per week; transition shoe changes gradually" },
                        { injury: "Plantar Fasciitis", fix: "Calf flexibility; foot intrinsic strength; morning towel stretches" },
                        { injury: "Stress Fractures", fix: "Nutritional adequacy (calcium, D3, protein); never jump mileage suddenly" },
                      ].map((item) => (
                        <div key={item.injury} className="glass rounded-lg p-3 border border-violet-500/15">
                          <p className="text-[10px] font-semibold text-violet-300/80 mb-0.5">{item.injury}</p>
                          <p className="text-[10px] text-readable-soft leading-relaxed">{item.fix}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4 border border-violet-500/20 bg-violet-500/5">
                  <p className="text-xs font-semibold text-violet-400 mb-1">The 10% Rule</p>
                  <p className="text-xs text-readable-soft leading-relaxed">
                    Most running injuries are not caused by running itself — they&apos;re caused by
                    <span className="text-violet-300 font-medium"> doing too much too soon</span>.
                    Never increase total weekly mileage by more than 10% per week.
                    Add one hard workout per week maximum. The slowest path to injury is the fastest path to fitness.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Sources ─────────────────────────────────────────────────────── */}
          <Section>
            <div id="sources" className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen size={16} className="text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Sources & Further Reading</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {studies.map((study) => (
                  <a
                    key={study.url}
                    href={study.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass rounded-xl p-4 border border-white/8 hover:border-emerald-500/25 transition-all duration-200 group block"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-[10px] font-bold text-emerald-400/60 bg-emerald-500/10 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                        [{study.id}]
                      </span>
                      <div className="flex-1 flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-readable-strong leading-snug group-hover:text-white/90 transition-colors">
                          {study.title}
                        </p>
                        <ExternalLink size={11} className="text-white/20 group-hover:text-emerald-400 transition-colors shrink-0 mt-0.5" />
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-400/60 mb-1.5 pl-8">
                      {study.journal} · {study.year}
                    </p>
                    <p className="text-[10px] text-readable-soft leading-relaxed pl-8">{study.summary}</p>
                  </a>
                ))}
              </div>

              <div className="border-t border-white/8 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={13} className="text-readable-soft" />
                  <p className="text-xs font-semibold text-readable-soft">Expert Contributors</p>
                </div>
                <div className="space-y-2">
                  {contributors.map((c) => (
                    <div key={c.name} className="glass rounded-xl p-3.5 border border-white/8 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-emerald-400/70">{c.initials}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-readable-strong">{c.name}</p>
                        <p className="text-[10px] text-emerald-400/60">{c.credentials} · {c.affiliation}</p>
                        <p className="text-[10px] text-readable-faint mt-0.5">{c.focus}</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-readable-faint italic pl-1">Additional experts and sources will be cited as content expands.</p>
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
                    <p className="text-[10px] font-semibold text-emerald-400/70 tracking-widest uppercase mb-1">Glossary</p>
                    <h3 className="text-xl font-bold text-white leading-snug">
                      {activeGlossaryEntry.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveGlossary(null)}
                    className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 transition-colors flex items-center justify-center shrink-0 mt-1"
                  >
                    <X size={14} className="text-readable-muted" />
                  </button>
                </div>
                <p className="text-sm text-readable-muted leading-relaxed mb-4">
                  {activeGlossaryEntry.body}
                </p>
                {activeGlossaryEntry.learnMore && (
                  <a
                    href={activeGlossaryEntry.learnMore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400/80 hover:text-emerald-300 transition-colors"
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
