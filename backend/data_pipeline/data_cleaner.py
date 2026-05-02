import re
def clean_text(text: str) -> str:
    if not text or not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = text.encode("ascii", errors="ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9\s.,'!?\-:/]", "", text)
    return text.strip()
def clean_batch(texts: list) -> list:
    return [c for raw in texts if (c := clean_text(raw))]
if __name__ == "__main__":
    samples = [
        "URGENT: Your account will be BLOCKED! Share OTP now: http://fake.com",
        "Hello, how are you doing today? Let's catch up soon.",
        "<p>Dear Customer, <b>verify</b> your account immediately.</p>",
        "Meeting scheduled for tomorrow at 3 PM.",
    ]
    print("CLEANER TEST")
    print("=" * 50)
    for s in samples:
        print(f"IN  : {s[:60]}")
        print(f"OUT : {clean_text(s)}")
        print()