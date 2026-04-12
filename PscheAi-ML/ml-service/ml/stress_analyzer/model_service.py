import numpy as np
import torch
from .loader import tokenizer, bert_model


def get_stress_prob(text: str) -> float:
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128
    )

    with torch.no_grad():
        outputs = bert_model(**inputs)
    logits = outputs.logits
    probs = torch.softmax(logits, dim=1)
    return probs[0][1].item()

def analyze_stress(answers: list) -> dict:

    # Stress Scores
    stress_scores = np.array([get_stress_prob(ans) for ans in answers])

    # Overall Stress (FINAL LOGIC)
    threshold = 0.4
    significant = [s for s in stress_scores if s > threshold]
    ratio = len(significant) / len(stress_scores)
    base_mean = np.mean(stress_scores)
    if ratio == 0:
        overall_stress = float(base_mean * 0.4)
    elif ratio < 0.25:
        overall_stress = float(base_mean * 0.6)
    elif ratio < 0.5:
        overall_stress = float(base_mean * 0.8)
    else:
        overall_stress = float(base_mean)

#  Domain Mapping
    domain_map = {
        "Emotional": [0, 1],
        "Financial": [2, 3],
        "Relationship": [4, 5],
        "Trauma": [6, 7]
    }

    domain_scores = {}

    for domain, indices in domain_map.items():
        domain_scores[domain] = np.mean([stress_scores[i] for i in indices])

    # Step 4: Trauma Negation Fix
    NEGATION_WORDS = ["not", "no", "never", "don't", "doesn't", "isn't"]
    def has_negation(text):
        text = text.lower()
        return any(w in text for w in NEGATION_WORDS)

    trauma_indices = [6, 7]

    negated_trauma = sum(
        1 for i in trauma_indices if has_negation(answers[i])
    )

    if negated_trauma >= 1:
        domain_scores["Trauma"] *= 0.25

    #  Emotional Calibration
    POSITIVE_WORDS = ["calm", "relaxed", "fine", "good", "stable", "okay", "peaceful"]

    def is_positive(text):
        text = text.lower()
        return any(w in text for w in POSITIVE_WORDS)

    emotional_indices = [0, 1]

    positive_count = sum(
        1 for i in emotional_indices
        if is_positive(answers[i]) or has_negation(answers[i])
    )

    if positive_count == 2:
        domain_scores["Emotional"] *= 0.3
    elif positive_count == 1:
        domain_scores["Emotional"] *= 0.6

    # Convert to %

    for domain in domain_scores:
        domain_scores[domain] *= 100

    # Noise Reduction
    for domain in domain_scores:
        if domain_scores[domain] < 25:
            domain_scores[domain] *= 0.4

    # : Clamp Overall with Domain
    base_mean = np.mean(stress_scores)
    max_domain_score = max(domain_scores.values())  # already in %

    max_domain_score /= 100  # convert to 0–1

    # Combine both
    overall_stress = float(
        0.6 * max_domain_score + 0.4 * base_mean
    )

    # Round
    for domain in domain_scores:
        domain_scores[domain] = round(domain_scores[domain], 2)

    #  Sorting
    sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1], reverse=True)
    primary_domain = sorted_domains[0][0]
    second_domain = sorted_domains[1][0]
    max_value = sorted_domains[0][1] / 100
    second_value = sorted_domains[1][1] / 100

    #  Interpretation
    if overall_stress < 0.30:
        interpretation = "Low overall stress detected"

    elif max_value < 0.35:
        interpretation = "Stress appears distributed without a strong dominant external source"

    elif abs(max_value - second_value) < 0.05:
        interpretation = f"Mixed External Stress Pattern: {primary_domain} & {second_domain}"

    else:
        interpretation = f"Primary External Stress Source: {primary_domain}"

    # Indicators
    import re
    from collections import Counter
    STOPWORDS = {
        "i","me","my","we","you","he","she","it","they",
        "and","or","but","the","a","an","to","of","in",
        "is","are","was","were","am","do","does","did",
        "have","has","had","this","that","these","those",
        "dont","not","very","just","feel","time","most"
    }

    combined_text = " ".join(answers).lower()
    words = re.findall(r'\b[a-z]+\b', combined_text)

    filtered_words = [
        w for w in words if w not in STOPWORDS and len(w) > 3
    ]

    top_words = [w for w, _ in Counter(filtered_words).most_common(5)]

    # Final Output
    return {
        "overall_stress": round(overall_stress * 100, 2),
        "external_domains": dict(sorted_domains),
        "interpretation": interpretation,
        "top_indicators": top_words
    }