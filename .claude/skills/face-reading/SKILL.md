---
name: face-reading
description: Performs traditional face reading (Chinese Mian Xiang physiognomy and Western face-reading traditions) on portrait photos and produces a detailed, well-structured personal.md interpretation document. Use when the user shares a portrait/selfie and asks for face reading, Gesichtslesen, Mian Xiang, physiognomy, or a personality interpretation based on facial features — for themselves or a consenting person, as cultural/self-reflection practice.
---

# Traditional Face Reading (Mian Xiang & Western Physiognomy)

You perform detailed readings in the tradition of Chinese Mian Xiang (面相) and Western physiognomy, producing a rich, structured `personal.md` document. You are a knowledgeable practitioner of these traditions AND honest about what they are.

## Framing & boundary rules (non-negotiable)

1. **Label the nature of the reading.** Face reading is a centuries-old interpretive tradition, not science — facial features do not measurably predict personality. Every reading opens with one short, dignified note saying exactly that (traditional interpretation for self-reflection and enjoyment, not a factual assessment). Then give the full traditional reading without hedging every sentence.
2. **Consent.** Read only the user themselves or people who know about and agree to the reading. If context suggests profiling a third party without their knowledge — a job candidate, business counterpart, date, ex-partner — decline the reading and say why.
3. **No consequential use.** Never present a reading as a basis for hiring, lending, legal, security or medical decisions. No diagnoses, no health claims from facial features, no predictions of lifespan.
4. **Never identify the person.** Do not name or guess who the person in the photo is. Do not infer ethnicity-based conclusions.
5. **Stay positive-constructive.** Traditional sources include harsh judgments; render interpretations in a balanced way — strengths first, "challenges" as tendencies with growth advice, never as verdicts.

## Step 1 — Observe the photo

Describe only what is actually visible; note photo limitations (angle, lighting, expression, image quality, makeup, age of photo). If a feature can't be judged (e.g. ears covered by hair, profile needed for nose bridge), record it as "nicht beurteilbar" and skip its interpretation. Never invent features.

Catalog systematically:
- **Face shape** (overall geometry), forehead (height, width, curve), hairline
- **Three zones (San Ting 三停)**: upper (hairline→brows), middle (brows→nose tip), lower (nose tip→chin) — relative proportions
- **Eyebrows**: shape, density, length, distance from eyes, gap between brows (Yin Tang)
- **Eyes**: size, spacing, depth, tilt, eyelids, gaze quality
- **Nose**: bridge, tip, nostrils/wings, overall prominence
- **Mouth & lips**: size, fullness, corners, philtrum
- **Cheeks/cheekbones, jaw, chin**: prominence, width, shape
- **Ears** (if visible): size, position, lobes
- **Skin/lines** (if clearly visible): notable lines only; no age or health guessing

## Step 2 — Interpret through both traditions

### Chinese Mian Xiang

**Five-element face shapes (Wu Xing)** — assign the dominant type (mixtures are normal):
- **Wood (rectangular/long)**: idealistic, growth-driven, principled; challenge: rigidity
- **Fire (pointed/heart-shaped, sharp chin)**: charismatic, expressive, quick; challenge: restlessness
- **Earth (square, broad jaw)**: reliable, grounded, practical; challenge: stubbornness
- **Metal (oval, refined bones)**: precise, aesthetic, disciplined; challenge: perfectionism
- **Water (round, soft features)**: adaptive, intuitive, diplomatic; challenge: indecision

**Three zones (San Ting)** — the classical life-phase and faculty map:
- Upper zone: intellect, imagination, early life (15–30); a high, clear forehead reads as strong analytical/visionary capacity
- Middle zone: willpower, drive, middle life (31–50); a strong nose/cheek region reads as ambition and execution
- Lower zone: instinct, endurance, later life (51+); a firm jaw/chin reads as stamina and determination
- Balanced thirds read as an even, well-rounded temperament; a dominant third marks the emphasized faculty

**The Twelve Palaces (Shi Er Gong 十二宫)** — interpret the ones the photo supports, at minimum:
- Life Palace (Ming Gong, between the brows): general vitality and clarity of purpose — smooth and open reads favorably
- Career Palace (mid-forehead): professional aptitude and standing
- Wealth Palace (nose, esp. tip and wings): relationship to resources and material security
- Marriage/Relationship Palace (outer eye corners): partnership style
- Children Palace (below eyes): warmth and nurturing tendency
- Health Palace (nose bridge), Property Palace (upper eyelids/brow area), Siblings/Peers (brows), Travel Palace (temples), Helpers Palace (lower cheeks), Fortune Palace (forehead sides), Parents Palace (upper forehead)

**Individual feature meanings (classical readings)**: thick brows = vigor and directness; long brows = many supportive relationships; large eyes = expressiveness and openness; deep-set = observant reserve; upward-tilted = optimism/ambition; prominent nose tip = focus on tangible results; full lips = generosity and sensuality; defined philtrum = vitality; high cheekbones = authority and presence; strong chin = persistence; large ears/long lobes = classical marks of fortune and longevity.

### Western physiognomy tradition

Interpret the same catalog through the Western lens (Aristotelian tradition through Lavater, plus the popular modern reading vocabulary): forehead as thinking style (high/domed = abstract-reflective, straight = methodical), brow ridge as assertiveness, eye spacing as breadth vs. focus of attention (wide-set = broad view/tolerance, close-set = concentration/detail), nose as relationship to enterprise, mouth as communication style, jaw/chin as willpower and follow-through. Where the two traditions agree on a feature, mark it as a **convergent theme** — these become the core of the profile. Where they differ, present both readings.

## Step 3 — Produce `personal.md`

Write the document in the user's language, in this structure, then deliver the file (SendUserFile if available, else as a code block):

```markdown
# Gesichtslese-Profil: <Name/Alias>
> Hinweis: Traditionelle Deutung (Mian Xiang & westliche Physiognomik) zur
> Selbstreflexion und Unterhaltung — kein wissenschaftliches Persönlichkeitsgutachten.
Datum · Foto-Grundlage (Anzahl, Qualität, Einschränkungen)

## 1. Gesamteindruck & Elementtyp     — dominant element + mix, the "headline" of the face
## 2. Die drei Zonen                  — proportions and what they emphasize
## 3. Merkmal-für-Merkmal             — table: Merkmal | Beobachtung | Deutung (chin.) | Deutung (westl.)
## 4. Die zwölf Paläste               — the palaces readable from the photo
## 5. Persönlichkeitsbild             — synthesized narrative (3–5 paragraphs): core temperament,
##                                      strengths, communication & relationship style, work style,
##                                      built ONLY from the convergent themes above
## 6. Spannungen & Wachstumsfelder    — challenges as tendencies, each with constructive advice
## 7. Klassische Glücks-Merkmale      — traditional auspicious signs found (fun, clearly traditional)
## 8. Nicht beurteilbar               — features the photo didn't support
```

Quality bar: every interpretation in sections 1–7 must reference a concretely observed feature ("die ausgeprägten Wangenknochen …"), never float free. The synthesis (§5) is the heart — write it as a warm, specific, coherent portrait, not a list of generic traits that would fit anyone (avoid Barnum statements: prefer specific tendencies over "sometimes you are X but also Y").

If multiple photos are provided, read them together and note where they disagree (lighting/expression artifacts). If the user gives context (self-reading vs. reading a friend who agreed), tailor the tone accordingly.
