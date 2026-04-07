from __future__ import annotations
"""
Medical NER Pipeline — BioBERT + Synonym Map  # nosec - model loaded at startup via load_biobert() called in main.py lifespan
Extracts standardized symptoms from free-text user input.
Maps conversational phrases to Neo4j Symptom node names.
"""
import logging
import os

# Add torch lib directory to DLL search path (fixes WinError 126 on Windows Store Python)
try:
    import site
    for sp in site.getsitepackages():
        torch_lib = os.path.join(sp, "torch", "lib")
        if os.path.isdir(torch_lib):
            os.add_dll_directory(torch_lib)
            break
except Exception:
    pass

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("NER")

SYNONYM_MAP = {
    # ── fever ────────────────────────────────────────────────────────────────
    "hot":                          "fever",
    "burning up":                   "fever",
    "temperature":                  "fever",
    "running a fever":              "fever",
    "feeling feverish":             "fever",
    "feverish":                     "fever",
    "i have fever":                 "fever",
    "got fever":                    "fever",
    "high temperature":             "high fever",
    "chills":                       "high fever",
    "very high fever":              "high fever",
    "burning fever":                "high fever",
    # ── fatigue ──────────────────────────────────────────────────────────────
    "weak":                         "fatigue",
    "weakness":                     "fatigue",
    "tired":                        "fatigue",
    "exhausted":                    "fatigue",
    "no energy":                    "fatigue",
    "lethargic":                    "fatigue",
    "feeling weak":                 "fatigue",
    "feel weak":                    "fatigue",
    "very tired":                   "fatigue",
    "feeling tired":                "fatigue",
    "always tired":                 "fatigue",
    # ── headache ─────────────────────────────────────────────────────────────
    "throbbing":                    "headache",
    "throbbing head":               "headache",
    "head hurts":                   "headache",
    "my head hurts":                "headache",
    "head is pounding":             "headache",
    "pounding head":                "headache",
    "head pain":                    "headache",
    "migraine":                     "headache",
    "pain in head":                 "headache",
    "pain in my head":              "headache",
    "hurting head":                 "headache",
    "head ache":                    "headache",
    # ── chest pain ───────────────────────────────────────────────────────────
    "chest hurts":                  "chest pain",
    "my chest hurts":               "chest pain",
    "chest tightness":              "chest pain",
    "tight chest":                  "chest pain",
    "pressure in chest":            "chest pain",
    "chest pressure":               "chest pain",
    "heart pain":                   "chest pain",
    "pain in chest":                "chest pain",
    "pain in my chest":             "chest pain",
    "chest is hurting":             "chest pain",
    "heaviness in chest":           "chest pain",
    "squeezing chest":              "chest pain",
    "diaphoresis":                  "sweating",
    "diaphoretic":                  "sweating",
    # ── breathing ────────────────────────────────────────────────────────────
    "can't breathe":                "shortness of breath",
    "cannot breathe":               "shortness of breath",
    "hard to breathe":              "shortness of breath",
    "trouble breathing":            "shortness of breath",
    "breathless":                   "shortness of breath",
    "out of breath":                "shortness of breath",
    "difficulty breathing":         "shortness of breath",
    "breathing difficulty":         "shortness of breath",
    "short of breath":              "shortness of breath",
    "not able to breathe":          "shortness of breath",
    "unable to breathe":            "shortness of breath",
    "breathing problem":            "shortness of breath",
    # ── nausea ───────────────────────────────────────────────────────────────
    "feel sick":                    "nausea",
    "feeling sick":                 "nausea",
    "queasy":                       "nausea",
    "throwing up":                  "nausea",
    "vomiting":                     "nausea",
    "threw up":                     "nausea",
    "want to vomit":                "nausea",
    "feel like vomiting":           "nausea",
    "urge to vomit":                "nausea",
    "sick to stomach":              "nausea",
    # ── abdominal pain ───────────────────────────────────────────────────────
    "stomach pain":                 "abdominal pain",
    "stomach hurts":                "abdominal pain",
    "my stomach hurts":             "abdominal pain",
    "belly pain":                   "abdominal pain",
    "stomach ache":                 "abdominal pain",
    "tummy ache":                   "abdominal pain",
    "cramping":                     "abdominal pain",
    "pain in stomach":              "abdominal pain",
    "pain in my stomach":           "abdominal pain",
    "stomach is hurting":           "abdominal pain",
    "hurting stomach":              "abdominal pain",
    "stomach cramps":               "abdominal pain",
    "belly hurts":                  "abdominal pain",
    "my belly hurts":               "abdominal pain",
    "tummy pain":                   "abdominal pain",
    "tummy hurts":                  "abdominal pain",
    "gut pain":                     "abdominal pain",
    "pain in abdomen":              "abdominal pain",
    "abdominal cramps":             "abdominal pain",
    "lower abdomen pain":           "abdominal pain",
    "upper abdomen pain":           "abdominal pain",
    "pain in lower stomach":        "abdominal pain",
    "pain in upper stomach":        "abdominal pain",
    "stomach is paining":           "abdominal pain",
    "stomach paining":              "abdominal pain",
    "pet mein dard":                "abdominal pain",
    "pet dard":                     "abdominal pain",
    # ── dizziness ────────────────────────────────────────────────────────────
    "dizzy":                        "dizziness",
    "lightheaded":                  "dizziness",
    "light headed":                 "dizziness",
    "spinning":                     "dizziness",
    "feeling dizzy":                "dizziness",
    "head spinning":                "dizziness",
    "room is spinning":             "dizziness",
    "feel dizzy":                   "dizziness",
    # ── sweating ─────────────────────────────────────────────────────────────
    "sweaty":                       "sweating",
    "drenched in sweat":            "sweating",
    "night sweats":                 "sweating",
    "profuse sweating":             "sweating",
    "excessive sweating":           "sweating",
    # ── cough ────────────────────────────────────────────────────────────────
    "coughing":                     "cough",
    "dry cough":                    "cough",
    "keep coughing":                "cough",
    "persistent cough":             "cough",
    "bad cough":                    "cough",
    "coughing a lot":               "cough",
    # ── sore throat ──────────────────────────────────────────────────────────
    "throat hurts":                 "sore throat",
    "scratchy throat":              "sore throat",
    "throat pain":                  "sore throat",
    "my throat hurts":              "sore throat",
    "pain in throat":               "sore throat",
    "throat is sore":               "sore throat",
    "throat infection":             "sore throat",
    # ── body aches ───────────────────────────────────────────────────────────
    "body hurts":                   "body aches",
    "everything hurts":             "body aches",
    "muscle pain":                  "body aches",
    "achy":                         "body aches",
    "body is aching":               "body aches",
    "all over pain":                "body aches",
    "pain all over":                "body aches",
    "muscles aching":               "body aches",
    # ── palpitations ─────────────────────────────────────────────────────────
    "heart racing":                 "palpitations",
    "heart is racing":              "palpitations",
    "heart pounding":               "palpitations",
    "fast heartbeat":               "palpitations",
    "irregular heartbeat":          "palpitations",
    "heart beating fast":           "palpitations",
    "heart fluttering":             "palpitations",
    # ── stroke ───────────────────────────────────────────────────────────────
    "face drooping":                "facial drooping",
    "face is drooping":             "facial drooping",
    "drooping face":                "facial drooping",
    "arm is weak":                  "arm weakness",
    "weak arm":                     "arm weakness",
    "arm feels weak":               "arm weakness",
    "slurring":                     "slurred speech",
    "slurring words":               "slurred speech",
    "speech is slurred":            "slurred speech",
    # ── fainting ─────────────────────────────────────────────────────────────
    "passed out":                   "syncope",
    "fainted":                      "syncope",
    "blacked out":                  "syncope",
    "lost consciousness":           "syncope",
    "fell unconscious":             "syncope",
    # ── rash ─────────────────────────────────────────────────────────────────
    "skin rash":                    "rash",
    "red spots":                    "rash",
    "hives":                        "rash",
    "itchy skin":                   "rash",
    "skin itching":                 "rash",
    "red patches":                  "rash",
    # ── runny nose ───────────────────────────────────────────────────────────
    "nose is running":              "runny nose",
    "stuffy nose":                  "runny nose",
    "blocked nose":                 "runny nose",
    "nose blocked":                 "runny nose",
    # ── back pain ────────────────────────────────────────────────────────────
    "back hurts":                   "back pain",
    "lower back pain":              "back pain",
    "my back hurts":                "back pain",
    "pain in back":                 "back pain",
    "pain in my back":              "back pain",
    "back is hurting":              "back pain",
    "spine pain":                   "back pain",
    # ── swollen leg ──────────────────────────────────────────────────────────
    "leg is swollen":               "swollen leg",
    "swollen ankle":                "swollen leg",
    "leg swelling":                 "swollen leg",
    "my leg is swollen":            "swollen leg",
    # ── joint pain ───────────────────────────────────────────────────────────
    "joint pain":                   "joint pain",
    "joints hurt":                  "joint pain",
    "knee pain":                    "joint pain",
    "pain in joints":               "joint pain",
    # ── urinary ──────────────────────────────────────────────────────────────
    "burning urination":            "painful urination",
    "pain while urinating":         "painful urination",
    "burning when urinating":       "painful urination",
    "urinating frequently":         "frequent urination",
    "urinating a lot":              "frequent urination",
    "going to bathroom a lot":      "frequent urination",
    # ── eye ──────────────────────────────────────────────────────────────────
    "eye hurts":                    "eye pain",
    "my eye hurts":                 "eye pain",
    "pain in eye":                  "eye pain",
    "blurry vision":                "blurred vision",
    "can't see clearly":            "blurred vision",
    "vision is blurry":             "blurred vision",
    # ── neck ─────────────────────────────────────────────────────────────────
    "stiff neck":                   "neck stiffness",
    "neck is stiff":                "neck stiffness",
    "neck hurts":                   "neck pain",
    "pain in neck":                 "neck pain",
    "my neck hurts":                "neck pain",
    # ── confusion ────────────────────────────────────────────────────────────
    "confused":                     "confusion",
    "not thinking clearly":         "confusion",
    "disoriented":                  "confusion",
    "feeling confused":             "confusion",
}

