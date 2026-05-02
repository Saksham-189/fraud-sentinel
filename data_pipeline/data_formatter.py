import uuid
from datetime import datetime
def create_message(text: str, label: str = "safe", stage: str = "normal") -> dict:
    return {
        "text":      text,
        "timestamp": datetime.now().isoformat(),
        "label":     label,
        "stage":     stage
    }
def create_conversation(messages: list, label: str = None) -> dict:
    if label is None:
        labels = [m.get("label", "safe") for m in messages]
        label  = "fraud" if "fraud" in labels else "safe"
    return {
        "conversation_id": str(uuid.uuid4()),
        "label":           label,
        "messages":        messages
    }
if __name__ == "__main__":
    msgs = [
        create_message("Hello, how are you?",               label="safe",  stage="normal"),
        create_message("Your account has suspicious activity.", label="fraud", stage="infection"),
        create_message("Send OTP immediately.",              label="fraud", stage="attack"),
    ]
    conv = create_conversation(msgs)
    import json
    print(json.dumps(conv, indent=2))