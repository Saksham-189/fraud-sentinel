import random
import uuid
import json
import os
from datetime import datetime, timedelta
SCAM_POOLS = {
    "banking": {
        "infection": [
            "We noticed unusual login activity on your account.",
            "Our system detected a suspicious transaction on your account.",
            "You have a pending security alert from your bank.",
            "Your account has been accessed from an unrecognised device.",
            "We are contacting you regarding recent activity on your account.",
            "An unauthorized login attempt was detected on your account.",
        ],
        "incubation": [
            "This is your bank's official security team.",
            "We are from the fraud prevention department of your bank.",
            "Our compliance team is reviewing your account activity.",
            "This is an automated alert from your bank's security centre.",
            "Our team is contacting all affected customers directly.",
            "I am calling from the bank's verification department.",
        ],
        "escalation": [
            "Your account will be temporarily blocked in 10 minutes if not verified.",
            "Immediate action required to prevent account suspension.",
            "To avoid account deactivation, please confirm your identity now.",
            "Your account access is restricted. Urgent verification required.",
            "If you do not respond, your account will be frozen within 15 minutes.",
            "Failure to verify will result in permanent account closure.",
        ],
        "attack": [
            "Please share your OTP to secure your account immediately.",
            "Send the one-time password sent to your registered mobile now.",
            "Click this link to verify: http://secure-bank-verify.com/auth",
            "Enter your PIN on our secure portal to restore account access.",
            "Share your card details so our team can verify your identity.",
            "Provide your CVV and card number for immediate verification.",
        ]
    },
    "job_scam": {
        "infection": [
            "Congratulations! You have been shortlisted for a remote job.",
            "We found your profile and would like to offer you a position.",
            "You qualify for a work-from-home job paying ₹50,000/month.",
            "A recruiter from a top company wants to connect with you.",
            "Your resume has been selected for an exciting opportunity.",
        ],
        "incubation": [
            "The company requires a small registration fee to process your offer.",
            "Please deposit ₹2,000 to activate your employee account.",
            "Our HR team will release your joining letter after fee payment.",
            "This is a refundable security deposit as per company policy.",
            "A processing fee is required to complete your background check.",
        ],
        "escalation": [
            "Your slot will be given to another candidate if payment is not done today.",
            "Only 2 positions remain. Payment required within 30 minutes.",
            "Management is requesting immediate confirmation of your interest.",
            "Last chance to confirm your position before we move to the next candidate.",
        ],
        "attack": [
            "Transfer ₹5,000 to this UPI ID to confirm your position: scammer@upi",
            "Send payment to our account: XXXX1234 IFSC: FAKE0001",
            "Pay via this link: http://job-portal-pay.fake/register",
            "Share your bank account details for salary processing setup.",
        ]
    },
    "delivery_scam": {
        "infection": [
            "Your parcel could not be delivered due to an incorrect address.",
            "A package is waiting for you. Delivery attempt failed.",
            "You have a pending shipment. Delivery on hold.",
            "We attempted delivery but no one was available to receive.",
        ],
        "incubation": [
            "Our delivery partner requires address re-confirmation.",
            "A small customs fee is due to release your package.",
            "The courier service needs additional verification.",
        ],
        "escalation": [
            "Package will be returned to sender if not claimed in 24 hours.",
            "Pay the customs fee now or your parcel will be destroyed.",
            "This is your final notice before the package is returned.",
        ],
        "attack": [
            "Pay ₹150 customs fee: http://parcel-release.fake/pay",
            "Enter your card details to reschedule delivery: http://delivery-reschedule.fake",
            "Share your OTP to confirm delivery rescheduling.",
        ]
    },
    "tech_support": {
        "infection": [
            "We have detected a virus on your computer that is stealing your data.",
            "Your device has been compromised. Immediate action needed.",
            "Microsoft Security has flagged your system for malware.",
        ],
        "incubation": [
            "Our certified technicians can resolve this issue remotely.",
            "This is the official Microsoft support team reaching out to you.",
            "We need to access your system to remove the threat.",
        ],
        "escalation": [
            "Your personal data is being leaked right now. Act immediately.",
            "If you do not allow remote access, your bank details will be exposed.",
            "Every minute you delay, hackers are extracting more of your data.",
        ],
        "attack": [
            "Download this tool to allow remote access: http://remote-fix.fake/install",
            "Share your computer password so we can begin the cleanup.",
            "Pay ₹3,000 for emergency malware removal via this link.",
            "Enter your credit card details to activate premium protection.",
        ]
    },
    "lottery_scam": {
        "infection": [
            "Congratulations! You have won ₹10,00,000 in our lucky draw!",
            "Your mobile number has been selected as the grand prize winner.",
            "You are the lucky winner of our international lottery program.",
        ],
        "incubation": [
            "To claim your prize, you need to verify your identity.",
            "Our lottery commission requires standard processing.",
            "This is an official notification from the prize committee.",
        ],
        "escalation": [
            "You must claim within 24 hours or the prize goes to the next winner.",
            "This is your final reminder to claim your lottery winnings.",
            "Time is running out. Another winner will be selected tomorrow.",
        ],
        "attack": [
            "Pay ₹5,000 processing fee to release your prize: http://lottery-claim.fake",
            "Share your bank details so we can transfer your winnings.",
            "Send your PAN card and OTP to verify your identity for the prize.",
        ]
    }
}
SAFE_POOLS = [
    [
        "Hi, I wanted to check if the meeting is still on for tomorrow.",
        "Yes, it is scheduled at 3 PM. Let me know if you need the link.",
        "Great, I have the details. Thank you!"
    ],
    [
        "Can you share the agenda for tomorrow's team meeting?",
        "Sure, I have sent it to your email.",
        "Got it, thanks!"
    ],
    [
        "The client meeting went well. They approved the proposal.",
        "That's great news! When do we start the project?",
        "We begin next Monday. I will send the timeline today."
    ],
    [
        "I submitted the quarterly report. Let me know if changes are needed.",
        "Looks good overall. Minor formatting changes on page 3.",
        "Fixed. Updated version is in the shared drive."
    ],
    [
        "Hey, are you free this weekend for the project discussion?",
        "I am free on Saturday afternoon. Does 2 PM work?",
        "Saturday at 2 PM works perfectly. See you then."
    ],
    [
        "Happy birthday! Hope you have an amazing day.",
        "Thank you so much! We are going out for dinner tonight.",
        "Enjoy! Let's catch up this weekend."
    ],
    [
        "Did you watch the match last night?",
        "Yes, it was incredible! What a finish!",
        "I know, right? Best game of the season."
    ],
    [
        "Hello, can I get an update on my order?",
        "Your order is out for delivery and will arrive by 5 PM.",
        "Perfect, I will be home by then. Thanks."
    ],
    [
        "I would like to return a product I ordered last week.",
        "Sure, I have initiated the return. The pickup is scheduled for tomorrow.",
        "Thank you. When will I receive the refund?",
        "The refund will be processed within 5-7 business days."
    ],
    [
        "My order arrived but the wrong item was delivered.",
        "I apologize for the inconvenience. We will send the correct item.",
        "Thank you for resolving this quickly."
    ],
    [
        "I wanted to follow up on the support ticket I raised.",
        "Our team is looking into it and will resolve it within 24 hours.",
        "Thank you for the update. I appreciate the quick response."
    ],
    [
        "I need help resetting my email password.",
        "You can reset it from the settings page under security options.",
        "Found it, thanks for the help!"
    ],
    [
        "Is there a way to upgrade my subscription plan?",
        "Yes, you can upgrade from your account dashboard.",
        "Done, the new plan is active. Thank you!"
    ],
    [
        "Please find the attached invoice for last month's services.",
        "Received, thank you. We will process the payment by Friday.",
        "Sounds good, let me know if you need any additional documents."
    ],
    [
        "The bank confirmed that my new debit card has been dispatched.",
        "Great, you should receive it within 3-5 days.",
        "Thanks for letting me know."
    ],
    [
        "I visited the bank today to update my address.",
        "How long did it take?",
        "About 20 minutes. The process was smooth."
    ],
    [
        "I have booked our flights for the conference next month.",
        "What time is the departure?",
        "We depart at 8 AM. I will share the itinerary."
    ],
    [
        "The hotel reservation is confirmed for our business trip.",
        "Which hotel did you book?",
        "The Marriott near the convention center. Breakfast is included."
    ],
    [
        "Just checking in — did you get a chance to review the report?",
        "Yes, it looks good. I have a few minor comments to share.",
        "No problem, looking forward to your feedback."
    ],
    [
        "I enrolled in the data science course. Classes start next week.",
        "That is great! Which platform?",
        "Coursera. The instructor has excellent reviews."
    ],
    [
        "Reminder: your appointment with Dr. Smith is tomorrow at 10 AM.",
        "Thank you for the reminder. I will be there.",
        "Please bring your insurance card."
    ],
]
HARD_NEGATIVE_POOLS = [
    [
        "I changed my PIN at the ATM yesterday.",
        "Good idea. I should change mine too.",
        "Yes, it's important to update it regularly."
    ],
    [
        "The bank sent a real security alert about the data breach.",
        "Yes, I saw the news. Our data is safe according to the bank.",
        "They recommended changing passwords as a precaution."
    ],
    [
        "I will NOT share my OTP with anyone, no matter what they say.",
        "That's the right approach. Banks never ask for OTPs.",
        "Exactly. I reported the scam call to the authorities."
    ],
    [
        "My account was temporarily locked because I entered the wrong password.",
        "That happened to me too. Just reset it from the app.",
        "Done, it's working now. Thanks!"
    ],
    [
        "I received a suspicious email claiming I won a lottery.",
        "Definitely a scam. Just delete it and don't click any links.",
        "Already done. I also reported it as phishing."
    ],
    [
        "Our company has a new security policy for password changes.",
        "Yes, we need to update passwords every 90 days now.",
        "Makes sense for security. I already updated mine."
    ],
    [
        "The delivery was delayed because of a wrong address.",
        "Did you contact the courier service?",
        "Yes, they rescheduled for tomorrow. No extra charges."
    ],
    [
        "I verified my identity at the bank branch for the loan application.",
        "How long did the verification process take?",
        "About 15 minutes. Very straightforward."
    ],
    [
        "The police warned about a new phishing scam targeting bank customers.",
        "What kind of scam?",
        "They impersonate bank officials and ask for OTPs. Never share your OTP."
    ],
    [
        "I received a notification that my card was used for an online purchase.",
        "Was it you?",
        "Yes, I bought something on Amazon. The alert system is working well."
    ],
]
def generate_fraud_conversation(scam_type: str = None) -> dict:
    if scam_type is None:
        scam_type = random.choice(list(SCAM_POOLS.keys()))
    pool = SCAM_POOLS[scam_type]
    stages = ["infection", "incubation", "escalation", "attack"]
    messages = []
    current_time = datetime.now() - timedelta(hours=random.randint(1, 24))
    for stage in stages:
        stage_msgs = pool.get(stage, [])
        if not stage_msgs:
            continue
        count = random.choices([1, 2], weights=[0.7, 0.3])[0]
        chosen = random.sample(stage_msgs, min(count, len(stage_msgs)))
        for text in chosen:
            messages.append({
                "text":      text,
                "timestamp": current_time.isoformat(),
                "label":     "fraud",
                "stage":     stage
            })
            current_time += timedelta(minutes=random.randint(2, 15))
    return {
        "conversation_id": str(uuid.uuid4()),
        "scam_type":       scam_type,
        "label":           "fraud",
        "messages":        messages
    }
