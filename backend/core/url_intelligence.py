import re
from urllib.parse import urlparse
def extract_urls(text: str) -> list:
    if not text:
        return []
    url_pattern = r'(https?://[^\s]+|www\.[^\s]+)'
    return re.findall(url_pattern, text)
def url_risk_score(text: str) -> dict:
    urls = extract_urls(text)
    if not urls:
        return {"url_present": False, "url_risk": 0.0}
    max_risk = 0.0
    suspicious_shorteners = [
        "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", 
        "is.gd", "buff.ly", "adf.ly", "bit.do", "cutt.ly"
    ]
    for url in urls:
        risk = 0.0
        if not url.startswith("http"):
            url = "http://" + url
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            if domain.startswith("www."):
                domain = domain[4:]
            if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", domain) or re.match(r"^\d{1,3}(\.\d{1,3}){3}:\d+$", domain):
                risk += 0.8
            if any(domain == sd or domain.endswith("." + sd) for sd in suspicious_shorteners):
                risk += 0.5
            if domain.count(".") > 2:
                risk += 0.3
            if len(url) > 75:
                risk += 0.2
            suspicious_path_words = ["login", "verify", "update", "secure", "account", "banking", "auth", "signin", "password"]
            path_and_query = (parsed.path + parsed.query).lower()
            for word in suspicious_path_words:
                if word in path_and_query:
                    risk += 0.4
                    break
        except Exception:
            risk += 0.5
        max_risk = max(max_risk, risk)
    return {
        "url_present": True,
        "url_risk": min(max_risk, 1.0)
    }
if __name__ == "__main__":
    test_cases = [
        "Please visit https://www.google.com for more info.",
        "URGENT: Verify your account at http://bit.ly/12345xyz",
        "Your account is blocked. Login here: http://192.168.1.1/login.php",
        "Check this out www.secure-update-banking.com/verify"
    ]
    for case in test_cases:
        print(f"Text: {case}")
        print(f"Result: {url_risk_score(case)}\n")