import random
import time

class NexusSensor:
    """
    The Inter-Pattern Nexus.
    Simulates WiFi CSI (Channel State Information) sensing to detect 'Life Patterns'.
    """
    
    PATTERNS = [
        "Syncopated Flow (Life is moving fast)",
        "Adagio (Stillness / Reading)",
        "Entanglement (Multiple people interacting)",
        "Call & Response (Conversation detected)",
        "Germination (A new idea is forming)",
        "Laid-Back Bassline (Relaxed state ~ 60 BPM)"
    ]

    def __init__(self):
        self.last_scan = 0
        self.current_pattern = "Silence"

    def scan_channel_state(self):
        """
        Simulates reading the 'air' via WiFi signals.
        Returns a musical/rhythmic metaphor for the physical space.
        """
        # Simulate sensor latency
        time.sleep(0.1) 
        
        # Pick a pattern based on randomness (simulating flux)
        # In a real system, this would analyze amplitude/phase variance.
        pattern = random.choice(self.PATTERNS)
        
        # Calculate a fake "BPM" of the room
        bpm = random.randint(50, 140)
        
        self.current_pattern = f"{pattern} [Room Pulse: {bpm} BPM]"
        return self.current_pattern

    def get_mixing_hub_data(self):
        """
        Returns a formatted block for the Mixing Hub.
        """
        scan = self.scan_channel_state()
        return f"""
[WiFi CSI SENSOR]
Pattern: {scan}
Status: The Secret Garden is listening.
"""

if __name__ == "__main__":
    sensor = NexusSensor()
    print(sensor.get_mixing_hub_data())
