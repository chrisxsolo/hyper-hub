"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Dumbbell,
  Brain,
  Flame,
  ShieldCheck,
  Apple,
  Sparkles,
  Users,
  ChevronRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? "show" : "hidden"} variants={fadeUp} className={className}>
      {children}
    </motion.section>
  );
}

function Cite({ id }: { id: number }) {
  return (
    <a
      href="#sources"
      className="text-[9px] text-teal-400/60 hover:text-teal-300 transition-colors align-super leading-none ml-0.5"
    >
      [{id}]
    </a>
  );
}

const quickStats = [
  {
    value: "+90%",
    label: "Insulin AUC after whey vs bread",
    note: "With lower glucose exposure in the same trial",
    color: "text-teal-400",
    gradient: "from-teal-500/10",
  },
  {
    value: "-28%",
    label: "Post-meal glucose with whey preload",
    note: "In adults with type 2 diabetes",
    color: "text-sky-400",
    gradient: "from-sky-500/10",
  },
  {
    value: "+0.9 kg",
    label: "Weight change in 2 weeks on UPF diet",
    note: "Despite matched presented macros",
    color: "text-orange-400",
    gradient: "from-orange-500/10",
  },
  {
    value: "+12%",
    label: "CVD risk per +10% UPF in diet",
    note: "Prospective cohort signal",
    color: "text-rose-400",
    gradient: "from-rose-500/10",
  },
];

const proteinComparisons = [
  {
    label: "Whey vs bread",
    bars: [
      { label: "Glucose AUC", value: 43, tone: "bg-sky-400", meta: "-57%" },
      { label: "Insulin AUC", value: 90, tone: "bg-teal-400", meta: "+90%" },
      { label: "GIP", value: 54, tone: "bg-emerald-400", meta: "+54%" },
    ],
    footnote: "Healthy subjects: whey generated a bigger insulin and incretin response while producing much less postprandial glucose than bread.",
    cite: 1,
  },
  {
    label: "50 g whey preload",
    bars: [
      { label: "Glucose", value: 72, tone: "bg-sky-400", meta: "-28%" },
      { label: "Insulin", value: 100, tone: "bg-teal-400", meta: "+105%" },
      { label: "GLP-1", value: 100, tone: "bg-emerald-400", meta: "+141%" },
    ],
    footnote: "In type 2 diabetes, whey before a high-GI breakfast increased insulin and GLP-1 but lowered total postprandial glucose.",
    cite: 2,
  },
  {
    label: "15 g whey before meals",
    bars: [
      { label: "Breakfast glycemia", value: 87, tone: "bg-sky-400", meta: "-13%" },
      { label: "Satiety", value: 76, tone: "bg-violet-400", meta: "higher" },
      { label: "Insulin", value: 68, tone: "bg-teal-400", meta: "up" },
    ],
    footnote: "Even a small whey dose improved postprandial glycemia and satiety in men with type 2 diabetes.",
    cite: 3,
  },
];

const anabolicSignals: Array<{
  icon: string;
  title: string;
  body: React.ReactNode;
  border: string;
  glow: string;
}> = [
  {
    icon: "🧬",
    title: "Amino acids and incretins both matter",
    body: (
      <>
        Leucine, lysine, valine, and isoleucine tracked strongly with the insulin response in the milk-protein trial,
        while GIP rose alongside insulin. Protein-induced insulin is not just a carb story with different branding.
        <Cite id={1} />
      </>
    ),
    border: "border-teal-500/20",
    glow: "from-teal-500/8",
  },
  {
    icon: "🏗️",
    title: "Insulin helps turn amino acids into tissue",
    body: (
      <>
        In human skeletal muscle, physiologic hyperinsulinemia increased muscle protein synthesis and increased inward
        transport of leucine and lysine. This is why a protein-driven insulin pulse is useful when recovery is the
        job.
        <Cite id={5} />
      </>
    ),
    border: "border-sky-500/20",
    glow: "from-sky-500/8",
  },
  {
    icon: "📈",
    title: "Whey plus leucine lights up the growth pathway",
    body: (
      <>
        A randomized crossover trial in healthy young men found whey protein increased mixed muscle protein synthesis
        by about 43% and raised S6K1, a marker of mTORC1 activation, by about 20%.
        <Cite id={4} />
      </>
    ),
    border: "border-emerald-500/20",
    glow: "from-emerald-500/8",
  },
  {
    icon: "🛡️",
    title: "Insulin also protects by suppressing breakdown",
    body: (
      <>
        Insulin&apos;s anticatabolic effect matters too. Human infusion data show insulin lowers whole-body proteolysis
        even when amino acids are already available, which helps tilt net balance toward retention instead of loss.
        <Cite id={6} />
      </>
    ),
    border: "border-violet-500/20",
    glow: "from-violet-500/8",
  },
];

