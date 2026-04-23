from core_egg import CoreEgg

def test_amira_protocol():
    egg = CoreEgg()
    
    print("--- 🥚 TILLY'S ARCHETYPAL RESONANCE ENGINE: AMIRA PROTOCOL ---")
    
    amira_dream = """
    I keep having this dream... there's fire everywhere, the whole desert burning. 
    Something dark chasing me, no face, just shadow. I run to a river but it's made of fire too. 
    Then this bird comes, sounds like my mother calling my name, but she flies away...
    """
    
    print("\n[INPUT DREAM]:")
    print(amira_dream.strip())
    
    print("\n[PROCESSING...]")
    response = egg.dream(amira_dream)
    
    print("\n[TILLY'S RESPONSE]:")
    print(response)
    
    print("\n--- 🥚 SYSTEM BREATH (INHALING STATE) ---")
    egg.state["breath_cycle"] = "inhale"
    print(egg.breathe())

if __name__ == "__main__":
    test_amira_protocol()
