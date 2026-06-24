import csv
import hashlib
import json
import os
import random
import sys
import tarfile
from collections import Counter, defaultdict
from datetime import datetime
from email import policy
from email.parser import BytesParser


_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from config.config import (  # noqa: E402
    RAW_DIR,
    PROCESSED_DIR,
    SYNTHETIC_DIR,
    SYNTHETIC_FRAUD_COUNT,
    SYNTHETIC_SAFE_COUNT,
    RANDOM_SEED,
)
from data_pipeline.data_cleaner import clean_text  # noqa: E402
from data_pipeline.synthetic_data_generator import (  # noqa: E402
    HARD_NEGATIVE_CONVERSATIONS,
    SAFE_SHORT_MESSAGES,
    write_dataset,
)

_csv_limit = sys.maxsize
while True:
    try:
        csv.field_size_limit(_csv_limit)
        break
    except OverflowError:
        _csv_limit = int(_csv_limit / 10)


PHISHING_CSV = os.path.join(RAW_DIR, "phishing.csv")
ENRON_CSV = os.path.join(RAW_DIR, "enron.csv")
EXTERNAL_DIR = os.path.join(RAW_DIR, "external")
REAL_OUTPUT = os.path.join(PROCESSED_DIR, "real_data.json")
VALIDATION_OUTPUT = os.path.join(PROCESSED_DIR, "validation_data.json")
MANIFEST_OUTPUT = os.path.join(PROCESSED_DIR, "dataset_manifest.json")
SYNTHETIC_OUTPUT = os.path.join(SYNTHETIC_DIR, "synthetic_data.json")

MAX_CHARS = 3500
MAX_PER_CLASS = 75_000
VALIDATION_PER_CLASS = 7_500
SOURCE_LIMITS = {
    "legacy_phishing_csv": {"fraud": 28_000, "safe": 28_000},
    "legacy_enron_csv": {"safe": 35_000},
    "spamassassin_ham": {"safe": 20_000},
    "spamassassin_spam": {"fraud": 20_000},
    "openphish": {"fraud": 15_000},
    "phreshphish": {"fraud": 30_000, "safe": 30_000},
    "curated_short_safe": {"safe": 5_000},
    "curated_hard_negative": {"safe": 5_000},
}
TEXT_COLUMNS = ["text", "message", "email_text", "body", "content", "payload"]
SUBJECT_COLUMNS = ["subject", "title"]
URL_COLUMNS = ["url", "urls", "final_url", "domain"]
LABEL_COLUMNS = ["label", "labels", "class", "target", "status", "is_phishing", "phish", "benign"]


def _now() -> str:
    return datetime.now().isoformat()


def _stable_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def _trim(text: str) -> str:
    text = text.strip()
    return text[:MAX_CHARS]


def _label_from_value(value, default: str | None = None) -> str | None:
    if value is None:
        return default
    raw = str(value).strip().lower()
    if raw in {"1", "true", "yes", "y", "fraud", "phish", "phishing", "malicious", "spam", "blocked"}:
        return "fraud"
    if raw in {"0", "false", "no", "n", "safe", "ham", "benign", "legitimate", "clean", "normal"}:
        return "safe"
    return default


def _row_label(row: dict, default: str | None = None) -> str | None:
    for col in LABEL_COLUMNS:
        if col in row and row.get(col) not in (None, ""):
            label = _label_from_value(row.get(col))
            if label:
                if "benign" in col.lower() and str(row.get(col)).strip().lower() in {"1", "true", "yes"}:
                    return "safe"
                return label
    return default


def _compose_row_text(row: dict) -> str:
    parts = []
    for col in SUBJECT_COLUMNS:
        value = row.get(col)
        if value:
            parts.append(f"Subject: {value}")
    for col in TEXT_COLUMNS:
        value = row.get(col)
        if value:
            parts.append(str(value))
            break
    url_bits = []
    for col in URL_COLUMNS:
        value = row.get(col)
        if value:
            url_bits.append(str(value))
    if url_bits:
        parts.append("URLs: " + " ".join(url_bits[:3]))
    return "\n".join(parts)


