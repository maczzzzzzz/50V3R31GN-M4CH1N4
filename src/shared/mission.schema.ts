export interface MissionBlueprint {
  district: string;
  brief: string;
  tacticalAnalysis: string;
  rulesIntel: { 
    difficulty: string;
    assets?: {
      suggestedMaps: string[];
      suggestedTokens: string[];
    };
  };
  loreAnchors: string[];
}