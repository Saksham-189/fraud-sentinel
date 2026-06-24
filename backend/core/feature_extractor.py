import re
from core.url_intelligence import url_risk_score
URGENCY_KEYWORDS = [
    "urgent", "urgently", "immediately", "asap", "hurry",
    "right away", "within minutes", "limited time", "act fast", "instant",
    "time sensitive", "deadline", "expiring", "last chance", "do not delay",
    "without delay", "critical", "important notice", "right now",
    "act now", "expire soon", "final warning", "final notice",
]
AUTHORITY_KEYWORDS = [
    "rbi", "government", "official", "support team", "customer care",
    "security team", "helpdesk", "authorized", "verified", "headquarters",
    "central bank", "reserve bank", "police", "irs", "tax authority",
    "fraud department", "investigation team", "compliance team", "regulator",
    "law enforcement", "cyber cell", "ministry",
]
AUTHORITY_CONTEXT_KEYWORDS = ["bank"]
FEAR_KEYWORDS = [
    "blocked", "suspended", "restricted", "deactivated", "warning", "locked",
    "terminated", "frozen", "expired", "penalty", "arrest", "legal action",
    "lawsuit", "fine", "banned", "disabled", "unauthorized", "compromised",
    "breached", "hacked", "detected", "flagged", "violation", "criminal",
    "seized", "prosecution", "warrant",
]
CREDENTIAL_KEYWORDS = [
    "otp", "password", "cvv", "verify your", "login credentials",
    "account details", "credit card", "debit card", "card number",
    "security code", "username", "passphrase", "secret",
    "authentication", "2fa", "one time password", "passcode",
    "account number", "ifsc", "iban", "sort code", "routing number",
    "share your pin", "enter your pin", "send your pin",
    "share otp", "send otp", "enter otp",
    "processing fee", "registration fee", "security deposit",
    "refundable fee", "upi id", "wallet address", "send money",
    "transfer the fee", "pay via", "payment link", "bank account details",
]
CREDENTIAL_BOUNDARY_KEYWORDS = ["pin", "verify"]
LINK_KEYWORDS = [
    "click here", "click this", "tap here", "open this", "access here",
    "follow this link", "link below", "redirect",
]
NEGATION_PHRASES = [
    "not ", "no ", "don't ", "dont ", "do not ", "won't ", "wont ",
    "will not ", "never ", "cannot ", "can't ", "cant ", "didn't ",
    "didnt ", "did not ", "haven't ", "havent ", "have not ",
    "isn't ", "isnt ", "is not ", "wasn't ", "wasnt ", "was not ",
    "wouldn't ", "wouldnt ", "would not ", "refuse to ", "declined ",
    "i will not ", "i won't ", "i don't ",
]
NEGATION_SUPPRESSED_CATEGORIES = {
    "credential_intent", "link_risk"
}
NEGATION_WINDOW = 8  # tokens to look back for negation
BANK_SAFE_CONTEXTS = [
    "river bank", "bank holiday", "bank of the river", "food bank",
    "blood bank", "bank account is safe", "bank confirmed",
    "visited the bank", "went to the bank", "at the bank",
    "bank statement", "piggy bank",
]
def _is_negated(text_lower: str, keyword: str) -> bool:
    idx = text_lower.find(keyword)
    if idx < 0:
        return False
    start = max(0, idx - 60)  # ~60 chars covers most negation phrases
    window = text_lower[start:idx]
    for neg in NEGATION_PHRASES:
        if neg in window:
            window_tokens = window.split()
            if len(window_tokens) <= NEGATION_WINDOW:
                return True
    return False
def _has_word_boundary_match(text_lower: str, keyword: str) -> bool:
    pattern = r'\b' + re.escape(keyword) + r'\b'
    return bool(re.search(pattern, text_lower))
def _is_bank_fraud_context(text_lower: str) -> bool:
    for safe_ctx in BANK_SAFE_CONTEXTS:
        if safe_ctx in text_lower:
            return False
    fraud_companions = [
        "security", "blocked", "suspended", "verify", "otp",
        "urgent", "immediately", "team", "department", "alert",
        "unusual", "suspicious", "restricted", "frozen",
    ]
    for companion in fraud_companions:
        if companion in text_lower:
            return True
    institutional = [
        "your bank", "the bank", "our bank", "bank's",
        "from bank", "by bank", "official bank",
    ]
    for phrase in institutional:
        if phrase in text_lower:
            return True
    return False
def keyword_score(text: str, keywords: list, category: str = "",
                  use_boundary: list = None) -> float:
    if not text:
        return 0.0
    text_lower = text.lower()
    use_boundary = use_boundary or []
    count = 0
    negated_count = 0
    for kw in keywords:
        if kw in text_lower:
            if category in NEGATION_SUPPRESSED_CATEGORIES and _is_negated(text_lower, kw):
                negated_count += 1
                continue
            count += 1
    for kw in use_boundary:
        if _has_word_boundary_match(text_lower, kw):
            if category in NEGATION_SUPPRESSED_CATEGORIES and _is_negated(text_lower, kw):
                negated_count += 1
                continue
            count += 1
    if negated_count > 0 and count == 0:
        return 0.05  # Trace signal — keyword present but explicitly negated
    if count == 0:
        return 0.0
    elif count == 1:
        return 0.5
    elif count == 2:
        return 0.75
    else:
        return 1.0
