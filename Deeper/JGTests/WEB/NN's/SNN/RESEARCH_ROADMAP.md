# SNN EvoLab research roadmap

## Central research question

Can evolution discover compact spiking controllers whose encoding, neuron
dynamics, and local plasticity jointly produce robust embodied adaptation under
ecological distribution shift?

The project should optimize for interpretable experiments, not raw organism
count. Every claimed improvement must survive repeated seeded trials and an
ablation against simpler controllers.

## Current foundation

- Embodied agents with egocentric directional food, wall, hazard, social, and
  temperature receptors; no privileged absolute coordinates
- Evolved morphology, sensory range/noise/directionality, one-to-three hidden
  layers, neuron count, and inherited realized connection topology
- Explicit energy ledger for morphology, sensing, neurons, wiring, spikes,
  synaptic transfers, movement, senescence, and environmental injury
- Five-member elite archive with raw outcome components, lineage metadata,
  epoch summaries, and elite-descendant extinction recovery
- Agent selection with sensor, motor, neuron, spike-raster, and trajectory views
- Population fitness and phenotype-diversity monitoring
- Single-step execution and versioned JSON experiment snapshots
- Integration coverage for movement, sensor-to-motor propagation, trajectory
  instrumentation, topology inheritance, global metabolic scaling, elite
  ordering, and extinction recovery

## Phase 0 — selection validity

Implemented:

1. Archive candidates before dead agents are removed.
2. Store realized neural edges in the genome and mutate edges explicitly.
3. Refill an extinct population with balanced descendants of the top five
   archived candidates rather than unrelated random founders.
4. Preserve parent IDs, birth epoch, lineage depth, family, raw outcomes, and
   decomposed energy costs.
5. Apply the metabolic control to the complete biological cost ledger and
   report food-energy throughput.

Still required before interpreting elite score as a scientific result:

1. Calibrate the `elite-v1` score against preregistered outcome priorities.
2. Compare strict top-five elitism with family-capped and novelty-preserving
   archives to quantify diversity collapse.
3. Replace deterministic lifespan cutoffs with a documented mortality model,
   or define extinction epochs explicitly as the experimental protocol.
4. Add invariant energy-balance checks and death-cause summaries.

## Phase 1 — reproducible experimental kernel

1. Replace `Math.random()` with an injected seeded PRNG.
2. Use a fixed simulation timestep independent of rendering.
3. Define a versioned experiment configuration and snapshot schema.
4. Add a headless batch runner for at least 30 independent seeds per condition.
5. Save generation-level summaries plus agent genomes, lineages, and spike data.
6. Add deterministic replay from a snapshot and seed.

**Exit criterion:** the same configuration and seed produces byte-equivalent
generation summaries in UI and headless modes.

## Phase 2 — credible spiking substrate

Add evolvable signed synaptic weights, axonal delays, excitatory/inhibitory
identity, bias current, and per-neuron thresholds. Support both adaptive LIF and
Izhikevich neurons behind one interface. Treat sensor encoding and motor
decoding as explicit, evolvable modules.

## Novel candidate — evolution of sensory niches

The immediate novel hypothesis is that resource-costed sensory morphology
causes evolution to discover distinct ecological strategies rather than one
globally optimal controller. Sensor range, directional tuning, and noise should
co-evolve with hidden-layer organization under a fixed energy budget.

Compare:

- privileged absolute coordinates
- fixed egocentric sensors
- freely evolvable egocentric sensors
- evolvable egocentric sensors with metabolic cost

Measure held-out survival, behavioral coverage, niche diversity, information
per spike, and adaptation after food/hazard relocation. This study is tractable
before implementing synaptic plasticity and provides a clear ablation of
embodiment rather than network size alone.

Phase 2 required comparisons:

- LIF versus adaptive LIF versus Izhikevich
- Rate versus latency versus population encoding
- Rate versus first-spike versus voting motor decoding
- Fixed topology versus topology-and-weight evolution

## Phase 3 — evolution plus lifetime learning

Implement three-factor reward-modulated STDP with eligibility traces, then add
inhibitory homeostatic plasticity to prevent runaway excitation. Evolution
should tune initial weights, plasticity constants, and neuromodulatory gain;
experience should tune synapses during an organism's lifetime.

Required ablations:

- Evolution only
- Plasticity only
- Evolution plus STDP
- Evolution plus STDP plus homeostasis
- Non-spiking recurrent-network baseline with matched parameter count

## Phase 4 — quality-diversity ecology

Replace single-objective survivor selection with MAP-Elites or another
quality-diversity archive. Candidate behavior descriptors include:

- exploration coverage
- food-seeking versus social proximity
- risk tolerance in toxic regions
- movement energy efficiency
- spike sparsity
- response latency

Maintain separate training and held-out ecologies. Evaluate robustness after
food relocation, sensor noise, neuron lesions, metabolic shocks, and unseen
temperature fields.

## Phase 5 — mechanistic analysis

Add analysis panels and batch metrics for:

- firing-rate distributions and E/I balance
- branching ratio and avalanche statistics
- Lempel–Ziv spike-train complexity
- sensor–motor mutual information
- transfer entropy and effective connectivity
- lesion sensitivity and causal neuron/synapse interventions
- behavioral repertoire coverage and QD score
- spikes and synaptic operations per unit reward

The interface should let a researcher freeze, lesion, stimulate, or clone a
selected agent and compare the counterfactual rollout beside the original.

## First paper-shaped experiment

**Hypothesis:** co-evolving temporal encoding and neuron model parameters with
reward-modulated plasticity produces smaller controllers that adapt more
quickly to ecological shifts than evolution-only LIF controllers.

**Independent variables:** neuron model, encoding scheme, plasticity condition,
and training ecology.

**Primary outcomes:** held-out survival, adaptation latency, energy efficiency,
behavioral coverage, and spike cost.

**Protocol:** at least 30 seeds per condition; preregistered stopping rule;
reported confidence intervals and effect sizes; matched compute budgets; frozen
held-out worlds.

## Relevant current work

- [Evolving spiking neural networks: neuron models and encoding schemes (2026)](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2026.1697163/full)
- [Stable recurrent dynamics using excitatory and inhibitory plasticity (2025)](https://www.nature.com/articles/s41467-025-60697-2)
- [Mean-field tuning and self-organized quasi-criticality in SNNs (2025)](https://www.nature.com/articles/s41598-025-18004-y)
- [Embodied neuromorphic associative learning in an open-field robot (2025)](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2025.1565780/full)
- [Fast learning through recurrent SNN dynamics (2024)](https://www.nature.com/articles/s41598-024-55769-0)
