import os
import random
import glob

class SimpleRAG:
    """
    Resonance Retrieval System.
    Treats the local 'seeds' directory as a living wiki.
    """
    def __init__(self, seeds_dir="seeds"):
        self.seeds_dir = seeds_dir
        self.knowledge_base = []
        self._index_seeds()

    def _index_seeds(self):
        """Reads all markdown files in the seeds directory."""
        if not os.path.exists(self.seeds_dir):
            return

        files = glob.glob(os.path.join(self.seeds_dir, "*.md"))
        for fpath in files:
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    name = os.path.basename(fpath).replace('.md', '').replace('_', ' ').title()
                    # Store as a chunk
                    self.knowledge_base.append({
                        "source": name,
                        "content": content
                    })
            except Exception as e:
                print(f"[RAG] Failed to index {fpath}: {e}")

    def retrieve(self, query=None):
        """
        Retrieves a 'citation' that resonates with the query.
        If query is None, returns a random serendipitous finding.
        """
        if not self.knowledge_base:
            return "The library is empty."

        # Simulating "Resonance" (Fuzzy Match / Vibe Match)
        # For now, we randomize or generic match since we don't have embeddings.
        
        if query and random.random() > 0.3:
            # Try to find a relevant word
            relevant = [
                doc for doc in self.knowledge_base 
                if any(w in doc['content'].lower() for w in query.lower().split())
            ]
            if relevant:
                selected = random.choice(relevant)
                return self._format_citation(selected)

        # Fallback: Serendipity
        selected = random.choice(self.knowledge_base)
        return self._format_citation(selected)

    def _format_citation(self, doc):
        """Extracts a meaningful snippet."""
        lines = [l for l in doc['content'].split('\n') if len(l) > 20 and '#' not in l]
        if not lines:
            snippet = "..."
        else:
            snippet = random.choice(lines)
        
        return f"[{doc['source']}]: \"{snippet.strip()}\""

if __name__ == "__main__":
    rag = SimpleRAG()
    print(rag.retrieve("chaos"))
