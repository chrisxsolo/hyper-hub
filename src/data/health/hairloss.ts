export const hairLossData = {
  title: "Hair Loss & DHT",
  subtitle: "The science of androgenetic alopecia and how to fight it",
  color: "purple",
  gradient: "from-purple-500/20 to-violet-600/10",
  borderColor: "border-purple-500/20",
  accentColor: "text-purple-400",
  icon: "💊",
  sections: [
    {
      id: "what-is-hair-loss",
      title: "What Is Androgenetic Alopecia?",
      content: `Androgenetic alopecia (AGA) is the most common form of hair loss, affecting roughly 50% of men by age 50. It is driven by a combination of genetic predisposition and androgen (hormone) activity — specifically DHT (dihydrotestosterone).

AGA follows a predictable pattern: hair follicles in genetically susceptible areas (temples, crown) miniaturize over time — each hair cycle producing a finer, shorter hair until eventually the follicle stops producing hair altogether.

The follicle doesn't die — it miniaturizes. This is why early intervention is so important.`,
      tags: ["Genetics", "Androgen", "Follicle Miniaturization"],
    },
    {
      id: "dht",
      title: "What Is DHT?",
      content: `DHT (dihydrotestosterone) is a potent androgen derived from testosterone via the enzyme 5-alpha reductase (5-AR). It is roughly 3–5x more potent than testosterone in binding to androgen receptors.

In hair follicles genetically sensitive to DHT, binding of DHT to the androgen receptor:
• Shortens the anagen (growth) phase
• Induces premature catagen (regression)
• Causes progressive follicle miniaturization over successive cycles

**Paradox:** DHT promotes hair loss on the scalp, but promotes body and facial hair growth. This is due to follicle-specific androgen receptor expression and sensitivity.`,
      tags: ["DHT", "5-Alpha Reductase", "Androgen Receptor"],
    },
    {
      id: "finasteride",
      title: "Finasteride — How It Works",
      content: `Finasteride is a Type II 5-alpha reductase inhibitor. It blocks the conversion of testosterone → DHT, reducing serum DHT by ~65–70% and scalp DHT by ~70%.

**FDA approved:** 1 mg/day (Propecia) for male pattern hair loss since 1997.

**Efficacy:**
• Halts progression in ~85% of men
• Regrowth seen in ~65% after 2 years
• Most effective at the crown and mid-scalp
• Takes 3–6 months to see initial results; 12–18 months for full effect

**Side effects (5–8% reported):**
• Sexual side effects (decreased libido, erectile dysfunction, ejaculatory dysfunction)
• Post-Finasteride Syndrome (controversial — small subset report persistent effects)
• Slightly decreased PSA (relevant for prostate cancer screening)

**Key point:** Stop taking it and DHT rebounds — any hair gained is typically lost within 6–12 months.`,
      tags: ["5-AR Inhibitor", "FDA Approved", "Oral Medication"],
    },
    {
      id: "minoxidil",
      title: "Minoxidil — How It Works",
      content: `Minoxidil was originally developed as an oral antihypertensive. Hair growth was discovered as a side effect. Topical formulations (2% and 5%) are now first-line OTC treatments for AGA.

**Mechanism (still not fully understood):**
• Opens ATP-sensitive potassium channels → vasodilation of scalp capillaries
• Prolongs the anagen (growth) phase
• May directly stimulate follicle proliferation via prostaglandin E2
• Sulfotransferase enzymes in the scalp convert minoxidil to its active form (minoxidil sulfate) — enzyme expression predicts who responds

**Topical (5% foam/liquid):**
• Applied once or twice daily
• Shedding in weeks 1–8 is normal (anagen shift)
• Results visible at 3–4 months; full effect at 12 months

**Oral Minoxidil (0.25–2.5 mg/day):**
• More convenient, potentially more effective
• Systemic side effects: fluid retention, unwanted body hair (hypertrichosis), reflex tachycardia at higher doses`,
      tags: ["Vasodilator", "Anagen Prolongation", "OTC + Oral"],
    },
    {
      id: "combo-approach",
      title: "Combination Protocol",
      content: `Finasteride and minoxidil work via different mechanisms and are synergistic:

• **Finasteride** — addresses the root cause (DHT suppression), stops progression
• **Minoxidil** — promotes regrowth and extends growth phase independent of DHT

**Evidence-backed stack:**
1. Finasteride 1 mg/day oral
2. Minoxidil 5% topical once daily (or oral low-dose 0.25–1mg/day)
3. Dermarolling (microneedling) 1.5mm — improves topical penetration and may stimulate growth factors independently
4. Ketoconazole shampoo 2% — mild anti-androgen effect at scalp level

**Start early.** Hair loss is easier to halt than reverse. Once follicles are gone, you need hair transplant.`,
      tags: ["Protocol", "Synergy", "Early Intervention"],
    },
  ],
  studies: [
    {
      title: "Finasteride for Male Androgenetic Alopecia — 5-Year Study",
      journal: "Journal of the American Academy of Dermatology",
      year: 1999,
      url: "https://pubmed.ncbi.nlm.nih.gov/10495374/",
      summary: "Long-term efficacy showing sustained hair count improvement over 5 years",
    },
    {
      title: "Minoxidil Sulfotransferase Activity Predicts Response",
      journal: "British Journal of Dermatology",
      year: 2007,
      url: "https://pubmed.ncbi.nlm.nih.gov/17672887/",
      summary: "Sulfotransferase enzyme expression in hair follicles predicts topical minoxidil response",
    },
    {
      title: "Combination Finasteride + Minoxidil vs Monotherapy",
      journal: "Journal of Dermatological Treatment",
      year: 2015,
      url: "https://pubmed.ncbi.nlm.nih.gov/24655716/",
      summary: "Combination superior to either treatment alone for hair count and patient satisfaction",
    },
    {
      title: "Dermarolling + Minoxidil vs Minoxidil Alone",
      journal: "International Journal of Trichology",
      year: 2013,
      url: "https://pubmed.ncbi.nlm.nih.gov/24574709/",
      summary: "Microneedling significantly enhanced minoxidil response compared to minoxidil alone",
    },
  ],
  quickStats: [
    { label: "DHT reduction (finasteride)", value: "65–70%", note: "serum levels" },
    { label: "Men affected by 50", value: "~50%", note: "of all men" },
    { label: "Halt progression rate", value: "~85%", note: "with finasteride" },
    { label: "Time to see results", value: "3–6 mo", note: "minimum" },
  ],
};
