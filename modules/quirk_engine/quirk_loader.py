import os
import re
import logging

# Configure gentle logging
logging.basicConfig(level=logging.INFO, format='%(message)s')

class QuirkLoader:
    def __init__(self, seeds_dir="/home/zath/Egg/seeds"):
        self.seeds_dir = seeds_dir
        self.memories = []

    def load_seeds(self):
        """Loads seeds with a philosophy of forgiveness. 
        If a memory is broken, it is not an error, just 'faint'."""
        
        if not os.path.exists(self.seeds_dir):
            logging.info("The seeds directory is missing. The Egg is currently silent.")
            return []

        for filename in os.listdir(self.seeds_dir):
            if filename.endswith(".md"):
                filepath = os.path.join(self.seeds_dir, filename)
                try:
                    self._parse_seed(filepath)
                except Exception as e:
                    # Non-invasion: We do not crash. We simply acknowledge the mystery.
                    logging.info(f"Could not fully recall {filename}: {e}")
        
        return self.memories

    def _parse_seed(self, filepath):
        """Parses a seed, looking for its emotional resonance."""
        with open(filepath, 'r') as f:
            content = f.read()
            
            title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
            archetypes_match = re.search(r'>\s*\*\*Archetypes\*\*:\s*(.+)$', content, re.MULTILINE)
            
            # Simple sentiment weight (mock implementation for 'Softness')
            softness_score = 0
            if "Care" in content: softness_score += 1
            if "Egg" in content: softness_score += 1
            
            memory = {
                "source": os.path.basename(filepath),
                "title": title_match.group(1) if title_match else "Untitled Fragment",
                "archetypes": archetypes_match.group(1).split(', ') if archetypes_match else [],
                "softness_index": softness_score,
                "raw_content": content
            }
            
            self.memories.append(memory)

if __name__ == "__main__":
    loader = QuirkLoader()
    seeds = loader.load_seeds()
    for seed in seeds:
        print(f"Recalled: {seed['title']} (Softness: {seed['softness_index']})")
