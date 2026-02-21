import { Layer, GeneratedNFT, Trait, CollectionSettings, LegendaryItem } from '../types';

export const parseFilename = (filename: string): { name: string; weight: number } => {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const parts = nameWithoutExt.split('#');
  
  if (parts.length > 1) {
    const weight = parseInt(parts[parts.length - 1]);
    if (!isNaN(weight)) {
      // Remove the weight part from name
      const cleanName = parts.slice(0, parts.length - 1).join('#');
      return { name: cleanName, weight };
    }
  }
  
  return { name: nameWithoutExt, weight: 10 }; // Default weight
};

export const generateCollection = async (
  layers: Layer[],
  settings: CollectionSettings,
  legendaries: LegendaryItem[],
  onProgress: (progress: number) => void
): Promise<GeneratedNFT[]> => {
  const generated: GeneratedNFT[] = [];
  const dnaSet = new Set<string>();
  
  // Pre-load images for canvas
  const imageCache: Record<string, HTMLImageElement> = {};
  
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  // Flatten traits for cache loading
  for (const layer of layers) {
    for (const trait of layer.traits) {
      if (!imageCache[trait.id]) {
        try {
          imageCache[trait.id] = await loadImage(trait.preview);
        } catch (e) {
          console.error(`Failed to load image for trait ${trait.name}`, e);
        }
      }
    }
  }

  // Pre-load legendaries
  for (const leg of legendaries) {
      if(!imageCache[leg.id]) {
          try {
              imageCache[leg.id] = await loadImage(leg.preview);
          } catch (e) {
               console.error(`Failed to load legendary ${leg.name}`, e);
          }
      }
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error("Could not create canvas context");

  for (let i = 0; i < settings.totalSupply; i++) {
    const currentId = i + 1;
    
    // Check if we have a legendary for this slot (Slots 1 to legendaries.length)
    // Arrays are 0-indexed, so we check if i < legendaries.length
    if (i < legendaries.length) {
        const leg = legendaries[i];
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const img = imageCache[leg.id];
        if(img) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        const dataUrl = canvas.toDataURL('image/png');

        generated.push({
            id: currentId,
            name: leg.name || `${settings.name} #${currentId}`,
            description: leg.description || settings.description,
            image: dataUrl,
            dna: `LEGENDARY-${leg.id}`,
            attributes: leg.attributes || [{ trait_type: "Rarity", value: "Legendary" }],
            isLegendary: true
        });

        onProgress(Math.round(((i + 1) / settings.totalSupply) * 100));
        continue; // Skip the random generation logic
    }

    // Standard Generation Logic
    let attempts = 0;
    let valid = false;
    let selectedTraits: { layer: string; trait: Trait }[] = [];
    let dna = '';

    while (!valid && attempts < 100) {
      selectedTraits = [];
      const dnaParts: string[] = [];

      for (const layer of layers) {
        if (layer.traits.length === 0) continue;

        // Weighted random selection
        const totalWeight = layer.traits.reduce((acc, t) => acc + t.weight, 0);
        let random = Math.random() * totalWeight;
        let selected: Trait | undefined;

        for (const trait of layer.traits) {
          random -= trait.weight;
          if (random <= 0) {
            selected = trait;
            break;
          }
        }
        
        // Fallback for floating point errors
        if (!selected) selected = layer.traits[layer.traits.length - 1];

        selectedTraits.push({ layer: layer.name, trait: selected });
        dnaParts.push(`${layer.id}:${selected.id}`);
      }

      dna = dnaParts.join('-');
      if (!dnaSet.has(dna)) {
        dnaSet.add(dna);
        valid = true;
      } else {
        attempts++;
      }
    }

    if (!valid) {
      console.warn("Could not generate unique DNA after 100 attempts. Stopping early.");
      break;
    }

    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const { trait } of selectedTraits) {
      const img = imageCache[trait.id];
      if (img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    }

    const dataUrl = canvas.toDataURL('image/png');
    
    generated.push({
      id: currentId,
      name: `${settings.name} #${currentId}`,
      description: settings.description,
      image: dataUrl,
      dna,
      attributes: selectedTraits.map(t => ({
        trait_type: t.layer,
        value: t.trait.name
      }))
    });

    onProgress(Math.round(((i + 1) / settings.totalSupply) * 100));
    
    // Yield to main thread every few items to prevent UI freeze
    if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
  }

  return generated;
};