const proteinSourceCurves = [
  {
    source: "Whey",
    speed: 100,
    color: "bg-teal-400",
    note: "Fastest amino acid rise",
  },
  {
    source: "Whey + casein blend",
    speed: 92,
    color: "bg-sky-400",
    note: "Near-whey peak, smoother tail",
  },
  {
    source: "Casein",
    speed: 58,
    color: "bg-violet-400",
    note: "Slower release, flatter curve",
  },
];

const thermicEffect = [
  { label: "Whey meal", value: 14.4, color: "bg-teal-400" },
  { label: "Casein meal", value: 12.0, color: "bg-sky-400" },
  { label: "Soy meal", value: 11.6, color: "bg-emerald-400" },
  { label: "High-carb meal", value: 6.6, color: "bg-white/35" },
];

const upfSignals = [
  {
    metric: "Energy intake",
    value: "+508 kcal/day",
    body: "In Hall's inpatient crossover trial, people ate about 508 more kcal per day on the ultra-processed diet even though meals were matched for presented calories, macronutrients, sugar, sodium, and fiber.",
    cite: 8,
    border: "border-orange-500/20",
    color: "text-orange-400",
  },
  {
    metric: "Body weight",
    value: "+0.9 kg in 2 weeks",
    body: "Participants gained 0.9 kg during the ultra-processed phase and lost 0.9 kg during the unprocessed phase. The food environment changed behavior faster than motivation ever could.",
    cite: 8,
    border: "border-rose-500/20",
    color: "text-rose-400",
  },
  {
    metric: "Cardiovascular disease",
    value: "+12% per +10% UPF",
    body: "In the NutriNet-Sante cohort, each absolute 10-point increase in the percentage of ultra-processed foods in the diet was associated with a 12% higher overall cardiovascular disease rate.",
    cite: 9,
    border: "border-red-500/20",
    color: "text-red-400",
  },
  {
    metric: "Type 2 diabetes",
    value: "HR 1.53 highest vs lowest",
    body: "In the SUN cohort, the highest UPF consumers had a significantly higher type 2 diabetes risk than the lowest consumers, even in a relatively healthy Mediterranean sample.",
    cite: 10,
    border: "border-amber-500/20",
    color: "text-amber-400",
  },
];

const mealArchitecture = [
  {
    title: "Protein first, especially when recovery matters",
    body: "A whey dose before or alongside a meal can improve glycemia and satiety while still giving you the anabolic insulin pulse that helps recovery. For a lean, active cut, that is a feature, not a bug.",
    cite: 2,
    accent: "text-teal-400",
  },
  {
    title: "Carbs later in the meal beats carbs first",
    body: "When rice was eaten after meat or vegetables instead of first, glucose and insulin excursions were lower and the 120-minute AUCs were smallest in the carb-last condition.",
    cite: 11,
    accent: "text-sky-400",
  },
  {
    title: "Breakfast can set the glucose tone for the day",
    body: "In a randomized one-day trial in type 2 diabetes, a no-carbohydrate breakfast lowered the day's peak glucose from 12.1 to 11.0 mmol/L and sharply reduced the breakfast spike itself. Useful as a tool, not a universal law.",
    cite: 12,
    accent: "text-violet-400",
  },
  {
    title: "Processed food is a frequency problem more than a morality problem",
    body: "Inference from the RCT and cohort data: the issue is not one social meal. The issue is letting hyper-palatable, low-friction food become the default architecture that displaces protein, fiber, and minimally processed meals.",
    accent: "text-orange-400",
  },
];

