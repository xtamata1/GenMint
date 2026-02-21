export interface Trait {
  id: string;
  name: string;
  weight: number;
  file: File;
  preview: string;
}

export interface Layer {
  id: string;
  name: string;
  traits: Trait[];
}

export interface Attribute {
  trait_type: string;
  value: string;
}

export interface GeneratedNFT {
  id: number;
  name: string;
  description: string;
  image: string; // data url
  attributes: Attribute[];
  dna: string;
  rarityScore?: number;
  isLegendary?: boolean;
}

export interface LegendaryItem {
  id: string;
  name: string;
  description: string; // Optional override
  image: File;
  preview: string;
  attributes?: Attribute[]; // Allow manual attributes
}

export interface CollectionSettings {
  name: string;
  symbol: string;
  description: string;
  totalSupply: number;
}

export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error';
