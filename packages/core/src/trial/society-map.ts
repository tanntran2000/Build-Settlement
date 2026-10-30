export type SocietyTier = 'housing' | 'service' | 'specialist' | 'slum';
export type StaffClass = 'basic' | 'makers' | 'luminaries' | 'merchants';
export interface SocietyBuildingInfo { tier: SocietyTier; staff: StaffClass | null; reserved: boolean; housing?: { class: 'free' | 'makers' | 'luminaries' | 'merchants' | 'elite' | 'bound'; byLevel: readonly number[] } }
const plots: Record<string, {tier: SocietyTier; ring: 1 | 2 | 3}> = {};
for (const [prefix,tier,ends] of [['house','housing',[4,8,11]],['service','service',[2,4,6]],['spec','specialist',[3,7,10]],['slum','slum',[1,3,6]]] as const) {
 for(let i=1;i<=ends[2];i++) plots[prefix+'-'+i] = Object.freeze({tier,ring:i<=ends[0]?1:i<=ends[1]?2:3});
}
export const SOCIETY_PLOT_IDS: readonly string[] = Object.freeze(Object.keys(plots));
export function societyPlot(tileId: string): {tier: SocietyTier;ring:1|2|3} | null { return Object.hasOwn(plots,tileId)?plots[tileId]:null; }
export const SOCIETY_BUILDINGS: Readonly<Record<string,SocietyBuildingInfo>> = {
  "common-housing": {
    "tier": "housing",
    "staff": null,
    "reserved": false,
    "housing": {
      "class": "free",
      "byLevel": [
        30,
        50,
        70
      ]
    }
  },
  "makers-rowhouses": {
    "tier": "housing",
    "staff": null,
    "reserved": false,
    "housing": {
      "class": "makers",
      "byLevel": [
        15,
        25,
        35
      ]
    }
  },
  "scholars-quarters": {
    "tier": "housing",
    "staff": null,
    "reserved": false,
    "housing": {
      "class": "luminaries",
      "byLevel": [
        10,
        18,
        25
      ]
    }
  },
  "merchant-townhouses": {
    "tier": "housing",
    "staff": null,
    "reserved": false,
    "housing": {
      "class": "merchants",
      "byLevel": [
        15,
        25,
        35
      ]
    }
  },
  "elite-manor": {
    "tier": "housing",
    "staff": null,
    "reserved": false,
    "housing": {
      "class": "elite",
      "byLevel": [
        6,
        12
      ]
    }
  },
  "tavern": {
    "tier": "service",
    "staff": "basic",
    "reserved": false
  },
  "hospital": {
    "tier": "service",
    "staff": "luminaries",
    "reserved": false
  },
  "town-hall": {
    "tier": "service",
    "staff": "merchants",
    "reserved": false
  },
  "builders-yard": {
    "tier": "specialist",
    "staff": "makers",
    "reserved": false
  },
  "academy": {
    "tier": "specialist",
    "staff": "luminaries",
    "reserved": false
  },
  "town-market": {
    "tier": "specialist",
    "staff": "merchants",
    "reserved": false
  },
  "trading-post": {
    "tier": "specialist",
    "staff": "merchants",
    "reserved": false
  },
  "counting-house": {
    "tier": "specialist",
    "staff": "merchants",
    "reserved": false
  },
  "slave-quarters": {
    "tier": "slum",
    "staff": null,
    "reserved": false,
    "housing": {
      "class": "bound",
      "byLevel": [
        25,
        45,
        70
      ]
    }
  },
  "watch-house": {
    "tier": "service",
    "staff": null,
    "reserved": true
  },
  "warehouse": {
    "tier": "specialist",
    "staff": null,
    "reserved": true
  },
  "smithy": {
    "tier": "specialist",
    "staff": null,
    "reserved": true
  },
  "library": {
    "tier": "specialist",
    "staff": null,
    "reserved": true
  },
  "brothel": {
    "tier": "slum",
    "staff": null,
    "reserved": true
  },
  "black-market": {
    "tier": "slum",
    "staff": null,
    "reserved": true
  },
  "arena": {
    "tier": "slum",
    "staff": null,
    "reserved": true
  },
  "drug-store": {
    "tier": "slum",
    "staff": null,
    "reserved": true
  }
};
const outside: Record<string, StaffClass> = {farm:'basic',logging:'basic',mine:'basic',processor:'makers',workshop:'makers'};
export function societyStaff(typeId:string): StaffClass | null { return Object.hasOwn(outside,typeId)?outside[typeId]:Object.hasOwn(SOCIETY_BUILDINGS,typeId)?SOCIETY_BUILDINGS[typeId].staff:null; }
