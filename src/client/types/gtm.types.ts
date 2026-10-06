export interface SelectItem {
  id: string;
  name: string;
  publicId?: string;
  value: string;
}

export interface GtmTag {
  id?: string;
  tagId?: string;
  name: string;
  type: string;
  category: string;
  tier?: string;
  savingsTier?: string;
  isRemovable?: boolean;
  notes?: string;
  originalData?: any;
}

export interface GtmTagsResult {
  summary: {
    totalTags: number;
    tiers?: {
      removable: number;
      lighterPayload: number;
      cannotMove: number;
      obsolete: number;
    };
    removableVendors?: string[];
    tagsByCategory?: Record<string, number>;
  };
  tags: Record<string, GtmTag[]>;
  tagsByTier?: Record<string, GtmTag[]>;
}

export interface ParsedGtmUrl {
  accountId: string | null;
  containerId: string | null;
  workspaceId: string | null;
}
