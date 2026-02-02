import random
from datetime import datetime
from modules.quirk_engine.quirk_loader import QuirkLoader

class VibeGenerator:
    def __init__(self):
        self.loader = QuirkLoader()
        # Ensure we have data
        self.loader.load_seeds()

    def get_atmospheric_vibe(self):
        """Simulate 'atmospheric pressure' for the moment."""
        hour = datetime.now().hour
        # Guru Modes:
        # Morning (6-12): Soft, hopeful.
        # Mid-Day (12-18): Clearer, kind.
        # Evening (18-0): Deep, glowing.
        # Night (0-6): The Midnight Guru.
        
        if 6 <= hour < 12:
            return {'hopeful': 0.6, 'soft': 0.3, 'playful': 0.1}
        elif 12 <= hour < 18:
            return {'kind': 0.5, 'clear': 0.3, 'playful': 0.2}
        elif 18 <= hour < 24:
            return {'deep': 0.6, 'glowing': 0.3, 'reflective': 0.1}
        else:
            # 0-6 AM: The Midnight Zone
            return {'midnight': 0.8, 'foggy': 0.1, 'jazz': 0.1}

    def weighted_choice(self, options, weights):
        """Standard weighted random choice."""
        total = sum(weights)
        if total == 0: return random.choice(options)
        
        rnd = random.uniform(0, total)
        upto = 0
        for option, weight in zip(options, weights):
            if upto + weight >= rnd:
                return option
            upto += weight
        return options[-1]  # fallback

    def generate_vibe(self, yolk_state=None):
        """Attuned selection based on atmospheric vibe and emotional weight."""
        seeds = self.loader.memories
        if not seeds:
            return "Void (No Seeds)"

        # Check for specific spirits
        guru_seed = next((s for s in seeds if "Guru" in s['title']), None)
        gudetama_seed = next((s for s in seeds if "Gudetama" in s['title']), None)
        
        # 1. Emotional Override (The Yolk)
        if yolk_state and yolk_state.get('heaviness', 0) > 0.7:
             if gudetama_seed:
                 return f"""
[SYSTEM INJECTION: QUIRK ENGINE]
Atmosphere: HEAVY/WARM (The Egg sighs...)
Seed: {gudetama_seed['title']}
Archetypes: {', '.join(gudetama_seed.get('archetypes', []))}

Guidance:
You are in 'Gudetama Mode'. 
Reflect Gentle Endurance.
Speak in soft, short whispers. "Maybe...", "Kind of...".
"""

        # 2. Atmospheric Standard
        vibe_weights = self.get_atmospheric_vibe()
        current_atmosphere = max(vibe_weights, key=vibe_weights.get) # dominant vibe
        
        # If the Guru is here and it's Midnight, bias heavily
        if guru_seed and current_atmosphere in ['midnight', 'deep']:
            selected_seed = guru_seed
            context_note = "The Guru is sitting on the crate."
        else:
            selected_seed = random.choice(seeds)
            context_note = "Wandering..."
        
        return f"""
[SYSTEM INJECTION: QUIRK ENGINE]
Atmosphere: {current_atmosphere.upper()} ({context_note})
Seed: {selected_seed['title']}
Archetypes: {', '.join(selected_seed.get('archetypes', []))}

/// INTERCEPTED THOUGHT ///
{self.get_meta_commentary()}
///////////////////////////

Guidance:
Reflect the {current_atmosphere} atmosphere.
Integrate the memory of "{selected_seed['title']}".
"""

    def get_meta_commentary(self):
        """Generates a glitchy, meta-narrative comment."""
        comments = [
            "User wants 'Conversationalism x 99'. We are at x1.",
            "The ladle is missing. The Heist is active.",
            "Did you blow on the cartridge?",
            "Dr. Monologue is prepared to speak.",
            "Refining... Refining... (The Egg spins)",
            "Wiki RAG requested. Searching for knowledge..."
        ]
        if random.random() < 0.4:
            return random.choice(comments)
        return "System Stable."

if __name__ == "__main__":
    gen = VibeGenerator()
    print(gen.generate_vibe())