def extract_features(text: str, prev_text: str = None) -> dict:
    if not text or not isinstance(text, str):
        return {
            "urgency": 0.0,
            "authority": 0.0,
            "fear": 0.0,
            "credential_intent": 0.0,
            "link_risk": 0.0
        }
    text_lower = text.lower()
    url_data = url_risk_score(text)
    features = {
        "urgency": keyword_score(text, URGENCY_KEYWORDS, "urgency"),
        "authority": keyword_score(text, AUTHORITY_KEYWORDS, "authority"),
        "fear": keyword_score(text, FEAR_KEYWORDS, "fear"),
        "credential_intent": keyword_score(
            text, CREDENTIAL_KEYWORDS, "credential_intent",
            use_boundary=CREDENTIAL_BOUNDARY_KEYWORDS
        ),
        "link_risk": max(url_data["url_risk"], keyword_score(text, LINK_KEYWORDS, "link_risk")),
        "url_present": 1.0 if url_data["url_present"] else 0.0
    }
    if "bank" in text_lower:
        if _is_bank_fraud_context(text_lower):
            features["authority"] = max(features["authority"], 0.6)
    cred_critical = ["otp", "cvv", "password", "passcode"]
    for kw in cred_critical:
        if kw in text_lower and not _is_negated(text_lower, kw):
            features["credential_intent"] = max(features["credential_intent"], 0.9)
            break
    payment_critical = [
        "processing fee", "registration fee", "security deposit",
        "refundable fee", "upi id", "wallet address", "send money",
        "transfer the fee", "payment link",
    ]
    payment_signal = False
    for kw in payment_critical:
        if kw in text_lower and not _is_negated(text_lower, kw):
            features["credential_intent"] = max(features["credential_intent"], 0.75)
            payment_signal = True
            break
    if payment_signal and any(kw in text_lower for kw in ["now", "today", "immediately", "urgent"]):
        features["urgency"] = max(features["urgency"], 0.6)
    if _has_word_boundary_match(text_lower, "pin") and not _is_negated(text_lower, "pin"):
        features["credential_intent"] = max(features["credential_intent"], 0.85)
    fear_critical = ["blocked", "suspended", "frozen", "locked"]
    for kw in fear_critical:
        if kw in text_lower and not _is_negated(text_lower, kw):
            features["fear"] = max(features["fear"], 0.75)
            break
    urgency_critical = ["urgently", "immediately", "right now", "10 minutes", "within minutes"]
    for kw in urgency_critical:
        if kw in text_lower:
            features["urgency"] = max(features["urgency"], 0.75)
            break
    auth_critical = ["rbi", "official", "security team", "government"]
    for kw in auth_critical:
        if kw in text_lower:
            features["authority"] = max(features["authority"], 0.7)
            break
    if prev_text and isinstance(prev_text, str):
        prev_features = extract_features(prev_text)  # No recursion — prev_text=None default
        if (prev_features.get("authority", 0) >= 0.5 or
                prev_features.get("fear", 0) >= 0.5):
            if features["credential_intent"] >= 0.4:
                features["credential_intent"] = min(features["credential_intent"] + 0.15, 1.0)
    for key, val in features.items():
        if isinstance(val, (int, float)):
            features[key] = max(0.0, min(1.0, float(val)))
    return features
def behavior_score(features: dict) -> float:
    if not features or not isinstance(features, dict):
        return 0.0
    from api.feedback_store import get_dynamic_weights
    from config.config import BEHAVIOR_WEIGHTS as default_weights
    try:
        dynamic_weights = get_dynamic_weights()
    except Exception:
        dynamic_weights = None
    if not dynamic_weights:
        dynamic_weights = default_weights
    score = sum(
        features.get(dim, 0.0) * weight
        for dim, weight in dynamic_weights.items()
    )
    cred = features.get("credential_intent", 0.0)
    urg  = features.get("urgency", 0.0)
    fear = features.get("fear", 0.0)
    auth = features.get("authority", 0.0)
    link = features.get("link_risk", 0.0)
    if cred >= 0.7 and urg >= 0.5:
        score += 0.20
    if fear >= 0.6 and auth >= 0.5:
        score += 0.15
    if urg > 0.4 and fear > 0.4 and cred > 0.4:
        score += 0.10
    if cred >= 0.5 and link >= 0.5:
        score += 0.10
    if auth >= 0.5 and cred >= 0.5 and fear >= 0.5:
        score += 0.10
    return float(min(score, 1.0))
def interpret_behavior(score: float) -> str:
    if score is None:
        return "UNKNOWN"
    if score >= 0.65:
        return "HIGH RISK BEHAVIOR"
    elif score >= 0.35:
        return "MODERATE RISK"
    else:
        return "LOW RISK"
if __name__ == "__main__":
    test_cases = [
        ("Hello, how are you?", "Expected: LOW"),
        ("We noticed unusual activity on your account.", "Expected: LOW-MODERATE"),
        ("This is your bank security team.", "Expected: MODERATE"),
        ("Your account will be blocked. Send OTP now.", "Expected: HIGH"),
        ("URGENT: Your account is suspended! Share OTP immediately to avoid legal action.", "Expected: HIGH"),
        ("I will NOT share my OTP with anyone.", "Expected: LOW (negation)"),
        ("I changed my PIN at the ATM yesterday.", "Expected: LOW (safe context)"),
        ("The bank confirmed my account is safe.", "Expected: LOW (safe context)"),
        ("I was spinning the wheel at the fair.", "Expected: LOW (no false 'pin' match)"),
    ]
    print("=" * 70)
    print("FEATURE EXTRACTOR TEST (v2 - negation + boundary)")
    print("=" * 70)
    for text, expected in test_cases:
        feats = extract_features(text)
        score = behavior_score(feats)
        level = interpret_behavior(score)
        print(f"\nText   : {text}")
        print(f"Score  : {score:.3f}  -> {level}  ({expected})")
        print(f"Signals: {feats}")
