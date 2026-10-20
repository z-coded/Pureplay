"""English demo profanity policy. Whole-token matching, explicit limitations."""
import re

# Deliberately configurable policy vocabulary, not a claimed toxicity model.
TERMS = {
    "fuck", "fucks", "fucked", "fucking", "fucker", "fuckers",
    "motherfucker", "motherfuckers", "motherfucking",
    "shit", "shits", "shitty", "bullshit", "bitch", "bitches",
    "bastard", "bastards", "asshole", "assholes", "arsehole",
    "cunt", "cunts", "dick", "dicks", "cock", "cocks",
    "pussy", "piss", "pissed", "damn", "goddamn", "whore", "slut",
}


def contains_profanity(text):
    return bool(set(re.findall(r"[a-z]+", text.lower())) & TERMS)


def speech_events(transcript):
    events = []
    for segment in transcript.get("segments", []):
        words = segment.get("words") or []
        flagged = [word for word in words if contains_profanity(word.get("word", ""))]
        if flagged:
            for word in flagged:
                events.append({"start": word["start"], "end": word["end"],
                               "reason": "swearing"})
        elif contains_profanity(segment.get("text", "")):
            events.append({"start": segment["start"], "end": segment["end"],
                           "reason": "swearing"})
    return events
