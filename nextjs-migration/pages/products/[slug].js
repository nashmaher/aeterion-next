// @ts-nocheck
/**
 * /pages/products/[slug].js
 *
 * Statically-generated individual product pages.
 * Each product gets a URL like /products/semaglutide-2mg
 * These are FULLY RENDERED HTML — Google indexes every product name,
 * description, category, research content, and price.
 *
 * This file is the primary SEO driver for the site.
 */

import Head from 'next/head'
import Link from 'next/link'

// ─── Canonical product data (keep in sync with pages/index.js) ───────────────
// We duplicate the minimal product metadata here so Next.js can build
// static pages at build time without running the full store component.

const CATS = {
  metabolic:   'GLP-1 / Metabolic',
  growth:      'Growth Hormone',
  recovery:    'Recovery & Healing',
  longevity:   'Longevity & Anti-Aging',
  neuro:       'Cognitive & Neuro',
  body:        'Body Composition',
  hormonal:    'Hormonal',
  cosmetic:    'Cosmetic',
  ancillaries: 'Ancillaries',
}

// Minimal product list for static path generation
// id, name, cat, desc, variants, highlights
const PRODUCTS_META = [
  { id:1,  name:'Semaglutide',               cat:'metabolic',   desc:'Semaglutide is a GLP-1 receptor agonist originally developed for type 2 diabetes management and weight reduction research. It mimics the glucagon-like peptide-1 hormone, suppressing appetite signaling and slowing gastric emptying.', variants:[{s:'2mg',p:60},{s:'5mg',p:98},{s:'10mg',p:138},{s:'15mg',p:178},{s:'20mg',p:218}], highlights:['GLP-1 receptor agonist','Appetite regulation','Metabolic research','~7 day half-life'] },
  { id:2,  name:'Tirzepatide',               cat:'metabolic',   desc:'Tirzepatide is a novel dual GIP and GLP-1 receptor agonist that has shown remarkable results in metabolic research. By activating both incretin receptors simultaneously, it demonstrates superior effects on insulin sensitivity and body composition.', variants:[{s:'5mg',p:68},{s:'10mg',p:115},{s:'15mg',p:148},{s:'20mg',p:185},{s:'40mg',p:285}], highlights:['Dual GIP/GLP-1 agonist','Insulin sensitivity','Superior metabolic response','Weekly dosing'] },
  { id:3,  name:'Retatrutide',               cat:'metabolic',   desc:'Retatrutide is a next-generation triple agonist targeting GLP-1, GIP, and glucagon receptors simultaneously. Early research has shown extraordinary potential for weight reduction and metabolic health, with trials demonstrating the highest weight loss percentages observed.', variants:[{s:'5mg',p:92},{s:'10mg',p:120},{s:'15mg',p:162},{s:'20mg',p:205}], highlights:['Triple receptor agonist','GLP-1 + GIP + Glucagon','Next-gen metabolic','Highest efficacy observed'] },
  { id:4,  name:'Liraglutide',               cat:'metabolic',   desc:'Liraglutide is a long-acting GLP-1 analogue with approximately 97% sequence homology to native human GLP-1. Research applications include metabolic health, cardiovascular risk markers, and appetite regulation studies.', variants:[{s:'5mg',p:68},{s:'10mg',p:108}], highlights:['97% hGLP-1 homology','Daily dosing','Cardiovascular research','Appetite regulation'] },
  { id:5,  name:'Dulaglutide',               cat:'metabolic',   desc:'Dulaglutide is a once-weekly GLP-1 receptor agonist fused to an immunoglobulin Fc fragment, extending its half-life significantly. Research focuses on its metabolic effects, insulin secretion modulation, and sustained appetite suppression.', variants:[{s:'5mg',p:68},{s:'10mg',p:108}], highlights:['Once-weekly dosing','Fc-fused stability','Sustained action','Metabolic research'] },
  { id:6,  name:'Mazdutide',                 cat:'metabolic',   desc:'Mazdutide (IBI362) is a dual GLP-1 and glucagon receptor agonist under active research. The glucagon component adds thermogenic and energy expenditure properties to GLP-1-mediated appetite suppression.', variants:[{s:'5mg',p:118},{s:'10mg',p:188}], highlights:['Dual GLP-1/Glucagon','Thermogenic effects','Energy expenditure','Emerging compound'] },
  { id:7,  name:'Survodutide',               cat:'metabolic',   desc:'Survodutide (BI 456906) is a potent GLP-1 and glucagon receptor co-agonist designed for metabolic and liver health research. Studies have demonstrated strong effects on weight reduction and liver fat content, with ongoing research into NAFLD.', variants:[{s:'10mg',p:132}], highlights:['GLP-1/Glucagon co-agonist','Liver health research','NAFLD studies','Strong metabolic effects'] },
  { id:8,  name:'Cagrilintide',              cat:'metabolic',   desc:'Cagrilintide is a long-acting amylin analogue that works through a complementary mechanism to GLP-1 agonists. Research has shown that combining cagrilintide with semaglutide produces additive effects on body weight reduction.', variants:[{s:'5mg',p:78},{s:'10mg',p:130}], highlights:['Amylin receptor agonist','Complementary to GLP-1','Glucagon regulation','Combination research'] },
  { id:9,  name:'Cagrisema',                 cat:'metabolic',   desc:'Cagrisema is the investigational combination of cagrilintide and semaglutide. Phase 3 trials have demonstrated superior weight reduction compared to either compound alone, representing a convergence of two complementary metabolic pathways.', variants:[{s:'combo',p:92}], highlights:['Dual mechanism combo','Amylin + GLP-1','Superior combo data','Phase 3 research'] },
  { id:10, name:'Orforglipron',              cat:'metabolic',   desc:'Orforglipron is an oral, non-peptide GLP-1 receptor agonist — a landmark development in metabolic research. Unlike injectable GLP-1 peptides, its small molecule structure allows oral bioavailability with a daily dosing schedule.', variants:[{s:'5mg',p:92}], highlights:['Oral GLP-1 agonist','Non-peptide molecule','Daily oral dosing','Bioavailability research'] },
  { id:11, name:'Ipamorelin',                cat:'growth',      desc:'Ipamorelin is a selective growth hormone secretagogue and ghrelin receptor agonist. It stimulates pulsatile GH release without significantly affecting cortisol, prolactin, or ACTH — making it one of the most studied GHRP compounds available.', variants:[{s:'2mg',p:38},{s:'5mg',p:62},{s:'10mg',p:98}], highlights:['Selective GH secretagogue','No cortisol spike','Pulsatile GH release','Clean safety profile'] },
  { id:12, name:'CJC-1295 (no DAC)',         cat:'growth',      desc:'CJC-1295 without DAC is a modified GHRH analogue with a shorter, more pulsatile action profile. It stimulates growth hormone release in sync with natural GH pulses, ideal for research requiring physiological GH patterns.', variants:[{s:'2mg',p:32},{s:'5mg',p:55}], highlights:['GHRH analogue','Pulsatile GH profile','Physiological pattern','Short-acting'] },
  { id:13, name:'CJC-1295 (DAC)',            cat:'growth',      desc:'CJC-1295 with DAC (Drug Affinity Complex) is a long-acting GHRH analogue engineered for sustained GH and IGF-1 elevation. The DAC technology binds the peptide to serum albumin, extending its half-life to approximately 8 days.', variants:[{s:'2mg',p:42},{s:'5mg',p:68}], highlights:['GHRH + DAC technology','~8 day half-life','Sustained GH/IGF-1','Once-weekly research'] },
  { id:14, name:'GHRP-2',                    cat:'growth',      desc:'GHRP-2 is a potent synthetic hexapeptide that stimulates GH release via the ghrelin receptor. Research shows it produces strong GH pulses and has been studied for its effects on body composition, recovery, and metabolic function.', variants:[{s:'5mg',p:35},{s:'10mg',p:58},{s:'15mg',p:78}], highlights:['Potent GH stimulator','Ghrelin receptor agonist','Strong GH pulses','Body composition'] },
  { id:15, name:'GHRP-6',                    cat:'growth',      desc:'GHRP-6 is one of the original synthetic growth hormone releasing peptides. It activates the ghrelin receptor, producing substantial GH pulses and also stimulates appetite through central mechanisms, making it relevant to both GH and hunger research.', variants:[{s:'5mg',p:32},{s:'10mg',p:52}], highlights:['Original GHRP compound','Appetite stimulation','Strong GH pulses','Ghrelin receptor'] },
  { id:16, name:'Hexarelin',                 cat:'growth',      desc:'Hexarelin is the most potent synthetic GHRP and ghrelin receptor agonist available. Research demonstrates extremely strong GH release, along with cardioprotective properties independent of GH secretion, making it relevant to both GH and cardiac research.', variants:[{s:'2mg',p:38},{s:'5mg',p:62}], highlights:['Most potent GHRP','Cardioprotective effects','Ghrelin receptor','GH + cardiac research'] },
  { id:17, name:'Sermorelin',                cat:'growth',      desc:'Sermorelin is a 29-amino acid fragment of endogenous GHRH (the first 29 amino acids), retaining full biological activity. It stimulates pituitary GH release through physiological pathways, making it valuable for research on GH axis function.', variants:[{s:'2mg',p:32},{s:'5mg',p:52}], highlights:['GHRH fragment 1-29','Physiological GH release','Pituitary research','Axis function studies'] },
  { id:18, name:'Tesamorelin',               cat:'growth',      desc:'Tesamorelin is a stabilized GHRH analogue engineered for improved half-life. Research applications include visceral adiposity reduction, GH deficiency models, and metabolic syndrome studies. Well-characterized in multiple clinical trials.', variants:[{s:'2mg',p:52},{s:'5mg',p:98}], highlights:['Stabilized GHRH analogue','Visceral fat research','GH deficiency models','Clinical trial data'] },
  { id:19, name:'MOD-GRF (1-29)',            cat:'growth',      desc:'MOD-GRF (1-29), also called CJC-1295 without DAC, is a modified GHRH fragment with improved receptor binding and resistance to enzymatic degradation. It produces physiological GH pulses when dosed in sync with endogenous GH rhythms.', variants:[{s:'2mg',p:32},{s:'5mg',p:52}], highlights:['Modified GHRH fragment','Enzyme resistance','Physiological pulsing','Improved receptor affinity'] },
  { id:20, name:'MK-677 (Ibutamoren)',       cat:'growth',      desc:'MK-677 (Ibutamoren) is an oral, non-peptide GHS-R1a agonist that mimics the action of ghrelin. Unlike injectable GHRPs, its small molecule structure enables oral bioavailability. Research documents sustained IGF-1 elevation with daily dosing.', variants:[{s:'10mg',p:48}], highlights:['Oral GH secretagogue','Non-peptide GHS-R1a','Sustained IGF-1','Daily oral dosing'] },
  { id:21, name:'IGF-1 LR3',                 cat:'growth',      desc:'IGF-1 LR3 is a recombinant IGF-1 variant with an N-terminal extension and Arg3 substitution, reducing IGF-binding protein affinity and extending active half-life to approximately 20-30 hours. Research focuses on anabolic signaling and cellular growth pathways.', variants:[{s:'1mg',p:68},{s:'2mg',p:118}], highlights:['Extended half-life IGF-1','Reduced binding protein affinity','Anabolic signaling','~20-30 hour activity'] },
  { id:22, name:'BPC-157',                   cat:'recovery',    desc:'BPC-157 (Body Protective Compound 157) is a pentadecapeptide derived from a protective protein found in gastric juice. Extensive research documents accelerated healing of tendons, ligaments, muscles, and gastrointestinal tissue through multiple signaling pathways.', variants:[{s:'5mg',p:48},{s:'10mg',p:82}], highlights:['Tissue healing research','GI tract protection','Tendon & ligament repair','Angiogenesis promotion'] },
  { id:23, name:'TB-500 (Thymosin β4)',      cat:'recovery',    desc:'TB-500 is a synthetic analogue of Thymosin Beta-4, a naturally occurring 43-amino acid protein. Research shows it promotes actin regulation, cellular migration, angiogenesis, and inflammation modulation — with applications in wound healing and cardiac tissue research.', variants:[{s:'5mg',p:52},{s:'10mg',p:88}], highlights:['Thymosin Beta-4 analogue','Actin regulation','Wound healing research','Angiogenesis'] },
  { id:24, name:'BPC-157 + TB-500 Blend',   cat:'recovery',    desc:'This combination blends BPC-157 and TB-500, allowing simultaneous research of two complementary healing mechanisms. BPC-157 provides local tissue repair signaling while TB-500 contributes systemic actin regulation and cellular migration effects.', variants:[{s:'10mg',p:115}], highlights:['Dual mechanism blend','Local + systemic repair','Complementary pathways','Research convenience'] },
  { id:25, name:'Epithalon',                 cat:'recovery',    desc:'Epithalon (Epitalon) is a synthetic tetrapeptide derived from Epithalamin, a polypeptide extract of the pineal gland. Research has focused on telomere elongation, telomerase activation, antioxidant effects, and circadian rhythm regulation.', variants:[{s:'10mg',p:62},{s:'20mg',p:98}], highlights:['Telomerase activation','Telomere research','Pineal gland peptide','Anti-aging studies'] },
  { id:26, name:'GHK-Cu (Copper Peptide)',   cat:'recovery',    desc:'GHK-Cu is a naturally occurring copper-binding tripeptide abundant in human plasma. Research demonstrates potent wound healing, collagen synthesis promotion, angiogenesis, and anti-inflammatory effects. Widely studied in both systemic and topical models.', variants:[{s:'50mg',p:52},{s:'100mg',p:88}], highlights:['Copper-binding tripeptide','Collagen synthesis','Wound healing','Anti-inflammatory'] },
  { id:27, name:'Thymosin Alpha-1',          cat:'recovery',    desc:'Thymosin Alpha-1 is a 28-amino acid peptide originally isolated from thymic tissue. Research focuses on its immunomodulatory properties — specifically T-cell maturation, NK cell activity, and antiviral immune response enhancement.', variants:[{s:'5mg',p:68},{s:'10mg',p:118}], highlights:['Thymic peptide','T-cell maturation','Immunomodulation','Antiviral research'] },
  { id:28, name:'LL-37',                     cat:'recovery',    desc:'LL-37 is the only human member of the cathelicidin family of antimicrobial peptides. Research documents broad-spectrum antimicrobial activity, immunomodulation, wound healing promotion, and angiogenesis — making it relevant across infection, immunity, and tissue repair research.', variants:[{s:'5mg',p:78}], highlights:['Human cathelicidin','Antimicrobial research','Immunomodulation','Wound healing'] },
  { id:29, name:'KPV',                       cat:'recovery',    desc:'KPV is a tripeptide (Lys-Pro-Val) derived from the C-terminal of alpha-MSH. Research demonstrates potent anti-inflammatory effects through NF-κB pathway inhibition, with applications in inflammatory bowel disease models and skin inflammation research.', variants:[{s:'10mg',p:48}], highlights:['Alpha-MSH fragment','NF-κB inhibition','Anti-inflammatory','IBD research models'] },
  { id:30, name:'Dihexa',                    cat:'recovery',    desc:'Dihexa is a potent HGF/c-Met agonist derived from angiotensin IV. Research shows it produces synaptogenic effects — promoting the formation of functional synaptic connections. Studies in rodent models show dramatic improvements in cognitive tasks associated with hippocampal function.', variants:[{s:'50mg',p:68}], highlights:['HGF/c-Met agonist','Synaptogenesis','Cognitive enhancement','Neuroprotective effects'] },
  { id:31, name:'Selank',                    cat:'recovery',    desc:'Selank is a synthetic analogue of the endogenous immunomodulatory peptide tuftsin. Research documents anxiolytic, nootropic, and immunomodulatory effects. It modulates GABA receptor systems and brain-derived neurotrophic factor expression.', variants:[{s:'5mg',p:52}], highlights:['Tuftsin analogue','Anxiolytic effects','GABA modulation','BDNF expression'] },
  { id:32, name:'Semax',                     cat:'recovery',    desc:'Semax is an ACTH(4-10) analogue developed in Russia. Research focuses on neuroprotective effects, BDNF elevation, cognitive enhancement, and ischemia protection. It has been used in Russian clinical settings for stroke and cognitive decline research.', variants:[{s:'30mg',p:62}], highlights:['ACTH(4-10) analogue','Neuroprotective','BDNF upregulation','Ischemia research'] },
  { id:33, name:'Epitalon',                  cat:'longevity',   desc:'Epitalon (Epithalon) is a synthetic tetrapeptide researched for telomerase activation and telomere elongation. As a pineal gland extract derivative, it has been studied for circadian rhythm regulation, antioxidant effects, and longevity mechanisms.', variants:[{s:'10mg',p:62},{s:'20mg',p:98}], highlights:['Telomere elongation','Telomerase activation','Circadian regulation','Anti-aging research'] },
  { id:34, name:'NAD+ Precursor (NMN)',      cat:'longevity',   desc:'NMN (Nicotinamide Mononucleotide) is a direct precursor to NAD+, a coenzyme central to cellular energy metabolism, DNA repair, and sirtuin activation. Research links NAD+ decline with aging, making NMN supplementation a subject of intense longevity research.', variants:[{s:'500mg',p:42},{s:'1g',p:72}], highlights:['NAD+ precursor','Sirtuin activation','DNA repair support','Cellular energy research'] },
  { id:35, name:'Humanin',                   cat:'longevity',   desc:'Humanin is a mitochondria-derived peptide (MOTS-c family) encoded within the mitochondrial genome. Research shows cytoprotective, neuroprotective, and anti-apoptotic effects. Circulating Humanin levels decline with age, positioning it as a biomarker and therapeutic target.', variants:[{s:'1mg',p:88}], highlights:['Mitochondria-derived peptide','Cytoprotective','Anti-apoptotic','Age-related decline marker'] },
  { id:36, name:'MOTS-c',                    cat:'longevity',   desc:'MOTS-c is a mitochondrial open reading frame peptide that regulates metabolic homeostasis, insulin sensitivity, and stress responses. Research links MOTS-c to longevity, exercise mimicry effects, and protection against age-related metabolic decline.', variants:[{s:'5mg',p:92}], highlights:['Mitochondrial peptide','Insulin sensitivity','Metabolic homeostasis','Exercise mimicry'] },
  { id:37, name:'Foxo4-DRI',                 cat:'longevity',   desc:'Foxo4-DRI is a peptide designed to disrupt the interaction between Foxo4 and p53 in senescent cells, triggering apoptosis of dysfunctional senescent cells (senolytics) without harming healthy cells. Research in aging mouse models showed restored fitness and fur density.', variants:[{s:'10mg',p:158}], highlights:['Senolytic peptide','Senescent cell clearance','Foxo4-p53 disruption','Aging model research'] },
  { id:38, name:'Klotho Peptide',            cat:'longevity',   desc:'Klotho is a longevity-associated protein whose circulating levels decline with age. Research links Klotho to neuroprotection, kidney protection, cardiovascular health, and anti-aging effects. Peptide fragments of Klotho retain biological activity for research purposes.', variants:[{s:'1mg',p:128}], highlights:['Longevity protein fragment','Neuroprotective','Kidney protection','Age-related decline research'] },
  { id:39, name:'ARA-290',                   cat:'longevity',   desc:'ARA-290 is an 11-amino acid peptide derived from erythropoietin that selectively activates the innate repair receptor without erythropoietic effects. Research focuses on neuroprotection, neuropathic pain, anti-inflammatory effects, and metabolic function.', variants:[{s:'10mg',p:98}], highlights:['EPO-derived peptide','Innate repair receptor','Neuroprotection','Anti-nociceptive research'] },
  { id:40, name:'SS-31 (Elamipretide)',       cat:'longevity',   desc:'SS-31 (Elamipretide) is a mitochondria-targeted peptide that binds cardiolipin on the inner mitochondrial membrane, protecting cristae architecture and electron transport chain function. Research demonstrates improved mitochondrial efficiency and reduced oxidative stress.', variants:[{s:'10mg',p:118}], highlights:['Mitochondria-targeted','Cardiolipin binding','Electron transport support','Oxidative stress reduction'] },
  { id:41, name:'Thymalin',                  cat:'longevity',   desc:'Thymalin is a polypeptide complex extracted from bovine thymus gland, containing multiple biologically active peptides. Russian research spanning decades documents immunomodulatory effects, T-cell activation, and potential anti-aging properties in aged immune systems.', variants:[{s:'10mg',p:72}], highlights:['Thymus polypeptide','T-cell activation','Immunomodulation','Russian clinical research'] },
  { id:42, name:'Noopept',                   cat:'neuro',       desc:'Noopept (GVS-111) is a dipeptide nootropic approximately 1000x more potent by weight than piracetam. Research demonstrates NGF and BDNF upregulation, improved memory consolidation, and neuroprotective effects against oxidative and excitotoxic stress.', variants:[{s:'100mg',p:38},{s:'200mg',p:62}], highlights:['Potent dipeptide nootropic','NGF + BDNF upregulation','Memory consolidation','Neuroprotection'] },
  { id:43, name:'Cerebrolysin',              cat:'neuro',       desc:'Cerebrolysin is a neuropeptide complex derived from porcine brain proteins, containing multiple neurotrophic factors. Extensive research demonstrates neuroprotective, neurorestorative, and neurotrophic effects relevant to Alzheimers, stroke recovery, and traumatic brain injury models.', variants:[{s:'10ml',p:58},{s:'30ml',p:145}], highlights:['Neuropeptide complex','Neurotrophic factors','Alzheimer research','Stroke recovery models'] },
  { id:44, name:'P21 Peptide',               cat:'neuro',       desc:'P21 is a peptide agonist of CNTF (Ciliary Neurotrophic Factor) that crosses the blood-brain barrier more effectively. Research shows neurogenesis promotion in the hippocampus, improved spatial memory, and BDNF elevation — making it relevant to cognitive enhancement and neurodegenerative models.', variants:[{s:'5mg',p:68}], highlights:['CNTF receptor agonist','Hippocampal neurogenesis','Spatial memory','BDNF elevation'] },
  { id:45, name:'Pinealon',                  cat:'neuro',       desc:'Pinealon is a synthetic tripeptide (Glu-Asp-Arg) derived from the pineal gland. Research in animal models documents neuroprotective effects, improved learning and memory, and potential anti-aging effects on brain tissue through epigenetic mechanisms.', variants:[{s:'10mg',p:62}], highlights:['Pineal-derived tripeptide','Neuroprotection','Epigenetic effects','Memory research'] },
  { id:46, name:'Cortagen',                  cat:'neuro',       desc:'Cortagen is a synthetic tetrapeptide derived from the cerebral cortex. Research focuses on neuroptective effects, cognitive enhancement, and restoration of cortical function in ischemia and neurodegeneration models. Developed and researched primarily in Russia.', variants:[{s:'10mg',p:62}], highlights:['Cortical tetrapeptide','Neuroprotective','Cognitive restoration','Ischemia models'] },
  { id:47, name:'Selank',                    cat:'neuro',       desc:'Selank is a synthetic analogue of the endogenous immunomodulatory peptide tuftsin. Nootropic research documents anxiolytic effects, BDNF modulation, enhanced memory consolidation, and reduced anxiety — with a favorable side effect profile compared to benzodiazepines.', variants:[{s:'5mg',p:52}], highlights:['Anxiolytic nootropic','BDNF modulation','Memory enhancement','No dependence profile'] },
  { id:48, name:'Semax',                     cat:'neuro',       desc:'Semax is an ACTH(4-10) analogue with potent nootropic and neuroprotective properties. Research documents BDNF elevation, enhanced attention and memory, dopamine/serotonin modulation, and protection against neurodegeneration in ischemic models.', variants:[{s:'30mg',p:62}], highlights:['ACTH(4-10) analogue','BDNF elevation','Dopamine modulation','Ischemia neuroprotection'] },
  { id:49, name:'Dihexa',                    cat:'neuro',       desc:'Dihexa is a potent cognitive enhancer and synaptogenic agent — an HGF/c-Met signaling pathway agonist. Research shows it is approximately one million times more potent than BDNF at promoting new synaptic connections and improving performance in hippocampal memory tasks.', variants:[{s:'50mg',p:68}], highlights:['Synaptogenic agent','HGF/c-Met agonist','Million-fold BDNF potency','Memory task improvement'] },
  { id:50, name:'9-Me-BC',                   cat:'neuro',       desc:'9-Methyl-β-carboline (9-Me-BC) is a synthetic β-carboline compound researched for neuroprotective and dopaminergic properties. It inhibits MAO enzymes, promotes dopaminergic neuron growth, and may protect against neurotoxins — relevant to Parkinson research models.', variants:[{s:'50mg',p:48},{s:'100mg',p:82}], highlights:['β-carboline compound','MAO inhibition','Dopaminergic neuroprotection','Parkinson models'] },
  { id:51, name:'NSI-189',                   cat:'neuro',       desc:'NSI-189 is a small molecule neurogenic compound that stimulates hippocampal neurogenesis. Clinical research has examined its potential in major depressive disorder and cognitive enhancement. It increases hippocampal volume and BDNF expression in preclinical models.', variants:[{s:'100mg',p:78}], highlights:['Hippocampal neurogenesis','Neurogenic compound','Depression research','BDNF + volume increase'] },
  { id:52, name:'Adamax (Adamantyl-Semax)', cat:'neuro',        desc:'Adamax (Adamantyl-Semax) is a modified version of Semax with an adamantane group added to improve lipophilicity and BBB penetration. Research suggests enhanced nootropic and neuroprotective effects compared to parent Semax, with improved CNS bioavailability.', variants:[{s:'30mg',p:72}], highlights:['Adamantyl-modified Semax','Enhanced BBB penetration','Improved CNS bioavailability','Potentiated nootropic'] },
  { id:53, name:'Fragment 176-191',          cat:'body',        desc:'HGH Fragment 176-191 is a modified GH peptide consisting of amino acids 176-191 of the growth hormone sequence. Research shows it retains lipolytic activity while lacking the glucose-raising effects of full GH. Studies demonstrate targeted fat reduction in animal models.', variants:[{s:'2mg',p:32},{s:'5mg',p:72}], highlights:['GH lipolytic fragment','Fat-targeted activity','No glucose effects','Research compound'] },
  { id:54, name:'AOD-9604',                  cat:'body',        desc:'AOD-9604 is a modified form of HGH Fragment 176-191 with an additional tyrosine at the N-terminus. Research documents anti-obesity effects via stimulation of fat metabolism without affecting blood sugar, growth, or IGF-1 levels.', variants:[{s:'5mg',p:78}], highlights:['Modified HGH fragment','Anti-obesity research','Fat metabolism','No IGF-1 effect'] },
  { id:55, name:'MOTS-c',                    cat:'body',        desc:'MOTS-c is a mitochondrial-derived peptide with pronounced effects on insulin sensitivity and metabolic regulation. Research in animal models demonstrates exercise-like metabolic improvements and reversal of diet-induced obesity — without exercise.', variants:[{s:'5mg',p:92}], highlights:['Mitochondrial peptide','Exercise mimicry','Insulin sensitivity','Diet-induced obesity models'] },
  { id:56, name:'Tesofensine',               cat:'body',        desc:'Tesofensine is a triple monoamine reuptake inhibitor that inhibits uptake of dopamine, serotonin, and norepinephrine. Phase 2 research showed significant weight loss exceeding GLP-1 agonists at the time, with strong appetite suppression through central mechanisms.', variants:[{s:'1mg',p:78}], highlights:['Triple reuptake inhibitor','Strong appetite suppression','Central mechanism','Phase 2 weight loss data'] },
  { id:57, name:'5-Amino-1MQ',               cat:'body',        desc:'5-Amino-1MQ is a small molecule inhibitor of NNMT (Nicotinamide N-methyltransferase). Research shows it increases SAM availability, activates SIRT1, and promotes fat cell breakdown — with potential relevance to obesity, metabolic syndrome, and muscle research.', variants:[{s:'100mg',p:68}], highlights:['NNMT inhibitor','SIRT1 activation','Fat cell metabolism','SAM availability'] },
  { id:58, name:'RAD-140 (Testolone)',       cat:'body',        desc:'RAD-140 is a selective androgen receptor modulator (SARM) with high tissue selectivity for muscle and bone. Research documents anabolic effects on lean mass and bone density with reduced androgenic side effects compared to testosterone in preclinical models.', variants:[{s:'10mg',p:58}], highlights:['Selective AR modulator','Lean mass research','Bone density effects','Tissue selectivity'] },
  { id:59, name:'MIC Injection (B12+)',      cat:'body',        desc:'MIC injections contain Methionine, Inositol, and Choline — lipotropic compounds that support fat mobilization from the liver. Combined with B12 for energy metabolism support. Used in lipotropic research examining hepatic fat processing and metabolic pathways.', variants:[{s:'10ml',p:38}], highlights:['Lipotropic compounds','Hepatic fat mobilization','B12 energy support','Methionine-Inositol-Choline'] },
  { id:60, name:'Lipo-C (Lipotropic)',       cat:'body',        desc:'Lipo-C is a comprehensive lipotropic formulation containing L-Carnitine, Methionine, Inositol, Choline, B1, B2, B3, and B6. Research applications include hepatic fat metabolism, mitochondrial fatty acid transport, and lipid mobilization studies.', variants:[{s:'10ml',p:48}], highlights:['Comprehensive lipotropic','L-Carnitine included','Multi-B vitamin complex','Hepatic fat research'] },
  { id:61, name:'L-Carnitine Injection',     cat:'body',        desc:'L-Carnitine is an amino acid derivative essential for mitochondrial fatty acid transport. Injectable L-Carnitine achieves higher plasma levels than oral forms. Research applications include fat oxidation, exercise performance, and mitochondrial function studies.', variants:[{s:'10ml',p:32}], highlights:['Mitochondrial fatty acid transport','Higher bioavailability than oral','Fat oxidation research','Exercise performance'] },
  { id:62, name:'Glutathione Injection',     cat:'body',        desc:'Glutathione is the body\'s primary endogenous antioxidant tripeptide. Injectable glutathione bypasses oral degradation to achieve systemic levels. Research applications include antioxidant capacity, liver detoxification, and oxidative stress models.', variants:[{s:'200mg/ml 10ml',p:48}], highlights:['Primary endogenous antioxidant','Bypasses oral degradation','Liver detoxification','Oxidative stress research'] },
  { id:63, name:'PT-141 (Bremelanotide)',    cat:'hormonal',    desc:'PT-141 (Bremelanotide) is a synthetic melanocortin receptor agonist. Research has examined its effects on sexual function in both male and female models through central nervous system mechanisms, distinct from PDE5 inhibitors. FDA-approved form exists (Vyleesi) for female sexual interest disorder.', variants:[{s:'10mg',p:58}], highlights:['Melanocortin agonist','Central mechanism','Male + female research','FDA-approved analogue'] },
  { id:64, name:'Kisspeptin-10',             cat:'hormonal',    desc:'Kisspeptin-10 is a fragment of the KISS1 gene product that acts as a potent hypothalamic GnRH secretagogue. Research applications include reproductive axis regulation, LH/FSH pulse research, and fertility studies. Central to understanding hypothalamic-pituitary-gonadal axis function.', variants:[{s:'5mg',p:68}], highlights:['GnRH secretagogue','Reproductive axis','LH/FSH pulse regulation','HPG axis research'] },
  { id:65, name:'Gonadorelin (GnRH)',        cat:'hormonal',    desc:'Gonadorelin is synthetic GnRH (Gonadotropin-Releasing Hormone), identical to the endogenous decapeptide. Research applications include HPG axis stimulation, LH/FSH pulse testing, and testosterone production restoration studies in hypogonadism models.', variants:[{s:'2mg',p:38},{s:'10mg',p:128}], highlights:['Synthetic GnRH','HPG axis stimulation','LH/FSH release','Hypogonadism research'] },
  { id:66, name:'HCG (Human Chorionic Gonadotropin)',cat:'hormonal',desc:'HCG is a glycoprotein hormone with structural similarity to LH. Research uses include testosterone production stimulation through Leydig cell activation, fertility research, and HPG axis studies. The most LH-like hormone available for research.', variants:[{s:'5000iu',p:32},{s:'10000iu',p:52}], highlights:['LH-like hormone','Leydig cell activation','Testosterone research','Fertility studies'] },
  { id:67, name:'Enclomiphene',              cat:'hormonal',    desc:'Enclomiphene is the trans-isomer of clomiphene, acting as a selective estrogen receptor modulator (SERM) with primarily antagonist effects at the hypothalamus. Research shows it increases LH, FSH, and testosterone while preserving fertility — unlike exogenous testosterone.', variants:[{s:'25mg',p:58}], highlights:['Trans-clomiphene SERM','Hypothalamic ER antagonist','LH/FSH/T elevation','Fertility preservation'] },
  { id:68, name:'Anastrozole',               cat:'hormonal',    desc:'Anastrozole is a third-generation aromatase inhibitor that blocks conversion of androgens to estrogens. Research applications include estrogen-sensitive tissue models, hormonal balance studies, and androgen/estrogen ratio research. Non-steroidal mechanism with high selectivity.', variants:[{s:'1mg',p:38}], highlights:['Aromatase inhibitor','Estrogen suppression','Non-steroidal','Androgen/estrogen ratio'] },
  { id:69, name:'Clomiphene Citrate',        cat:'hormonal',    desc:'Clomiphene citrate is a mixed SERM with both agonist and antagonist estrogen receptor activity depending on tissue. Research applications include HPG axis stimulation, ovulation induction models, and testosterone restoration studies. Long history of clinical use provides extensive reference data.', variants:[{s:'25mg',p:32},{s:'50mg',p:52}], highlights:['Mixed SERM','HPG axis stimulation','Ovulation research','Extensive clinical data'] },
  { id:70, name:'DHEA',                      cat:'hormonal',    desc:'DHEA (Dehydroepiandrosterone) is an endogenous steroid hormone produced by the adrenal gland that serves as a precursor to androgens and estrogens. Research examines its role in aging, adrenal function, neurosteroid effects, and hormonal precursor biology.', variants:[{s:'25mg',p:28},{s:'50mg',p:42}], highlights:['Endogenous steroid precursor','Adrenal hormone','Neurosteroid effects','Aging research'] },
  { id:71, name:'Melanotan II',              cat:'cosmetic',    desc:'Melanotan II is a synthetic analogue of alpha-melanocyte-stimulating hormone. Research documents potent melanogenesis stimulation, resulting in increased skin pigmentation. Also studied for effects on appetite suppression and sexual function through melanocortin receptors.', variants:[{s:'10mg',p:42}], highlights:['Alpha-MSH analogue','Melanogenesis research','Skin pigmentation','Melanocortin effects'] },
  { id:72, name:'GHK-Cu Topical',            cat:'cosmetic',    desc:'GHK-Cu in topical formulation delivers copper peptide complex directly to skin tissue. Research demonstrates collagen stimulation, skin repair, anti-inflammatory effects, and wound healing. Among the most studied peptides for cosmetic research applications.', variants:[{s:'100mg',p:48}], highlights:['Topical copper peptide','Collagen stimulation','Skin repair research','Wound healing effects'] },
  { id:73, name:'Retatrutide (Cosmetic Research)',cat:'cosmetic',desc:'Retatrutide research in cosmetic models focuses on adipose tissue reduction and skin structure changes associated with metabolic improvement. Relevant to body contouring and adipose redistribution research as a triple receptor agonist.', variants:[{s:'10mg',p:120}], highlights:['Triple agonist cosmetic','Adipose reduction','Body contouring research','Skin structure effects'] },
  { id:74, name:'Bacteriostatic Water',      cat:'ancillaries', desc:'Bacteriostatic Water (BW) is sterile water containing 0.9% benzyl alcohol as a bacteriostatic agent that inhibits bacterial growth. Essential for reconstituting lyophilized peptides for research use. Multi-dose vials can be used over 28 days.', variants:[{s:'10ml',p:8},{s:'30ml',p:18}], highlights:['0.9% benzyl alcohol','Multi-dose compatible','Peptide reconstitution','28-day stability'] },
  { id:75, name:'Insulin Syringes (100pk)',  cat:'ancillaries', desc:'31G x 5/16" insulin syringes with permanently attached needles. Designed for subcutaneous injection. The standard choice for research peptide administration. 1mL capacity with 0.01mL graduation for precise dosing.', variants:[{s:'1ml/100pk',p:22}], highlights:['31G x 5/16" needle','0.01mL graduation','Subcutaneous injection','Sterile single-use'] },
  { id:76, name:'Alcohol Prep Pads (200pk)', cat:'ancillaries', desc:'Sterile 70% isopropyl alcohol swabs for vial top and injection site preparation. Individually wrapped and sealed for sterility. Standard requirement for research peptide handling protocols.', variants:[{s:'200pk',p:12}], highlights:['70% isopropyl alcohol','Individually wrapped','Sterile sealed','Standard research protocol'] },
  { id:77, name:'Peptide Reconstitution Kit',cat:'ancillaries', desc:'Complete reconstitution kit including bacteriostatic water, alcohol prep pads, and insulin syringes. Everything needed to reconstitute and administer research peptides. Ensures researchers have all required materials in one order.', variants:[{s:'kit',p:42}], highlights:['Complete kit','BW + syringes + swabs','All-in-one convenience','Research protocol ready'] },
  { id:78, name:'Sharps Container',         cat:'ancillaries', desc:'FDA-approved sharps disposal container for safe needle and syringe disposal. Puncture-resistant, leak-proof container required for research compliance. 1-quart capacity suitable for extended research periods.', variants:[{s:'1qt',p:14}], highlights:['FDA-approved disposal','Puncture-resistant','Leak-proof','Research compliance'] },
  { id:79, name:'Research Log Notebook',    cat:'ancillaries', desc:'Dedicated research log notebook with pre-printed fields for peptide reconstitution records, dosing logs, observation notes, and batch tracking. Supports research documentation compliance and reproducibility.', variants:[{s:'1 notebook',p:18}], highlights:['Pre-printed fields','Batch tracking','Dosing log format','Research documentation'] },
]