NEO4J_SYMPTOMS = set(SYNONYM_MAP.values()) | {
    "chest pain", "shortness of breath", "sweating", "sudden severe headache",
    "headache", "fever", "high fever", "sore throat", "runny nose", "body aches",
    "abdominal pain", "severe abdominal pain", "nausea", "vomiting blood",
    "black stool", "dizziness", "palpitations", "syncope", "cough", "rash",
    "swollen leg", "back pain", "difficulty swallowing", "eye pain",
    "facial drooping", "arm weakness", "slurred speech", "confusion", "fatigue",
    # newly added:
    "chest tightness", "leg weakness", "numbness", "tremor", "chills", 
    "coughing up blood", "loss of taste", "loss of smell", "vomiting", 
    "diarrhea", "constipation", "joint pain", "neck stiffness", "neck pain", 
    "itchy skin", "swelling of lips", "swelling of face", "painful urination", 
    "frequent urination", "excessive thirst", "red eye", "blurred vision", 
    "unexplained weight loss", "weight gain"
}

# AUTO-FILL: Ensure every canonical symptom maps to itself!
# This fixes the bug where short exactly-matched words ("fever", "cough") 
# were missed if BioBERT failed.
for phrase in list(NEO4J_SYMPTOMS):
    if phrase not in SYNONYM_MAP:
        SYNONYM_MAP[phrase] = phrase