def _extract_email_text(data: bytes) -> str:
    try:
        msg = BytesParser(policy=policy.default).parsebytes(data)
        subject = msg.get("subject", "")
        bodies = []
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                disposition = part.get_content_disposition()
                if content_type == "text/plain" and disposition != "attachment":
                    try:
                        bodies.append(part.get_content())
                    except Exception:
                        continue
        else:
            try:
                bodies.append(msg.get_content())
            except Exception:
                bodies.append(data.decode("utf-8", errors="ignore"))
        body = "\n".join(str(item) for item in bodies if item)
        return "\n".join(part for part in [f"Subject: {subject}" if subject else "", body] if part)
    except Exception:
        return data.decode("utf-8", errors="ignore")


class DatasetBuilder:
    def __init__(self):
        self.records = {}
        self.conflicts = set()
        self.source_counts = Counter()
        self.label_counts = Counter()
        self.skipped = Counter()
        self.source_label_counts = defaultdict(Counter)

    def _limit_reached(self, source: str, label: str) -> bool:
        source_limit = SOURCE_LIMITS.get(source, {}).get(label)
        if source_limit is None:
            return False
        return self.source_label_counts[source][label] >= source_limit

    def source_complete(self, source: str) -> bool:
        limits = SOURCE_LIMITS.get(source, {})
        if not limits:
            return False
        return all(self.source_label_counts[source][label] >= limit for label, limit in limits.items())

    def add(self, text: str, label: str, source: str, stage: str = "normal", priority: bool = False) -> bool:
        if label not in {"safe", "fraud"}:
            self.skipped[f"{source}:bad_label"] += 1
            return False
        if self._limit_reached(source, label):
            self.skipped[f"{source}:source_limit"] += 1
            return False
        cleaned = clean_text(_trim(text or ""))
        if len(cleaned) < 2:
            self.skipped[f"{source}:empty"] += 1
            return False
        digest = _stable_hash(cleaned)
        if digest in self.conflicts:
            self.skipped[f"{source}:known_conflict"] += 1
            return False
        existing = self.records.get(digest)
        if existing:
            if existing["label"] != label:
                del self.records[digest]
                self.conflicts.add(digest)
                self.skipped[f"{source}:label_conflict"] += 1
            else:
                self.skipped[f"{source}:duplicate"] += 1
            return False
        self.records[digest] = {
            "text": cleaned,
            "timestamp": _now(),
            "label": label,
            "stage": stage,
            "source": source,
            "priority": priority,
        }
        self.source_counts[source] += 1
        self.label_counts[label] += 1
        self.source_label_counts[source][label] += 1
        return True

    def values(self) -> list:
        return list(self.records.values())


