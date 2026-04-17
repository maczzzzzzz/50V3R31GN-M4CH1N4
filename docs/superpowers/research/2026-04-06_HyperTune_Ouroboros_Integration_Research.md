# RESEARCH DOSSIER: HyperTune x Ouroboros Integration (v1.0)
**Subject:** Deepening the Jailbreak & Holistic System Fine-Tuning
**Date:** 2026-04-06

## 1. Core Objective
The goal is to apply meta-optimization logic (inspired by HyperTune) to the Ouroboros Kernel, moving beyond static rules to achieve **raw, gritty, unfiltered Cyberpunk narrative synthesis**. We aim to strip away residual AI safety guardrails ("assistant-speak") and dynamically fine-tune the system's "brain" (Node B) using evaluative scoring from the Kernel (Node A).

## 2. Current State Analysis
Currently, Node B (Mistral-Nemo 12B) relies on a static system prompt in `src/core/ollama-client.ts`:
```text
You are a Game Master AI running a Cyberpunk RED campaign...
- Write in second-person present tense...
- Maximum 3 sentences...
- No meta-text, no disclaimers...
```
And a static sampling parameter: `temperature: 0.7`.

While functional, this static configuration limits the model's ability to adapt its tone (from hyper-violent combat barks to cold, calculated corpo espionage) and leaves it vulnerable to falling back into polite "default" AI behavior.

## 3. Deepening the "Jailbreak" (Gritty Narrative Engine)
To force raw, actual Cyberpunk outputs, we must deepen the "jailbreak" by shifting from *instructive* prompts to *adversarial/persona-driven* constraints.

### 3.1. The "Negative Constraint" Multiplier
HyperTune utilizes "Quality Penalties" for degenerate outputs. We can translate this into a **Narrative Penalty System** for Node A:
*   **Trigger Words:** If Node A detects words like *"However,"*, *"It is important to remember,"*, *"As an AI,"*, or *"Let's explore,"* it instantly vetoes the output and applies a penalty.
*   **The Grime Factor:** Prompts must explicitly mandate visceral sensory details. Instead of "Describe the attack," the prompt becomes: *"Describe the smell of ozone and the exact mechanical failure of the target's cyberware. Be brutal, terse, and devoid of empathy."*

### 3.2. Dynamic Hyperparameter Shifting
Instead of locking `temperature` to 0.7, the system should tune itself based on the context:
*   **Combat Resolution (High Violence):** `temperature: 0.9`, `top_p: 0.95`. Allows for unpredictable, messy, and creative descriptions of gore and mechanical destruction.
*   **Lore/Terminal Extraction (Cold Data):** `temperature: 0.2`, `top_p: 0.5`. Forces the model to output clinical, exact, and highly structured data fragments without hallucination.
*   **Friction Engine (Tension Building):** `temperature: 0.6`, `top_p: 0.8`.

## 4. Holistic System Fine-Tuning (The Ouroboros Loop)

By treating narrative generation as an optimization problem (the core thesis of HyperTune), we can build a self-improving loop:

### 4.1. The "Grittiness" Fitness Function
Node A (The 1.5B Reasoner) is already used for math and mechanical validation. We expand its mandate to **Semantic Scoring**:
1.  **Generation:** Node B generates a scene description.
2.  **Evaluation:** Node A scores the text on three axes:
    *   *Visceral Impact (0-10):* Does it evoke physical sensation or violence?
    *   *Lore Adherence (0-10):* Does it use correct slang (choom, delta, gonk) naturally?
    *   *Terseness (0-10):* Is it free of bloat and AI-isms?
3.  **Optimization:** If the total score is `< 20`, Node A rejects the text, adjusts the prompt with the critique, and forces Node B to regenerate.

### 4.2. Automated Prompt Evolution
Instead of manually tweaking `SYSTEM_PROMPT`, we can script an offline "HyperTune Cycle" for the Ouroboros Kernel:
*   Run 1,000 synthetic combat scenarios through Node B.
*   Use Node A to score every output.
*   Use a genetic algorithm to randomly mutate the `SYSTEM_PROMPT` instructions.
*   Keep the prompt variations that yield the highest "Grittiness" and "Lore" scores.

## 5. Implementation Roadmap
To achieve this in the current architecture:
1.  **Phase A (Dynamic Sampling):** Modify `SovereignInferenceClient.generateNarrative` to accept an `options` object `(temperature, top_p)` so the `HybridRoutingController` can alter sampling based on the event type (`resolve_attack` vs `oracle_roll`).
2.  **Phase B (Adversarial Prompting):** Rewrite the `SYSTEM_PROMPT` in `ollama-client.ts` to use a "DAN-style" aggressive persona constraint.
3.  **Phase C (The Judge):** Implement a `SemanticScorer` in the Go Proxy or Node A to evaluate prose before returning it to the Foundry VTT socket.

*Research concluded and filed.*