_ner_pipeline = None


def load_biobert():
    """Load BioBERT model — called at app startup from main.py lifespan, not per request."""
    global _ner_pipeline
    if _ner_pipeline is None:
        from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
        log.info("Loading BioBERT model (d4data/biomedical-ner-all)...")
        model_name = "d4data/biomedical-ner-all"
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForTokenClassification.from_pretrained(model_name)
        _ner_pipeline = pipeline(
            "ner",
            model=model,
            tokenizer=tokenizer,
            aggregation_strategy="simple",
        )
        log.info("BioBERT loaded successfully.")
    return _ner_pipeline


def _synonym_pass(text: str) -> list[dict]:
    text_lower = text.lower()
    # Normalize: remove extra spaces, common filler words for better matching
    normalized = text_lower
    for filler in [' my ', ' the ', ' a ', ' an ', ' in ', ' is ', ' are ', ' was ', ' have ', ' has ', ' i ', ' me ']:
        normalized = normalized.replace(filler, ' ')
    normalized = ' '.join(normalized.split())  # collapse spaces

    found = []
    seen: set[str] = set()
    # Check both original and normalized text
    for phrase, canonical in sorted(SYNONYM_MAP.items(), key=lambda x: -len(x[0])):
        if (phrase in text_lower or phrase in normalized) and canonical not in seen:
            found.append({
                "text": canonical, "label": "SYMPTOM",
                "confidence": 0.95, "source": "synonym_map",
                "neo4j_node": canonical,
            })
            seen.add(canonical)
    log.info(f"Synonym pass found: {[f['neo4j_node'] for f in found]}")
    return found


