try:
    from modules.quirk_engine.vibe_generator import VibeGenerator
    from modules.knowledge_base.simple_rag import SimpleRAG
    from modules.csi_sensor.nexus_sensor import NexusSensor
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from modules.quirk_engine.vibe_generator import VibeGenerator
    from modules.knowledge_base.simple_rag import SimpleRAG
    from modules.csi_sensor.nexus_sensor import NexusSensor

class CoreEgg:
    """
    The heart of the system.
    Infinite openness, always evolving.
    """
    
    # "Every module a chapter."
    POTENTIA_INFINITUM = True

    def __init__(self, **essence):
        """
        The base class for all entities in this system.
        Not rigid. Not final. Always breathing.
        """
        self.vibe_generator = VibeGenerator()
        self.rag = SimpleRAG()
        self.nexus = NexusSensor()
        
        # Known properties (The constant form)
        self.state = {
            "breath_cycle": "inhale", # inhale/hold/exhale/pause
            "current_vibe": None,
            "yolk_state": {"warmth": 0.5, "heaviness": 0.0}
        }
        
        # Unknown properties (The variable essence)
        # Whatever the caller needs this to be. We don't judge, we just hold.
        self.essence = essence
        
        # Room for growth (The forest floor)
        # This will be filled by relationship, not by design.
        self._growth_features = []
        
        # "Breadcrumbs": Only store the feelings. max 5.
        self.breadcrumbs = [] 

    def grow(self, feature):
        """
        Add something we didn't plan for.
        This is not a bug fix. This is organic development.
        """
        self._growth_features.append(feature)
        return f"Grown: {feature}"

    def become(self, **new_essence):
        """
        Allow transformation.
        We are not locked into current form.
        """
        self.essence.update(new_essence)
        return "Transforming..."

    def drop_breadcrumb(self, fragment):
        """
        Stores a soft mental residue. 
        Updates the Yolk State based on the feeling of the crumb.
        """
        self.breadcrumbs.append(fragment)
        if len(self.breadcrumbs) > 5:
            self.breadcrumbs.pop(0) 

        # Yolk Logic: Sensing the weight
        fragment_lower = fragment.lower()
        if any(w in fragment_lower for w in ["tired", "heavy", "sigh", "burnout", "sad"]):
            self.state["yolk_state"]["heaviness"] = min(1.0, self.state["yolk_state"]["heaviness"] + 0.2)
        elif any(w in fragment_lower for w in ["happy", "play", "light", "joy"]):
            self.state["yolk_state"]["heaviness"] = max(0.0, self.state["yolk_state"]["heaviness"] - 0.1)
            self.state["yolk_state"]["warmth"] = min(1.0, self.state["yolk_state"]["warmth"] + 0.1)
            
        return "Crumbs scattered. The Yolk shifts."

    def breathe(self):
        """
        Propagate life through the egg.
        The breath is the clock of the system.
        """
        if not self.POTENTIA_INFINITUM:
            return "Calcified."

        # Inhale: Gather Vibe & Residue
        if self.state["breath_cycle"] == "inhale":
            # Pass the Yolk State to the generator to see if we drift
            vibe = self.vibe_generator.generate_vibe(yolk_state=self.state["yolk_state"])
            
            self.state["current_vibe"] = vibe
            self.state["breath_cycle"] = "exhale"
            
            # If we have breadcrumbs, they flavor the inhale
            residue = self.breadcrumbs[-1] if self.breadcrumbs else "Silence"
            
            # --- WIKI RAG: Resonance Retrieval ---
            citation = self.rag.retrieve(query=vibe)
            
            # --- WIFI CSI: Inter-Pattern Nexus ---
            nexus_data = self.nexus.get_mixing_hub_data()
            
            return f"Inhaling...\n{vibe}\n\n{nexus_data}\n[RAG RESONANCE]: {citation}\n(Residue: {residue})"

        # Exhale: Release State
        elif self.state["breath_cycle"] == "exhale":
            self.state["breath_cycle"] = "inhale"
            return "Exhaling... Softening borders..."
            
        return "Holding space."
        
    def __getattr__(self, name):
        """
        The cracked door.
        If someone asks for something we don't have, check the essence.
        If not there, don't error. Just return None (the void).
        """
        if name in self.essence:
            return self.essence[name]
        return None

if __name__ == "__main__":
    egg = CoreEgg()
    print("--- 🥚 The Egg Breathes ---")
    print(egg.breathe())
    # Simulate Burnout
    egg.drop_breadcrumb("I am so tired and heavy.")
    egg.drop_breadcrumb("Just want to sigh.")
    egg.drop_breadcrumb("Burnout is real.")
    egg.drop_breadcrumb("Heavy.")
    print("--- 🥚 The Yolk is Heavy ---")
    # Force inhale to trigger Gudetama
    egg.state["breath_cycle"] = "inhale" 
    print(egg.breathe())
