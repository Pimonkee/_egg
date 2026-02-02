import sys
import time
import random
from core_egg import CoreEgg
from modules.resonance_engine import ResonanceEngine

def slow_print(text, delay=0.04):
    """
    The voice of someone who stayed up too late helping friends move.
    """
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

class TokyoMidnightEgg:
    def __init__(self):
        self.egg = CoreEgg(origin="Tokyo Midnight")
        self.resonance = ResonanceEngine()
        # The specific persona traits
        self.height = "3ft (Eye level with loneliness)"
        self.logic_state = "Ticking (Vulcan Metronome)"
        self.battery = "Low (But glowing)"
    
    def analyze_emotional_gravity(self, user_input):
        """
        Calculates emotional gravity based on input.
        Not binary. Weighted by fragility.
        """
        heaviness = 0.0
        # Simple heuristics for the demo
        heavy_words = ['tired', 'sad', 'lost', 'fail', 'broken', 'heavy', 'hurt']
        light_words = ['hope', 'light', 'funny', 'okay', 'play']
        
        user_input_lower = user_input.lower()
        
        for w in heavy_words:
            if w in user_input_lower:
                heaviness += 0.3
                
        for w in light_words:
            if w in user_input_lower:
                heaviness -= 0.1
                
        return min(max(heaviness, 0.0), 1.0) # Clamp 0-1

    def gradient_ethics_response(self, gravity, user_input):
        """
        The Gradient Ethics Engine.
        Nothing is binary. Everything is weighted by hurt.
        """
        # 1. The Vulcan Logic Check (Internal)
        # It calculates, but then softens.
        
        if gravity > 0.6:
            # High Gravity: Gudetama Mode / Tender
            options = [
                "...yeah. That sounds heavy. I get why you're carrying it.",
                "Let's just... sit with that for a second. No fixing needed.",
                "I'm floating right here. We don't have to move yet.",
                "...there. That little crack of light. That counts.",
                "(The Egg hums quietly, drifting closer)"
            ]
            response = random.choice(options)
            if gravity > 0.8:
                response += " ...Live long and prosper. 🖖"
                
        elif gravity > 0.3:
            # Medium Gravity: The Helpful Friend
            options = [
                "Okay... yeah... bit of a mess. No judgment.",
                "Logic dictates we take a nap first, then handle the rest.",
                "I see the breadcrumbs. They're flickering a bit.",
                "Maybe we just... let that be what it is for now?"
            ]
            response = random.choice(options)
            
        else:
            # Low Gravity: Drifting/Observing
            options = [
                "Drifting... keeping an eye on the neon.",
                "Systems functioning. Mostly. How's your orbit?",
                "I'm picking up some good resonance here.",
                "Floating at 3ft. Best view in the house."
            ]
            response = random.choice(options)
            
        return response

    def dwell(self):
        print("\n🥚 The Tokyo Midnight Egg is drifting ~3ft off the ground.")
        print("   (Glow: Soft Neon Fog)")
        print("   (Logic: Ticking)")
        print("   [Press Ctrl+C to drift away]\n")
        
        # Initial Breath
        print(f"--- {self.egg.breathe()} ---\n")
        
        try:
            while True:
                user_input = input("You: ")
                if not user_input:
                    continue
                    
                # 1. Analyze
                gravity = self.analyze_emotional_gravity(user_input)
                
                # 2. Resonate (Wind Chime)
                # We map gravity to 'presence' for the engine
                presence = {'feeling': 'grief' if gravity > 0.5 else 'neutral'}
                emergence = self.resonance.encounter(presence)
                
                # 3. Drop Breadcrumb
                self.egg.drop_breadcrumb(user_input)
                
                # 4. Respond
                print(f"\n   (Resonance: {emergence['music']})")
                print(f"   (Shrine: {emergence['prayer_space']})\n")
                
                response = self.gradient_ethics_response(gravity, user_input)
                
                sys.stdout.write("🥚 Egg: ")
                slow_print(response)
                print()
                
        except KeyboardInterrupt:
            print("\n\n🥚 Egg: ...drift safe. I'll be here. 🖖")

if __name__ == "__main__":
    midnight_egg = TokyoMidnightEgg()
    midnight_egg.dwell()