const insulinSmartFoodGroups: Array<{
  title: string;
  accent: string;
  border: string;
  foods: string[];
  body: React.ReactNode;
}> = [
  {
    title: "Protein-dominant staples",
    accent: "text-teal-400",
    border: "border-teal-500/20",
    foods: ["Eggs", "Greek yogurt or skyr", "Chicken thighs or breast", "Salmon, tuna, sardines", "Lean beef", "Tofu or tempeh"],
    body: (
      <>
        These foods are useful because they are <span className="text-white font-medium">amino-acid dense</span>. They can raise insulin,
        but usually in the service of nutrient handling, muscle retention, and satiety rather than a large glucose surge. Protein also
        has a higher thermic effect than a carbohydrate-heavy meal and helps preserve lean mass while dieting.<Cite id={4} /><Cite id={5} /><Cite id={6} /><Cite id={7} /><Cite id={13} />
      </>
    ),
  },
  {
    title: "Fiber-rich whole-food volume",
    accent: "text-sky-400",
    border: "border-sky-500/20",
    foods: ["Broccoli", "Cauliflower", "Zucchini", "Mushrooms", "Cucumbers", "Leafy greens", "Green beans", "Peppers"],
    body: (
      <>
        These foods do not bring much glucose load, but they do bring <span className="text-white font-medium">volume, fiber, water, and friction</span>.
        That matters because meals built around vegetables are slower to eat, more filling, and work well with the carb-last pattern that lowers
        glucose and insulin excursions.<Cite id={11} />
      </>
    ),
  },
  {
    title: "Supportive fats and add-ons",
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
    foods: ["Avocado", "Extra-virgin olive oil", "Olives", "Tahini", "Feta or goat cheese", "Nuts in sensible portions"],
    body: (
      <>
        These make food enjoyable without turning the plate into a sugar delivery system. They improve flavor, make meals feel substantial,
        and pair well with protein and vegetables so the diet is easier to stick to. That adherence piece matters because minimally processed,
        satisfying meals are much harder to overeat than ultra-processed ones.<Cite id={8} /><Cite id={9} /><Cite id={10} />
      </>
    ),
  },
];

const insulinSmartSauces = [
  {
    name: "Greek yogurt herb sauce",
    pairWith: "Chicken, salmon, roasted vegetables",
    why: "High-protein base, creamy texture, easy way to add flavor without a sweet glaze. Think yogurt + lemon + dill + garlic + salt.",
  },
  {
    name: "Chimichurri",
    pairWith: "Steak, chicken thighs, shrimp, zucchini",
    why: "Herbs, olive oil, vinegar, garlic, and chili give a huge flavor return with almost no sugar load.",
  },
  {
    name: "Tahini lemon sauce",
    pairWith: "Bowls, roasted cauliflower, salmon, tofu",
    why: "Savory and rich, but still built from sesame, acid, and salt rather than syrup. Great for making vegetables feel less like homework.",
  },
  {
    name: "Pesto",
    pairWith: "Eggs, chicken, turkey burgers, green beans",
    why: "Fat- and herb-based sauce that adds intensity fast. A little goes a long way and it works well on simple protein plates.",
  },
  {
    name: "Mustard vinaigrette",
    pairWith: "Salads, salmon, potatoes eaten after protein, burger bowls",
    why: "Mustard, olive oil, vinegar, and pepper keep things sharp and interesting without the sugary profile of many bottled dressings.",
  },
  {
    name: "Salsa, salsa verde, or pico",
    pairWith: "Egg scrambles, taco bowls, grilled meat, cottage cheese",
    why: "Bright, acidic, low-friction flavor. Usually far lighter than BBQ, teriyaki, honey mustard, or sweet chili sauces.",
  },
];

const insulinSmartMeals = [
  "Egg scramble with spinach, feta, avocado, and salsa.",
  "Salmon with roasted broccoli and a yogurt-dill or tahini-lemon sauce.",
  "Burger bowl with lettuce, pickles, onions, tomato, mustard sauce, and roasted vegetables.",
  "Chicken thighs with cauliflower, cucumber salad, olives, and chimichurri.",
];