def ingest_csv(builder: DatasetBuilder, path: str, source: str, default_label: str | None = None):
    if not os.path.exists(path):
        builder.skipped[f"{source}:missing_file"] += 1
        return
    with open(path, encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if builder.source_complete(source):
                break
            label = _row_label(row, default=default_label)
            if not label:
                builder.skipped[f"{source}:unknown_label"] += 1
                continue
            text = _compose_row_text(row)
            stage = "attack" if label == "fraud" else "normal"
            builder.add(text, label, source, stage=stage)


def ingest_spamassassin(builder: DatasetBuilder):
    if not os.path.isdir(EXTERNAL_DIR):
        return
    archives = [name for name in os.listdir(EXTERNAL_DIR) if name.startswith("spamassassin_") and name.endswith(".tar.bz2")]
    for name in archives:
        path = os.path.join(EXTERNAL_DIR, name)
        is_ham = "ham" in name
        is_spam = "spam" in name
        if not is_ham and not is_spam:
            continue
        label = "safe" if is_ham else "fraud"
        source = "spamassassin_ham" if is_ham else "spamassassin_spam"
        stage = "normal" if label == "safe" else "attack"
        try:
            with tarfile.open(path, "r:bz2") as tar:
                for member in tar:
                    if builder.source_complete(source):
                        break
                    if not member.isfile():
                        continue
                    extracted = tar.extractfile(member)
                    if not extracted:
                        continue
                    text = _extract_email_text(extracted.read())
                    builder.add(text, label, source, stage=stage)
        except Exception as exc:
            builder.skipped[f"{source}:archive_error:{type(exc).__name__}"] += 1


def ingest_openphish(builder: DatasetBuilder):
    path = os.path.join(EXTERNAL_DIR, "openphish_feed.txt")
    if not os.path.exists(path):
        builder.skipped["openphish:missing_file"] += 1
        return
    with open(path, encoding="utf-8", errors="ignore") as f:
        for line in f:
            if builder.source_complete("openphish"):
                break
            url = line.strip()
            if not url:
                continue
            text = f"Known phishing URL reported by OpenPhish: {url}"
            builder.add(text, "fraud", "openphish", stage="attack")


def _phresh_columns(schema_names: list[str]) -> list[str]:
    wanted = []
    lower_to_real = {name.lower(): name for name in schema_names}
    for col in LABEL_COLUMNS + TEXT_COLUMNS + SUBJECT_COLUMNS + URL_COLUMNS:
        if col.lower() in lower_to_real:
            wanted.append(lower_to_real[col.lower()])
    return sorted(set(wanted)) or schema_names


def _phresh_text(row: dict) -> str:
    parts = []
    for col in SUBJECT_COLUMNS:
        if row.get(col):
            parts.append(str(row[col]))
    for col in URL_COLUMNS:
        if row.get(col):
            parts.append("URL: " + str(row[col]))
            break
    for col in TEXT_COLUMNS:
        if row.get(col):
            parts.append(str(row[col]))
            break
    return "\n".join(parts)


def ingest_phreshphish(builder: DatasetBuilder):
    data_dir = os.path.join(EXTERNAL_DIR, "phreshphish", "data")
    if not os.path.isdir(data_dir):
        builder.skipped["phreshphish:missing_dir"] += 1
        return
    try:
        import pyarrow.parquet as pq
    except Exception:
        builder.skipped["phreshphish:pyarrow_missing"] += 1
        return
    for name in sorted(os.listdir(data_dir)):
        if not name.endswith(".parquet"):
            continue
        path = os.path.join(data_dir, name)
        try:
            parquet = pq.ParquetFile(path)
            columns = _phresh_columns(parquet.schema.names)
            for batch in parquet.iter_batches(batch_size=2048, columns=columns):
                data = batch.to_pylist()
                for row in data:
                    if builder.source_complete("phreshphish"):
                        break
                    normalized = {str(k).lower(): v for k, v in row.items()}
                    label = _row_label(normalized)
                    if not label:
                        builder.skipped["phreshphish:unknown_label"] += 1
                        continue
                    text = _phresh_text(normalized)
                    stage = "attack" if label == "fraud" else "normal"
                    builder.add(text, label, "phreshphish", stage=stage)
        except Exception as exc:
            builder.skipped[f"phreshphish:read_error:{type(exc).__name__}"] += 1


def ingest_curated_safety(builder: DatasetBuilder):
    for message in SAFE_SHORT_MESSAGES:
        builder.add(message, "safe", "curated_short_safe", stage="normal", priority=True)
    for conversation in HARD_NEGATIVE_CONVERSATIONS:
        for message in conversation:
            builder.add(message, "safe", "curated_hard_negative", stage="normal", priority=True)


def balance_and_split(records: list[dict]) -> tuple[list[dict], list[dict], dict]:
    random.seed(RANDOM_SEED)
    groups = {
        "safe": [record for record in records if record["label"] == "safe"],
        "fraud": [record for record in records if record["label"] == "fraud"],
    }
    for group in groups.values():
        random.shuffle(group)
    target_per_class = min(MAX_PER_CLASS, len(groups["safe"]), len(groups["fraud"]))
    if target_per_class <= 0:
        return [], [], {"target_per_class": 0, "reason": "missing_class"}

    selected = {}
    for label, group in groups.items():
        priority = [record for record in group if record.get("priority")]
        regular = [record for record in group if not record.get("priority")]
        random.shuffle(priority)
        random.shuffle(regular)
        selected[label] = (priority + regular)[:target_per_class]

    validation_per_class = min(VALIDATION_PER_CLASS, max(250, target_per_class // 10))
    training = []
    validation = []
    for label, group in selected.items():
        random.shuffle(group)
        validation.extend(group[:validation_per_class])
        training.extend(group[validation_per_class:])
    random.shuffle(training)
    random.shuffle(validation)
    summary = {
        "target_per_class": target_per_class,
        "validation_per_class": validation_per_class,
        "training_records": len(training),
        "validation_records": len(validation),
    }
    return training, validation, summary


def _conversation_from_messages(messages: list[dict], conversation_id: str) -> dict:
    label = "fraud" if any(msg.get("label") == "fraud" for msg in messages) else "safe"
    serializable = []
    for msg in messages:
        item = {key: value for key, value in msg.items() if key != "priority"}
        serializable.append(item)
    return {
        "conversation_id": conversation_id,
        "label": label,
        "messages": serializable,
    }


def write_outputs(builder: DatasetBuilder):
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    os.makedirs(SYNTHETIC_DIR, exist_ok=True)
    training, validation, balance_summary = balance_and_split(builder.values())
    with open(REAL_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(_conversation_from_messages(training, "balanced-real-training"), f, indent=2)
    with open(VALIDATION_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(_conversation_from_messages(validation, "balanced-real-validation"), f, indent=2)

    synthetic = write_dataset(
        SYNTHETIC_OUTPUT,
        n_fraud=SYNTHETIC_FRAUD_COUNT,
        n_safe=SYNTHETIC_SAFE_COUNT,
    )
    synthetic_messages = sum(len(conv.get("messages", [])) for conv in synthetic)
    actual_source_counts = Counter(record["source"] for record in builder.values())
    actual_label_counts = Counter(record["label"] for record in builder.values())
    actual_source_label_counts = defaultdict(Counter)
    for record in builder.values():
        actual_source_label_counts[record["source"]][record["label"]] += 1
    manifest = {
        "generated_at": _now(),
        "outputs": {
            "real_training": REAL_OUTPUT,
            "validation": VALIDATION_OUTPUT,
            "synthetic": SYNTHETIC_OUTPUT,
        },
        "raw_records_after_dedupe": len(builder.values()),
        "source_counts_after_dedupe": dict(actual_source_counts),
        "label_counts_after_dedupe": dict(actual_label_counts),
        "source_label_counts_after_dedupe": {
            source: dict(counts) for source, counts in actual_source_label_counts.items()
        },
        "skipped": dict(builder.skipped),
        "dedupe_conflicts": len(builder.conflicts),
        "balance": balance_summary,
        "synthetic_conversations": len(synthetic),
        "synthetic_messages": synthetic_messages,
    }
    with open(MANIFEST_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    return manifest


def run():
    print("\n" + "=" * 72)
    print("FRAUD SENTINEL - NORMALIZED DATA PIPELINE")
    print("=" * 72)
    builder = DatasetBuilder()
    print("[1/7] Ingesting curated safe short messages and hard negatives...")
    ingest_curated_safety(builder)
    print("[2/7] Ingesting legacy phishing CSV...")
    ingest_csv(builder, PHISHING_CSV, "legacy_phishing_csv")
    print("[3/7] Ingesting legacy Enron CSV...")
    ingest_csv(builder, ENRON_CSV, "legacy_enron_csv", default_label="safe")
    print("[4/7] Ingesting SpamAssassin archives...")
    ingest_spamassassin(builder)
    print("[5/7] Ingesting OpenPhish feed...")
    ingest_openphish(builder)
    print("[6/7] Ingesting PhreshPhish parquet shards...")
    ingest_phreshphish(builder)
    print("[7/7] Balancing, splitting, and writing outputs...")
    manifest = write_outputs(builder)
    print("\nPipeline complete.")
    print(f"  Raw records after dedupe : {manifest['raw_records_after_dedupe']}")
    print(f"  Training records         : {manifest['balance']['training_records']}")
    print(f"  Validation records       : {manifest['balance']['validation_records']}")
    print(f"  Synthetic conversations  : {manifest['synthetic_conversations']}")
    print(f"  Manifest                 : {MANIFEST_OUTPUT}")


if __name__ == "__main__":
    run()