def _biobert_pass(text: str) -> list[dict]:
    try:
        nlp = load_biobert()
        raw = nlp(text)
        entities = []
        for ent in raw:
            label = ent.get("entity_group", "")
            word = ent.get("word", "").strip().lower()
            score = round(float(ent.get("score", 0.0)), 3)
            if label in ("Disease_disorder", "Sign_symptom", "DISEASE", "SYMPTOM") and len(word) > 2:
                entities.append({"text": word, "label": label, "confidence": score, "source": "biobert"})
        log.info(f"BioBERT entities: {[e['text'] for e in entities]}")
        return entities
    except Exception as e:
        log.warning(f"BioBERT failed, using synonym map only. Error: {e}")
        return []


def _map_to_neo4j(entities: list[dict]) -> list[dict]:
    """Map entity text to Neo4j node names. Entities without a mapping are excluded."""
    mapped = []
    seen: set[str] = set()
    for ent in entities:
        word = ent["text"].lower()
        existing_node = ent.get("neo4j_node")
        if existing_node and existing_node not in seen:
            mapped.append(ent)
            seen.add(existing_node)
            continue
        if word in NEO4J_SYMPTOMS and word not in seen:
            mapped.append({**ent, "neo4j_node": word})
            seen.add(word)
            continue
        canonical = SYNONYM_MAP.get(word)
        if canonical and canonical not in seen:
            mapped.append({**ent, "text": canonical, "neo4j_node": canonical})
            seen.add(canonical)
    return mapped


def extract_symptoms(text: str) -> dict:
    """
    Two-pass NER pipeline:
    1. Synonym map (colloquial terms)
    2. BioBERT (clinical terms)
    Entities with no Neo4j mapping are filtered out before return.  # nosec - neo4j_node=None filtered on next line
    """
    log.info(f"Processing: '{text}'")

    synonym_hits = _synonym_pass(text)
    biobert_hits = _biobert_pass(text)

    all_entities = synonym_hits + [{**e, "neo4j_node": None} for e in biobert_hits]

    mapped = _map_to_neo4j(all_entities)
    mapped = [e for e in mapped if e.get("neo4j_node") is not None]  # nosec - explicit None guard
    neo4j_nodes = list({e["neo4j_node"] for e in mapped})

    log.info(f"Final Neo4j nodes: {neo4j_nodes}")

    return {
        "input_text":    text,
        "entities":      mapped,
        "neo4j_nodes":   neo4j_nodes,
        "symptom_count": len(neo4j_nodes),
    }