const studies = [
  {
    id: 1,
    title: "Glycemia and insulinemia in healthy subjects after lactose-equivalent meals of milk and other food proteins: the role of plasma amino acids and incretins",
    journal: "American Journal of Clinical Nutrition",
    year: 2004,
    url: "https://pubmed.ncbi.nlm.nih.gov/15531672/",
    summary: "Whey produced a 90% higher insulin AUC and 54% higher GIP AUC than bread while lowering postprandial glucose AUC by 57%.",
  },
  {
    id: 2,
    title: "Incretin, insulinotropic and glucose-lowering effects of whey protein pre-load in type 2 diabetes: a randomised clinical trial",
    journal: "Diabetologia",
    year: 2014,
    url: "https://pubmed.ncbi.nlm.nih.gov/25005331/",
    summary: "A 50 g whey preload before a high-GI breakfast reduced postprandial glucose by 28% while increasing insulin and GLP-1 responses.",
  },
  {
    id: 3,
    title: "A small dose of whey protein co-ingested with mixed-macronutrient breakfast and lunch meals improves postprandial glycemia and suppresses appetite in men with type 2 diabetes",
    journal: "American Journal of Clinical Nutrition",
    year: 2018,
    url: "https://pubmed.ncbi.nlm.nih.gov/29635505/",
    summary: "Fifteen grams of intact whey lowered breakfast glycemia by 13%, improved lunch glycemia, and increased satiety.",
  },
  {
    id: 4,
    title: "Whey Protein Hydrolysate Increases Amino Acid Uptake, mTORC1 Signaling, and Protein Synthesis in Skeletal Muscle of Healthy Young Men in a Randomized Crossover Trial",
    journal: "Journal of Nutrition",
    year: 2019,
    url: "https://pubmed.ncbi.nlm.nih.gov/31095313/",
    summary: "A small whey dose increased leucine delivery to muscle, raised S6K1 around 20%, and increased mixed muscle protein synthesis about 43%.",
  },
  {
    id: 5,
    title: "Physiologic hyperinsulinemia stimulates protein synthesis and enhances transport of selected amino acids in human skeletal muscle",
    journal: "Journal of Clinical Investigation",
    year: 1995,
    url: "https://pubmed.ncbi.nlm.nih.gov/7860765/",
    summary: "Human muscle infusion data showed insulin increased protein synthesis and boosted inward transport of leucine and lysine.",
  },
  {
    id: 6,
    title: "Insulin does not stimulate muscle protein synthesis during increased plasma branched-chain amino acids alone but still decreases whole body proteolysis in humans",
    journal: "American Journal of Physiology-Endocrinology and Metabolism",
    year: 2016,
    url: "https://pubmed.ncbi.nlm.nih.gov/27530230/",
    summary: "Insulin clearly reduced proteolysis even when branched-chain amino acids were already elevated.",
  },
  {
    id: 7,
    title: "Protein choices targeting thermogenesis and metabolism",
    journal: "American Journal of Clinical Nutrition",
    year: 2011,
    url: "https://pubmed.ncbi.nlm.nih.gov/21228266/",
    summary: "Thermic effect was greater after whey (14.4%) than casein (12.0%), soy (11.6%), or the high-carbohydrate meal (6.6%).",
  },
  {
    id: 8,
    title: "Ultra-Processed Diets Cause Excess Calorie Intake and Weight Gain: An Inpatient Randomized Controlled Trial of Ad Libitum Food Intake",
    journal: "Cell Metabolism",
    year: 2019,
    url: "https://pubmed.ncbi.nlm.nih.gov/31105044/",
    summary: "Ultra-processed eating led to about 508 extra kcal/day and 0.9 kg weight gain in 2 weeks; the unprocessed phase reversed it.",
  },
  {
    id: 9,
    title: "Ultra-processed food intake and risk of cardiovascular disease: prospective cohort study",
    journal: "BMJ",
    year: 2019,
    url: "https://www.bmj.com/content/365/bmj.l1451",
    summary: "Each absolute 10-point increase in ultra-processed food share was associated with a 12% higher overall cardiovascular disease rate.",
  },
  {
    id: 10,
    title: "Ultra-processed foods and type-2 diabetes risk in the SUN project: A prospective cohort study",
    journal: "Clinical Nutrition",
    year: 2021,
    url: "https://pubmed.ncbi.nlm.nih.gov/33933748/",
    summary: "Highest versus lowest ultra-processed food intake was associated with a higher type 2 diabetes risk (HR 1.53).",
  },
  {
    id: 11,
    title: "Consuming Carbohydrates after Meat or Vegetables Lowers Postprandial Excursions of Glucose and Insulin in Nondiabetic Subjects",
    journal: "Journal of Nutritional Science and Vitaminology",
    year: 2018,
    url: "https://pubmed.ncbi.nlm.nih.gov/30381620/",
    summary: "When rice was eaten last rather than first, both glucose and insulin AUCs were lowest.",
  },
  {
    id: 12,
    title: "Effect of carbohydrate restriction in the first meal after an overnight fast on glycemic control in people with type 2 diabetes: a randomized trial",
    journal: "American Journal of Clinical Nutrition",
    year: 2016,
    url: "https://pubmed.ncbi.nlm.nih.gov/27733405/",
    summary: "A no-carbohydrate breakfast lowered peak daily glucose and substantially blunted the breakfast excursion.",
  },
  {
    id: 13,
    title: "Effect of the intake of dietary protein on insulin resistance in subjects with obesity: a randomized controlled clinical trial",
    journal: "European Journal of Nutrition",
    year: 2021,
    url: "https://pubmed.ncbi.nlm.nih.gov/33145643/",
    summary: "High-protein hypocaloric diets improved insulin sensitivity by 60-90% over one month in adults with obesity and insulin resistance.",
  },
];

