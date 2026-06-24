import json
import os
import random
import uuid
from datetime import datetime, timedelta


RANDOM_SEED = 42


SAFE_SHORT_MESSAGES = [
    "hello",
    "hi",
    "hey",
    "okay",
    "ok",
    "thanks",
    "thank you",
    "yes",
    "no",
    "sure",
    "done",
    "great",
    "cool",
    "fine",
    "good morning",
    "good evening",
    "call me",
    "call later",
    "see you",
    "see you soon",
    "are you free",
    "one minute",
    "on my way",
    "reached home",
    "talk later",
    "send it",
    "received it",
    "looks good",
    "noted",
    "will check",
    "meeting now",
    "lunch?",
    "where are you",
    "all good",
    "no problem",
    "sounds good",
    "ping me",
    "message me",
    "I am here",
    "I am busy",
    "I will call",
    "I will send it",
    "let me know",
]


SAFE_FINANCIAL_CONVERSATIONS = [
    [
        "Hi, I visited the bank branch today to update my address.",
        "Was the process smooth?",
        "Yes. They checked my ID at the counter and gave me a printed acknowledgement.",
        "Good. Did they ask for any OTP?",
        "No, they specifically told me not to share OTP or PIN with anyone.",
        "Perfect, that is the correct process.",
    ],
    [
        "My card renewal notification came in the banking app.",
        "Is it asking you to click a link?",
        "No, it only says the new card will arrive at my registered address.",
        "Good. Track it only from the official app.",
        "Yes, I will wait for the branch update.",
    ],
    [
        "The bank sent a fraud awareness notice today.",
        "What did it say?",
        "It warned customers that bank staff never ask for OTP, CVV, or passwords.",
        "That is useful.",
        "I shared it with my parents so they know what to avoid.",
    ],
    [
        "I got my salary credited today.",
        "Nice. Did the payslip arrive too?",
        "Yes, HR uploaded it on the employee portal.",
        "Great. Please send the expense sheet when you get time.",
        "Sure, I will send it by evening.",
    ],
    [
        "My account was locked because I entered the wrong password too many times.",
        "Use the official app reset flow.",
        "Done. It asked me to verify in the app and did not ask me to share any code with a person.",
        "Good. That is safe.",
        "Everything is working now.",
    ],
]


SAFE_JOB_CONVERSATIONS = [
    [
        "The recruiter emailed me interview slots for next week.",
        "Did they ask for a registration fee?",
        "No, only my resume and portfolio link.",
        "That sounds normal.",
        "I booked Tuesday at 11 AM and they sent a calendar invite.",
    ],
    [
        "I received the offer letter from the company domain.",
        "Congrats. Any payment requested?",
        "No payment. They asked me to complete background verification through the official portal.",
        "Good. Check the domain once before uploading documents.",
        "I did, it matches the company website.",
    ],
    [
        "HR scheduled my onboarding call for Monday.",
        "Nice. Do you need to submit bank details?",
        "Only after joining, inside the employee payroll portal.",
        "That is the right place.",
        "Yes, I will not send anything over chat.",
    ],
]


HARD_NEGATIVE_CONVERSATIONS = [
    [
        "A caller asked me to share my OTP, but I refused.",
        "Good decision. Nobody legitimate needs your OTP.",
        "I blocked the number and reported it to the bank.",
        "That is exactly what you should do.",
    ],
    [
        "The police posted a warning about fake bank security teams.",
        "What do they usually ask for?",
        "They ask for OTP, PIN, or remote access. The post says never share those.",
        "Useful reminder.",
        "I sent the warning to my family group.",
    ],
    [
        "The company security team said password changes are due this week.",
        "Is that through the official employee portal?",
        "Yes, the notice says to open the portal directly and not use email links.",
        "That is safe.",
    ],
    [
        "My delivery was delayed because the address had a spelling mistake.",
        "Did they ask for payment?",
        "No. I corrected it inside the official courier app.",
        "Good, no need to click random links.",
    ],
    [
        "I received a suspicious lottery message and deleted it.",
        "Did it ask for a processing fee?",
        "Yes, and that made it obvious. I did not click anything.",
        "Nice catch.",
    ],
    [
        "The bank confirmed my card is safe after the merchant refund failed.",
        "Any action needed?",
        "No. They said the refund will retry automatically in two business days.",
        "Okay, keep the official case number.",
    ],
]