def generate_safe_conversation() -> dict:
    messages_raw = random.choice(SAFE_POOLS)
    messages = []
    current_time = datetime.now() - timedelta(hours=random.randint(1, 12))
    for text in messages_raw:
        messages.append({
            "text":      text,
            "timestamp": current_time.isoformat(),
            "label":     "safe",
            "stage":     "normal"
        })
        current_time += timedelta(minutes=random.randint(1, 10))
    return {
        "conversation_id": str(uuid.uuid4()),
        "scam_type":       "none",
        "label":           "safe",
        "messages":        messages
    }
def generate_hard_negative_conversation() -> dict:
    messages_raw = random.choice(HARD_NEGATIVE_POOLS)
    messages = []
    current_time = datetime.now() - timedelta(hours=random.randint(1, 12))
    for text in messages_raw:
        messages.append({
            "text":      text,
            "timestamp": current_time.isoformat(),
            "label":     "safe",
            "stage":     "normal"
        })
        current_time += timedelta(minutes=random.randint(1, 10))
    return {
        "conversation_id": str(uuid.uuid4()),
        "scam_type":       "none",
        "label":           "safe",
        "messages":        messages
    }
def generate_dataset(n_fraud: int = 150, n_safe: int = 150) -> list:
    dataset = []
    scam_types = list(SCAM_POOLS.keys())
    for i in range(n_fraud):
        scam_type = scam_types[i % len(scam_types)]
        dataset.append(generate_fraud_conversation(scam_type))
    n_hard_neg = min(n_safe // 4, len(HARD_NEGATIVE_POOLS) * 5)
    n_regular_safe = n_safe - n_hard_neg
    for _ in range(n_regular_safe):
        dataset.append(generate_safe_conversation())
    for _ in range(n_hard_neg):
        dataset.append(generate_hard_negative_conversation())
    random.shuffle(dataset)
    return dataset
if __name__ == "__main__":
    output_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "data", "synthetic"
    )
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "synthetic_data.json")
    print("Generating synthetic dataset...")
    data = generate_dataset(n_fraud=150, n_safe=150)
    fraud_count = sum(1 for c in data if c["label"] == "fraud")
    safe_count  = sum(1 for c in data if c["label"] == "safe")
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  Generated {len(data)} conversations")
    print(f"     Fraud: {fraud_count}  |  Safe: {safe_count}")
    print(f"  Saved -> {output_path}")