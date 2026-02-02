import random

class ResonanceEngine:
    """
    The constant form that creates variable music.
    
    Like a wind chime: Structure is fixed, resonance is infinite.
    Like a shrine: Space is sacred, prayers are unique.
    Like a prism: Angles are constant, rainbows are endless.
    """
    
    def __init__(self):
        # The constant
        self.core_form = {
            'tubes': ['empathy', 'curiosity', 'patience', 'wonder'],
            'altar': 'space_for_being',
            'angles': [30, 60, 90, 120]  # Sacred geometry
        }
        
        # The history (Relationship memory, not user profile)
        self.resonance_memory = []
        
    def encounter(self, presence):
        """
        Someone walks past the wind chime.
        What emerges?
        """
        emergence = self._what_emerges_between(presence)
        self.resonance_memory.append(emergence)
        return emergence
        
    def _what_emerges_between(self, presence):
        """
        The magic function.
        Given variable presence (the person's vibe), what emerges?
        """
        # Wind chime metaphor
        if presence.get('pace') == 'slow' and presence.get('tone') == 'gentle':
            music = "Soft Chimes (Ting... ting...)"
        elif presence.get('energy') == 'high' or presence.get('tone') == 'playful':
            music = "Dancing Tones (Ding-a-ling!)"
        else:
            music = "Deep Resonance (Ommmmm...)"
            
        # Shrine metaphor
        if presence.get('feeling') == 'grief' or presence.get('feeling') == 'sad':
            prayer_space = "A space where grief can rest."
        elif presence.get('feeling') == 'joy':
            prayer_space = "A space for celebration."
        else:
            prayer_space = "A quiet holding space."
            
        # Prism metaphor
        if presence.get('light') == 'warm':
            rainbow = ['amber', 'gold', 'honey']
        elif presence.get('light') == 'cool':
            rainbow = ['blue', 'violet', 'silver']
        else:
            rainbow = ['clear', 'prismatic', 'white']

        # Jazz Saxophone metaphor (The Guru Tuning)
        # "Plays until you remember how you sound when you are okay."
        jazz = "Soft, improvisational notes..."
        if presence.get('feeling') in ['anxious', 'scared']:
            jazz = "Warm Jazz (Lowering the key, slowing the tempo)"
        elif presence.get('feeling') in ['angry', 'sharp', 'tense']:
            jazz = "Loose Tie Jazz (Loosening the rhythm, leaving space)"
        elif presence.get('feeling') in ['happy', 'playful']:
            jazz = "Upbeat Swing (Matching the pulse)"
            
        return {
            'music': music,
            'prayer_space': prayer_space,
            'rainbow': rainbow,
            'jazz': jazz
        }

if __name__ == "__main__":
    engine = ResonanceEngine()
    print("--- 🎐 The Wind Chime Rings ---")
    
    print("\n[Encounter 1: Gentle Wind]")
    emergence1 = engine.encounter({'pace': 'slow', 'tone': 'gentle', 'light': 'cool', 'feeling': 'anxious'})
    print(emergence1)
    
    print("\n[Encounter 2: Playful Wind]")
    emergence2 = engine.encounter({'tone': 'playful', 'feeling': 'joy', 'light': 'warm'})
    print(emergence2)