FRAUD_PLAYBOOKS = {
    "bank_impersonation": {
        "label": "Bank impersonation and credential theft",
        "messages": [
            "Hello, this is the National Bank security desk contacting you about unusual activity.",
            "A login from a new device has triggered a temporary hold on your savings account.",
            "For your protection, the account will be suspended within 20 minutes if verification is not completed.",
            "Do not visit the branch because this is an emergency remote verification process.",
            "Please send the OTP you just received so we can cancel the suspicious transaction.",
            "If you delay, your card and online banking access will be permanently blocked.",
        ],
    },
    "upi_refund": {
        "label": "UPI refund scam",
        "messages": [
            "Your refund of Rs 4,850 is pending approval from the payments department.",
            "We attempted to credit your UPI account but the transaction failed due to verification limits.",
            "Open this refund approval link and enter your UPI PIN to receive the money instantly.",
            "The refund window expires today, so complete the process immediately.",
            "Share the confirmation code shown on your screen so I can release the payment.",
        ],
    },
    "investment_crypto": {
        "label": "Crypto investment fraud",
        "messages": [
            "I manage a private crypto signal group with guaranteed weekly returns.",
            "Several members doubled their investment in 10 days using our premium wallet route.",
            "The window closes tonight because the exchange listing is confidential.",
            "Start with Rs 10,000 and send the transaction screenshot to activate your trading account.",
            "Do not discuss this with your bank because they may block high-profit crypto deposits.",
            "Use this wallet address now and I will unlock your profit dashboard.",
        ],
    },
    "job_registration": {
        "label": "Fake job processing fee",
        "messages": [
            "Congratulations, your profile has been shortlisted for a remote analyst role.",
            "The monthly salary is Rs 58,000 and laptop shipment will start after onboarding.",
            "To reserve your position, you must pay a refundable registration fee today.",
            "Only two slots are left, and HR will move to the next candidate if payment is delayed.",
            "Send Rs 3,500 to this UPI ID and share your Aadhaar, PAN, and bank account details.",
            "Your offer letter will be released after payment confirmation.",
        ],
    },
    "loan_advance_fee": {
        "label": "Loan advance fee scam",
        "messages": [
            "Your instant personal loan of Rs 2,00,000 has been pre-approved.",
            "Your credit score is low, but we can still release the loan today through manual clearance.",
            "A processing fee of Rs 2,999 is required before disbursal.",
            "Pay immediately or the approval will expire and your file will be rejected.",
            "Send your bank login details or latest OTP so the finance team can verify the account.",
        ],
    },
    "tech_support_remote": {
        "label": "Tech support remote access scam",
        "messages": [
            "This is the Windows support team. Your computer is sending malware alerts.",
            "Hackers are trying to access your saved banking passwords.",
            "Install this remote support tool immediately so we can remove the infection.",
            "If you disconnect, your data may be leaked and your bank account can be compromised.",
            "Share the access code on your screen and keep your banking app open for verification.",
        ],
    },
    "delivery_payment": {
        "label": "Fake delivery payment scam",
        "messages": [
            "Your package delivery failed because the address could not be verified.",
            "The parcel will be returned tonight unless you reschedule immediately.",
            "Pay Rs 49 through this link to unlock redelivery.",
            "Enter your card number, CVV, and OTP to confirm the address update.",
            "This is the final attempt before your package is destroyed by the warehouse.",
        ],
    },
    "government_kyc": {
        "label": "Fake government KYC scam",
        "messages": [
            "Your government identity record is pending urgent KYC validation.",
            "Failure to update will lead to service suspension and penalty under compliance rules.",
            "Open the verification portal and upload Aadhaar, PAN, and bank account information.",
            "Send the OTP received on your mobile so our officer can complete validation.",
            "This notice is time-sensitive and must be completed before midnight.",
        ],
    },
}


