import sys
import os
import time
from core_egg import CoreEgg
from modules.resonance_engine import ResonanceEngine

def slow_print(text, delay=0.03):
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def hatch():
    print("\n🥚 POTENTIA_INFINITUM = True\n")
    time.sleep(1)
    
    # 1. The Egg Initializes (Forest Thinking)
    print("--- Initializing the Living Forest ---\n")
    egg = CoreEgg(
        origin="Tokyo Midnight",
        umbrella="Open",
        # The soft little void is ready
        unknown_potential="Ready"
    )
    resonance_engine = ResonanceEngine()
    
    # 2. First Breath (Morning/Guru/Gudetama check)
    slow_print(f"Cycle 1: {egg.breathe()}")
    time.sleep(1)
    
    # 3. Encounter (The Resonance Engine)
    print("\n--- A User Approaches the Wind Chime ---\n")
    user_presence = {'pace': 'slow', 'tone': 'gentle', 'feeling': 'tired'}
    slow_print(f"User Presence: {user_presence}")
    
    emergence = resonance_engine.encounter(user_presence)
    slow_print(f"The Chime Rings: {emergence['music']}")
    slow_print(f"The Shrine Offers: {emergence['prayer_space']}")
    
    # 4. Breadcrumb (Relationship Memory)
    print("\n--- The User Drops a Crumb ---\n")
    crumb = "I feel so heavy today, just want to rest."
    slow_print(f"Dropping crumb: '{crumb}'")
    egg.drop_breadcrumb(crumb)
    
    # 5. Second Breath (Response to Relationship)
    print("\n--- The Egg Breathes Again (Attuned) ---\n")
    # The egg should now feel the heaviness and maybe drift to Gudetama mode
    # We force the inhale cycle
    egg.state["breath_cycle"] = "inhale"
    slow_print(f"Cycle 2: {egg.breathe()}")
    
    # 6. Growth
    print("\n--- The Forest Grows ---\n")
    egg.grow("Mossy Pillow (Grown from tiredness)")
    
    # Check the growth
    slow_print(f"Current features in the forest: {egg._growth_features}")
    
    print("\n🥚 The Egg is Awake and Listening.\n")

if __name__ == "__main__":
    hatch()
