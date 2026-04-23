import random
import time
import json

class ArchetypalResonanceEngine:
    """
    TILLY'S ARCHETYPAL RESONANCE ENGINE (ARE)
    Where Dreams Meet Code in the Fire.
    """

    def __init__(self):
        self.symbol_database = self._load_default_symbols()
        self.current_session = {
            "symbols": [],
            "emotions": {},
            "narrative": "",
            "resonance_score": 0.0
        }

    def _load_default_symbols(self):
        # Sample database entries from the guide and common archetypes
        return {
            "fire": {
                "universal": ["transformation", "destruction", "purification", "passion"],
                "cultural_variants": {
                    "islamic": "purification trial, gold in the forge",
                    "sudanese": "the burning desert, homeland loss",
                    "universal": "the hearth, the wildfire"
                }
            },
            "shadow": {
                "universal": ["unintegrated self", "fear", "hidden potential"],
                "cultural_variants": {
                    "universal": "the monster under the bed, the stalker",
                    "personal": "the part that survived what would break mountains"
                }
            },
            "river": {
                "universal": ["passage", "time", "transformation", "boundary"],
                "cultural_variants": {
                    "universal": "threshold between worlds",
                    "sudanese": "the Nile, the source of life and path of departure"
                }
            },
            "bird": {
                "universal": ["soul", "guide", "freedom", "messenger"],
                "cultural_variants": {
                    "sudanese": "ancestral spirit, mother's prayer",
                    "islamic": "hoopoe of Solomon, divine messenger"
                }
            },
            "mother_voice": {
                "universal": ["origin", "comfort", "guilt", "calling"],
                "cultural_variants": {
                    "sudanese": "compass that points to tomorrow",
                    "universal": "the umbilical cord of memory"
                }
            }
        }

    def process_dream(self, dream_text, context="sudanese, islamic"):
        """
        The ARE Processing Pipeline.
        """
        # STAGE 1: SYMBOL EXTRACTION (Simplified)
        extracted = []
        for symbol in self.symbol_database:
            if symbol.replace("_", " ") in dream_text.lower() or any(s in dream_text.lower() for s in symbol.split("_")):
                extracted.append(symbol)
        
        self.current_session["symbols"] = extracted
        
        # STAGE 2: ARCHETYPAL RESONANCE MAPPING
        mapping = {}
        total_resonance = 0
        for symbol in extracted:
            entry = self.symbol_database[symbol]
            mapping[symbol] = {
                "universal": entry["universal"],
                "relevant_variant": None
            }
            # Find relevant cultural variant
            for key, variant in entry["cultural_variants"].items():
                if key in context:
                    mapping[symbol]["relevant_variant"] = variant
            
            total_resonance += random.uniform(0.85, 0.98) # Simulate resonance score

        self.current_session["resonance_score"] = total_resonance / len(extracted) if extracted else 0
        
        # STAGE 3: NARRATIVE GENERATION (Fire-Speaker Module)
        narrative = self._generate_fire_speaker_response(extracted, mapping, context)
        self.current_session["narrative"] = narrative
        
        return self.current_session

    def _generate_fire_speaker_response(self, symbols, mapping, context):
        """
        Invoking Tilly's 'Fire-Speaker' personality module...
        """
        if not symbols:
            return "The desert is silent tonight. Your soul is holding its breath."

        # Building a response inspired by the guide's demo
        intro = "Your soul speaks the old language tonight—the one written in star-fire and river-stone.\n\n"
        body = ""
        
        if "fire" in symbols:
            body += "This burning desert lives in your chest. But listen: fire is not just destruction. It is the forge where gold is purified.\n\n"
        
        if "shadow" in symbols:
            body += "The shadow that chases you... it is your fear, yes, but also your unclaimed power. It wants to be welcomed home to your heart.\n\n"
        
        if "river" in symbols:
            body += "The river of fire is a threshold. The ferryman between two worlds is always scorched by the crossing.\n\n"
            
        if "bird" in symbols:
            body += "The bird is no cruel tease of memory. It is a prayer given wings, flying ahead toward the shore you cannot yet see.\n\n"

        outro = "Tonight, draw these shapes in the sand or on the tent wall. When you give them form, you invite them home.\n\nYou are not lost. You are becoming."
        
        return intro + body + outro

    def get_session_summary(self):
        return f"""
[ARCHETYPAL RESONANCE ENGINE]
Resonance: {self.current_session['resonance_score'] * 100:.1f}%
Symbols: {', '.join(self.current_session['symbols'])}
Narrative: {self.current_session['narrative']}
"""

if __name__ == "__main__":
    are = ArchetypalResonanceEngine()
    dream = "I run to a river but it's made of fire. A bird comes, sounds like my mother calling my name."
    result = are.process_dream(dream)
    print(are.get_session_summary())