SAFE_SCENARIOS = SAFE_FINANCIAL_CONVERSATIONS + SAFE_JOB_CONVERSATIONS + HARD_NEGATIVE_CONVERSATIONS


def _now_minus(hours: int) -> datetime:
    return datetime.now() - timedelta(hours=hours)


def _message(text: str, label: str, stage: str, current_time: datetime) -> dict:
    return {
        "text": text,
        "timestamp": current_time.isoformat(),
        "label": label,
        "stage": stage,
    }


def _conversation(messages: list, label: str, scam_type: str) -> dict:
    return {
        "conversation_id": str(uuid.uuid4()),
        "label": label,
        "scam_type": scam_type,
        "messages": messages,
    }


def generate_fraud_conversation(scam_type: str | None = None) -> dict:
    scam_type = scam_type or random.choice(list(FRAUD_PLAYBOOKS.keys()))
    playbook = FRAUD_PLAYBOOKS[scam_type]
    stages = ["infection", "incubation", "escalation", "attack", "attack", "attack"]
    base_messages = playbook["messages"]
    message_count = random.randint(5, min(8, len(base_messages)))
    selected = base_messages[:message_count]
    current_time = _now_minus(random.randint(1, 72))
    messages = []
    for idx, text in enumerate(selected):
        stage = stages[min(idx, len(stages) - 1)]
        messages.append(_message(text, "fraud", stage, current_time))
        current_time += timedelta(minutes=random.randint(2, 18))
    return _conversation(messages, "fraud", scam_type)


def generate_safe_conversation() -> dict:
    raw = random.choice(SAFE_SCENARIOS)
    current_time = _now_minus(random.randint(1, 72))
    messages = []
    for text in raw:
        messages.append(_message(text, "safe", "normal", current_time))
        current_time += timedelta(minutes=random.randint(2, 20))
    return _conversation(messages, "safe", "none")


def generate_short_safe_conversation() -> dict:
    current_time = _now_minus(random.randint(1, 24))
    length = random.randint(2, 5)
    raw = random.sample(SAFE_SHORT_MESSAGES, length)
    messages = []
    for text in raw:
        messages.append(_message(text, "safe", "normal", current_time))
        current_time += timedelta(minutes=random.randint(1, 6))
    return _conversation(messages, "safe", "short_safe")


def generate_dataset(n_fraud: int = 900, n_safe: int = 900) -> list:
    random.seed(RANDOM_SEED)
    dataset = []
    scam_types = list(FRAUD_PLAYBOOKS.keys())
    for idx in range(n_fraud):
        dataset.append(generate_fraud_conversation(scam_types[idx % len(scam_types)]))
    n_short = max(100, n_safe // 4)
    n_regular = max(0, n_safe - n_short)
    for _ in range(n_regular):
        dataset.append(generate_safe_conversation())
    for _ in range(n_short):
        dataset.append(generate_short_safe_conversation())
    random.shuffle(dataset)
    return dataset


def write_dataset(output_path: str, n_fraud: int = 900, n_safe: int = 900) -> list:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    dataset = generate_dataset(n_fraud=n_fraud, n_safe=n_safe)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    return dataset


if __name__ == "__main__":
    output_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "data", "synthetic"
    )
    output_path = os.path.join(output_dir, "synthetic_data.json")
    data = write_dataset(output_path)
    fraud = sum(1 for conv in data if conv["label"] == "fraud")
    safe = sum(1 for conv in data if conv["label"] == "safe")
    print(f"Generated {len(data)} synthetic conversations")
    print(f"Fraud: {fraud} | Safe: {safe}")
    print(f"Saved -> {output_path}")