function nameToSlug(name) {
  return name.toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function ProductPage({ product }) {
  if (!product) return <div>Product not found.</div>

  const slug = nameToSlug(product.name)
  const categoryLabel = CATS[product.cat] || product.cat
  const priceFrom = product.variants[0]?.p
  const canonicalUrl = `https://aeterionpeptides.com/products/${slug}`

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${product.name} for Research`,
    "description": product.desc,
    "brand": { "@type": "Brand", "name": "Aeterion Labs" },
    "category": categoryLabel,
    "offers": product.variants.map(v => ({
      "@type": "Offer",
      "price": v.p.toFixed(2),
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": canonicalUrl,
    })),
  }

  return (
    <>
      <Head>
        <title>{product.name} for Research | Aeterion Peptides</title>
        <meta name="description" content={`Buy ${product.name} for research. ${product.desc.substring(0, 155)}...`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        {/* Open Graph */}
        <meta property="og:title" content={`${product.name} | Aeterion Peptides`} />
        <meta property="og:description" content={product.desc.substring(0, 200)} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="Aeterion Peptides" />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div style={{ fontFamily: "'DM Sans', Arial, sans-serif", background: '#f8f9fb', minHeight: '100vh' }}>

        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none', color: '#1B3A6B', fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>
            ← AETERION LABS
          </a>
          <a href="/" style={{ background: '#1B3A6B', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            View All Products
          </a>
        </header>

        {/* Breadcrumb */}
        <nav style={{ padding: '12px 24px', maxWidth: 900, margin: '0 auto', fontSize: 13, color: '#6b7280' }}>
          <a href="/" style={{ color: '#4A9FD4', textDecoration: 'none' }}>Home</a>
          {' / '}
          <a href={`/?cat=${product.cat}`} style={{ color: '#4A9FD4', textDecoration: 'none' }}>{categoryLabel}</a>
          {' / '}
          <span style={{ color: '#1B3A6B', fontWeight: 600 }}>{product.name}</span>
        </nav>

        {/* Main Content */}
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 64px' }}>

          {/* Product Header */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '36px', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ background: '#EBF5FE', color: '#1B3A6B', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {categoryLabel}
              </span>
              <span style={{ background: '#F0FDF4', color: '#166534', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                ≥98–99% Purity
              </span>
              <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                For Research Use Only
              </span>
            </div>

            <h1 style={{ margin: '0 0 12px', fontSize: 36, fontWeight: 900, color: '#1B3A6B', letterSpacing: -0.5 }}>
              {product.name}
            </h1>

            <p style={{ margin: '0 0 24px', fontSize: 16, color: '#374151', lineHeight: 1.75 }}>
              {product.desc}
            </p>

            {/* Highlights */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
              {product.highlights.map(h => (
                <span key={h} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                  ✓ {h}
                </span>
              ))}
            </div>

            {/* Pricing */}
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 24 }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#374151' }}>Available Sizes</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                {product.variants.map(v => (
                  <div key={v.s} style={{ border: '2px solid #1B3A6B', borderRadius: 10, padding: '12px 20px', textAlign: 'center', minWidth: 100 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1B3A6B' }}>{v.s}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#1B3A6B', marginTop: 4 }}>${v.p}</div>
                  </div>
                ))}
              </div>
              <a
                href={`/?product=${product.id}`}
                style={{ display: 'inline-block', background: '#1B3A6B', color: '#fff', padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}
              >
                Add to Cart — Starting at ${priceFrom}
              </a>
            </div>
          </div>

          {/* Research Information */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '36px', marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: '#1B3A6B' }}>
              Research Information
            </h2>
            <div style={{ padding: '12px 16px', background: '#FEF3C7', borderRadius: 8, marginBottom: 24, fontSize: 13, color: '#92400E', fontWeight: 500 }}>
              ⚠️ For laboratory research use only. Not for human consumption. Must be 18+. Not evaluated by the FDA.
            </div>
            <p style={{ color: '#6B7280', lineHeight: 1.8, fontSize: 14 }}>
              Full mechanism of action, pharmacology, research overview, and storage information is available on our product detail page. 
              <a href={`/?product=${product.id}`} style={{ color: '#4A9FD4', fontWeight: 600 }}> View complete research profile →</a>
            </p>
          </div>

          {/* Quality Assurance */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '36px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: '#1B3A6B' }}>
              Quality & Shipping
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {[
                ['🧪', 'Third-Party Lab Tested', 'HPLC verified ≥98–99% purity'],
                ['📋', 'COA Included', 'Batch COA with every order'],
                ['❄️', 'Cold-Chain Shipping', 'Temperature-controlled shipping'],
                ['🇺🇸', 'US Domestic', 'Ships within 48 hours from USA'],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ padding: '16px', background: '#F8FAFC', borderRadius: 10 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1B3A6B', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

        </main>

        <footer style={{ background: '#111827', color: 'rgba(255,255,255,0.5)', padding: '24px', textAlign: 'center', fontSize: 12 }}>
          <p style={{ margin: '0 0 8px' }}>© 2025 Aeterion Peptides. All Rights Reserved.</p>
          <p style={{ margin: 0 }}>All products for laboratory research purposes only. Not for human consumption. Must be 18+. Not FDA evaluated.</p>
        </footer>

      </div>
    </>
  )
}

export async function getStaticPaths() {
  const paths = PRODUCTS_META.map(p => ({
    params: { slug: nameToSlug(p.name) }
  }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const product = PRODUCTS_META.find(p => nameToSlug(p.name) === params.slug)
  if (!product) return { notFound: true }
  return {
    props: { product },
    revalidate: 3600, // ISR: regenerate every hour if needed
  }
}