const contributors = [
  {
    initials: "SM",
    name: "Stuart Phillips, PhD",
    focus: "Protein dose, leucine, and muscle protein synthesis",
  },
  {
    initials: "KD",
    name: "Kevin Hall, PhD",
    focus: "Ultra-processed foods, energy intake, and body-weight regulation",
  },
  {
    initials: "BL",
    name: "David Ludwig, MD, PhD",
    focus: "Insulin biology, diet quality, and metabolic disease framing",
  },
];

export default function DietClient() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link
          href="/health"
          className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Back to Health
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-10">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 border border-teal-500/15 mb-5">
          <Sparkles size={12} className="text-teal-300" />
          <span className="text-xs font-medium tracking-wide text-readable-strong">Diet, but with metabolic context</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl glass border border-teal-500/20 flex items-center justify-center">
                <Apple size={20} className="text-teal-300" />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">Diet & Metabolic Health</h1>
                <p className="text-sm text-readable-muted mt-1">Protein, food quality, glucose control, and what actually matters long term.</p>
              </div>
            </div>

            <p className="text-base sm:text-lg text-readable-strong leading-relaxed max-w-3xl mb-4">
              The useful way to think about diet is not <span className="text-white font-medium">"never spike insulin"</span>. It is:
              what kind of insulin signal are you generating, in what context, with what downstream effect?
            </p>
            <p className="text-sm text-readable-muted leading-relaxed max-w-3xl">
              Protein-driven insulin can be anabolic, satiating, and glucose-lowering. Chronic ultra-processed eating is different:
              it makes calories easier to overeat, crowds out fiber and whole foods, and over years tracks with worse cardiometabolic outcomes.
              Same word, different physiology.<Cite id={1} /><Cite id={2} /><Cite id={8} /><Cite id={9} />
            </p>
          </div>

          <div className="glass rounded-[28px] border border-teal-500/20 p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/8 via-sky-500/6 to-transparent pointer-events-none" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-readable-soft mb-4">Signal map</p>
              <div className="space-y-3">
                {[
                  {
                    title: "Post-run whey isolate",
                    tone: "text-teal-300",
                    notes: ["Fast amino acid rise", "Useful insulin pulse", "Recovery signal"],
                  },
                  {
                    title: "Whole-food protein meal",
                    tone: "text-sky-300",
                    notes: ["Slower digestion", "Higher satiety", "Steadier glucose"],
                  },
                  {
                    title: "Ultra-processed grazing",
                    tone: "text-orange-300",
                    notes: ["Easy overeating", "Low friction calories", "Worse default architecture"],
                  },
                ].map((item, index) => (
                  <div key={item.title} className="glass rounded-2xl p-4 border border-white/8">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className={`text-sm font-semibold ${item.tone}`}>{item.title}</p>
                      <span className="text-[10px] text-readable-faint">0{index + 1}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.notes.map((note) => (
                        <span key={note} className="text-[10px] px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-readable-soft">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {quickStats.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-4 border border-white/8 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} to-transparent pointer-events-none`} />
            <div className="relative">
              <p className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
              <p className="text-xs font-medium text-readable-strong leading-tight">{stat.label}</p>
              <p className="text-[10px] text-readable-faint leading-relaxed mt-1">{stat.note}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="space-y-8">
        <Section>
          <div className="glass rounded-2xl p-6 border border-teal-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/7 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Flame size={16} className="text-teal-400" />
                <h2 className="text-base font-semibold text-white">Protein Can Raise Insulin and Still Be a Good Outcome</h2>
              </div>
              <p className="text-sm text-readable-muted leading-relaxed mb-5 max-w-3xl">
                Protein-induced insulin is real. The mistake is assuming that means it behaves like a refined-carb spike. In the whey and milk-protein studies,
                insulin went up because amino acids and incretins went up, while glucose exposure went down.<Cite id={1} /><Cite id={2} />
                In other words: the body was not panicking over excess glucose. It was coordinating nutrient handling.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
                {proteinComparisons.map((card) => (
                  <div key={card.label} className="glass rounded-xl p-4 border border-white/8">
                    <p className="text-xs font-semibold text-readable-strong mb-3">{card.label}</p>
                    <div className="space-y-3">
                      {card.bars.map((bar) => (
                        <div key={bar.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-readable-soft">{bar.label}</span>
                            <span className="text-[10px] font-semibold text-readable-strong">{bar.meta}</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
                            <motion.div
                              className={`h-full ${bar.tone} rounded-full`}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${bar.value}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-readable-faint leading-relaxed mt-3">{card.footnote}<Cite id={card.cite} /></p>
                  </div>
                ))}
              </div>

              <div className="glass rounded-xl p-4 border border-teal-500/20">
                <p className="text-xs text-readable-soft leading-relaxed">
                  <span className="text-teal-300 font-semibold">Interpretation:</span> when whey is used around training or before a mixed meal,
                  the insulin pulse is paired with amino acid delivery, incretin signaling, and better satiety. That is a different metabolic scene than
                  repeatedly eating hyper-palatable refined foods that raise intake without helping recovery.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section>
          <div className="glass rounded-2xl p-6 border border-sky-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/7 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell size={16} className="text-sky-400" />
                <h2 className="text-base font-semibold text-white">Why Protein-Induced Insulin Is Anabolic, Not Metabolic Chaos</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
                {anabolicSignals.map((card) => (
                  <div key={card.title} className={`glass rounded-xl p-4 border ${card.border} relative overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.glow} to-transparent pointer-events-none`} />
                    <div className="relative">
                      <p className="text-lg mb-2">{card.icon}</p>
                      <p className="text-xs font-semibold text-white mb-2">{card.title}</p>
                      <p className="text-xs text-readable-soft leading-relaxed">{card.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-4">
                <div className="glass rounded-xl p-4 border border-sky-500/15">
                  <p className="text-xs font-semibold text-sky-400 mb-3">Protein speed curve</p>
                  <div className="space-y-3">
                    {proteinSourceCurves.map((item) => (
                      <div key={item.source}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-readable-muted">{item.source}</span>
                          <span className="text-[10px] text-readable-faint">{item.note}</span>
                        </div>
                        <div className="h-3 rounded-full bg-white/8 overflow-hidden">
                          <motion.div
                            className={`h-full ${item.color} rounded-full`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.speed}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-readable-faint leading-relaxed mt-3">
                    Directional infographic based on postprandial aminoacidemia work: whey and whey-blend produce higher essential amino acid peaks than casein.<Cite id={4} />
                  </p>
                </div>

                <div className="glass rounded-xl p-4 border border-sky-500/15">
                  <p className="text-xs font-semibold text-sky-400 mb-3">Diet-induced thermogenesis</p>
                  <div className="space-y-3">
                    {thermicEffect.map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-readable-muted">{item.label}</span>
                          <span className="text-[10px] font-semibold text-readable-strong">{item.value}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
                          <motion.div
                            className={`h-full ${item.color} rounded-full`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(item.value / 16) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-readable-faint leading-relaxed mt-3">
                    Higher-protein meals produced markedly larger thermic effects than the carbohydrate-heavy comparator in the crossover trial.<Cite id={7} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section>
          <div className="glass rounded-2xl p-6 border border-orange-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-orange-400" />
                <h2 className="text-base font-semibold text-white">Food Quality Still Matters Even If Calories Decide Weight Change</h2>
              </div>
              <p className="text-sm text-readable-muted leading-relaxed mb-5 max-w-3xl">
                Thermodynamics still runs the room for body composition. But food quality changes how easy those calories are to overeat,
                what they displace, and what long-range cardiometabolic pattern they build. The strongest modern signal is ultra-processed food:
                it is not just "food with macros," it is often food engineered for speed, softness, and repeatability.<Cite id={8} /><Cite id={9} /><Cite id={10} />
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {upfSignals.map((item) => (
                  <div key={item.metric} className={`glass rounded-xl p-4 border ${item.border}`}>
                    <p className={`text-xs font-semibold ${item.color} mb-1`}>{item.metric}</p>
                    <p className="text-lg font-bold text-white mb-2">{item.value}</p>
                    <p className="text-xs text-readable-soft leading-relaxed">{item.body}<Cite id={item.cite} /></p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
                <div className="glass rounded-xl p-4 border border-orange-500/15">
                  <p className="text-xs font-semibold text-orange-400 mb-2">What the RCT tells you</p>
                  <p className="text-xs text-readable-soft leading-relaxed">
                    If ultra-processed food becomes your default, you usually do not lose because the insulin molecule itself is evil.
                    You lose because the food makes it too easy to eat faster, overshoot intake, and under-eat protein and fiber.
                  </p>
                </div>
                <div className="glass rounded-xl p-4 border border-orange-500/15">
                  <p className="text-xs font-semibold text-orange-400 mb-2">What the cohorts add</p>
                  <p className="text-xs text-readable-soft leading-relaxed">
                    Over years, higher ultra-processed exposure tracks with worse cardiovascular and diabetes outcomes. That does not mean one pizza night causes disease.
                    It means the chassis of the diet matters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section>
          <div className="glass rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/7 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Meal Architecture Beats Food Anxiety</h2>
              </div>
              <p className="text-sm text-readable-muted leading-relaxed mb-5 max-w-3xl">
                The practical win is not perfection. It is building a default plate that makes the good choice frictionless:
                anchor protein, place fiber and minimally processed food around it, and stop treating every insulin rise like a metabolic emergency.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                {mealArchitecture.map((item) => (
                  <div key={item.title} className="glass rounded-xl p-4 border border-white/8">
                    <p className={`text-xs font-semibold ${item.accent} mb-2`}>{item.title}</p>
                    <p className="text-xs text-readable-soft leading-relaxed">
                      {item.body}
                      {item.cite ? <Cite id={item.cite} /> : null}
                    </p>
                  </div>
                ))}
              </div>

              <div className="glass rounded-xl p-4 border border-emerald-500/15">
                <p className="text-xs font-semibold text-emerald-400 mb-2">A workable rule for real life</p>
                <p className="text-xs text-readable-soft leading-relaxed">
                  Use minimally processed, protein-forward meals as your base. Let discretionary foods be passengers, not the chassis.
                  That framing is partly evidence-based and partly strategic inference from the trials above, but it is far more durable than trying to white-knuckle every social meal.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section>
          <div className="glass rounded-2xl p-6 border border-teal-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/7 via-emerald-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Apple size={16} className="text-teal-400" />
                <h2 className="text-base font-semibold text-white">Insulin-Smart Foods That Still Make Dieting Fun</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-teal-500/10 text-teal-300/80 border-teal-500/15">
                  Practical Foods
                </span>
              </div>

              <p className="text-sm text-readable-muted leading-relaxed mb-5 max-w-4xl">
                The practical goal is not <span className="text-white font-medium">zero insulin</span>. It is building meals that do not hammer glucose,
                do not make you ravenous an hour later, and do not turn the diet into a joyless punishment phase. In practice, that usually means
                <span className="text-white font-medium"> protein-forward whole foods, vegetables for volume, and sauces built from herbs, acid, fat, and salt instead of sugar.</span>
              </p>
              <p className="text-xs text-readable-faint leading-relaxed mb-5 max-w-4xl">
                Important nuance: some of the best foods on this list still create a <span className="text-readable-strong">useful insulin response</span>,
                especially protein foods. The benefit is that they usually come with lower glucose exposure, better satiety, better recovery support,
                and much less of the “eat more, faster” behavior common with ultra-processed food.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
                {insulinSmartFoodGroups.map((group) => (
                  <div key={group.title} className={`glass rounded-xl p-4 border ${group.border}`}>
                    <p className={`text-xs font-semibold ${group.accent} mb-3`}>{group.title}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {group.foods.map((food) => (
                        <span key={food} className="text-[10px] px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-readable-soft">
                          {food}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-readable-soft leading-relaxed">{group.body}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.02fr_0.98fr] gap-4 mb-5">
                <div className="glass rounded-xl p-4 border border-teal-500/15">
                  <p className="text-xs font-semibold text-teal-400 mb-3">Sauces that work better than sugary glazes</p>
                  <div className="space-y-3">
                    {insulinSmartSauces.map((sauce) => (
                      <div key={sauce.name} className="glass rounded-xl p-3 border border-white/8">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <p className="text-xs font-semibold text-readable-strong">{sauce.name}</p>
                          <span className="text-[10px] text-readable-faint shrink-0">{sauce.pairWith}</span>
                        </div>
                        <p className="text-xs text-readable-soft leading-relaxed">{sauce.why}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-readable-faint leading-relaxed mt-3">
                    This part is practical inference, not a special “sauce literature” section: flavor helps adherence, and acid-herb-fat sauces usually
                    support a protein-and-veg meal better than sticky sweet sauces built around sugar.
                  </p>
                </div>

                <div className="glass rounded-xl p-4 border border-emerald-500/15">
                  <p className="text-xs font-semibold text-emerald-400 mb-3">What this means mechanically</p>
                  <div className="space-y-3 mb-4">
                    {[
                      "Protein dominance usually means more satiety, more lean-mass protection, and a higher thermic effect.",
                      "Fiber-rich vegetables add chewing, volume, and slower meal speed without much glucose burden.",
                      "Minimally processed meals are harder to overeat than hyper-palatable packaged foods.",
                      "If you include carbs, placing them after protein and vegetables is usually a better metabolic trade than starting with them.",
                    ].map((point) => (
                      <div key={point} className="flex items-start gap-2 text-xs text-readable-soft">
                        <ChevronRight size={11} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-readable-soft leading-relaxed">
                    The honest framing: these foods do not create magical immunity to fat gain. A sustained calorie surplus can still store fat. What they
                    usually do is make you <span className="text-white font-medium">less likely to overshoot intake</span>, while giving you a better glucose profile,
                    better training support, and a diet pattern that promotes overall cardiometabolic health instead of fighting it.<Cite id={7} /><Cite id={8} /><Cite id={9} /><Cite id={10} /><Cite id={13} />
                  </p>
                </div>
              </div>

              <div className="glass rounded-xl p-4 border border-white/8">
                <p className="text-xs font-semibold text-readable-strong mb-3">Easy meal ideas that fit this style</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insulinSmartMeals.map((meal) => (
                    <div key={meal} className="glass rounded-xl p-3 border border-white/8 flex items-start gap-2">
                      <ChevronRight size={11} className="text-teal-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-readable-soft leading-relaxed">{meal}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section>
          <div className="glass rounded-2xl p-6 border border-violet-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/7 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Dumbbell size={16} className="text-violet-400" />
                <h2 className="text-base font-semibold text-white">What This Means for a Lean, Active Cut</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-300/80 border-violet-500/15">
                  Applied
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-4">
                <div className="glass rounded-xl p-4 border border-violet-500/15">
                  <p className="text-sm text-readable-muted leading-relaxed mb-4">
                    If you are running, lifting, and trying to stay lean, post-run whey isolate makes mechanistic sense:
                    it gives you fast amino acids, an insulin response that helps transport and synthesis, and no meaningful evidence that this transient signal itself creates insulin resistance.<Cite id={2} /><Cite id={4} /><Cite id={13} />
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Use protein to protect lean mass, not just to 'hit macros.'",
                      "Whole-food meals should do most of the weekly work.",
                      "Treat high-palate processed food as optional entertainment, not structural support.",
                      "A single social meal matters far less than the default pattern surrounding it.",
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-2 text-xs text-readable-soft">
                        <ChevronRight size={11} className="text-violet-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/health/insulin"
                  className="group glass rounded-xl p-5 border border-violet-500/15 hover:border-violet-400/30 transition-all duration-200 block"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-readable-soft mb-2">Related deep dive</p>
                      <h3 className="text-lg font-semibold text-white">Insulin & insulin resistance</h3>
                    </div>
                    <ArrowRight size={16} className="text-violet-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-sm text-readable-muted leading-relaxed">
                    The diet page tells you how to eat. The insulin page explains the deeper machinery: adipose signaling, brain effects,
                    GLUT4, hyperinsulinemia, and why chronic baseline insulin is the real problem.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </Section>

        <Section>
          <div id="sources" className="glass rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-5">
              <BookOpen size={16} className="text-teal-400" />
              <h2 className="text-base font-semibold text-white">Sources & Further Reading</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {studies.map((study) => (
                <a
                  key={study.url}
                  href={study.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-xl p-4 border border-white/8 hover:border-teal-500/25 transition-all duration-200 group block"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-[10px] font-bold text-teal-400/65 bg-teal-500/10 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                      [{study.id}]
                    </span>
                    <div className="flex-1 flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-readable-strong leading-snug group-hover:text-white/90 transition-colors">
                        {study.title}
                      </p>
                      <ExternalLink size={11} className="text-white/20 group-hover:text-teal-400 transition-colors shrink-0 mt-0.5" />
                    </div>
                  </div>
                  <p className="text-[10px] text-teal-400/65 mb-1.5 pl-8">
                    {study.journal} · {study.year}
                  </p>
                  <p className="text-[10px] text-readable-soft leading-relaxed pl-8">{study.summary}</p>
                </a>
              ))}
            </div>

            <div className="border-t border-white/8 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Users size={13} className="text-readable-soft" />
                <p className="text-xs font-semibold text-readable-soft">Helpful voices in this area</p>
              </div>
              <div className="space-y-2">
                {contributors.map((c) => (
                  <div key={c.name} className="glass rounded-xl p-3.5 border border-white/8 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-teal-400/70">{c.initials}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-readable-strong">{c.name}</p>
                      <p className="text-[10px] text-readable-faint mt-0.5">{c.focus}</p>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-readable-faint italic pl-1">
                  Evidence statements above rely on the linked primary studies; the "default diet architecture" advice is a practical inference from those findings, not a trial-tested law.
                </p>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
