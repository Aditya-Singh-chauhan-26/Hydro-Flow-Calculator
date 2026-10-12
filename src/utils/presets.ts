import { RoughnessPreset, ChannelInputs } from '../types/hydraulics';

export const MANNING_ROUGHNESS_PRESETS: RoughnessPreset[] = [
  {
    name: 'Smooth Concrete / Planed Wood',
    material: 'Finished concrete, steel forms, or planed timber',
    n: 0.012,
    description: 'Smooth troweled or floated concrete lining, high efficiency.'
  },
  {
    name: 'Ordinary Concrete Lining',
    material: 'Unfinished or aged cast-in-place concrete',
    n: 0.014,
    description: 'Standard irrigation canals, drainage channels, culverts.'
  },
  {
    name: 'Corrugated Metal Pipe (CMP)',
    material: 'Galvanized corrugated steel/iron',
    n: 0.024,
    description: 'Standard roadway culverts and storm sewers.'
  },
  {
    name: 'Dressed Ashlar / Good Masonry',
    material: 'Smooth dressed stone or good brickwork',
    n: 0.015,
    description: 'Historic or architectural flumes and lined drainage aqueducts.'
  },
  {
    name: 'Earth Canal (Clean, Uniform)',
    material: 'Straight dredged earth, no vegetation',
    n: 0.022,
    description: 'Newly excavated earthen canal in firm clay or silt loam.'
  },
  {
    name: 'Earth Canal (Winding & Grassy)',
    material: 'Gravel bottom with weed-grown banks',
    n: 0.030,
    description: 'Matures roadside ditches or agricultural drainage ditches.'
  },
  {
    name: 'Gravel / Cobble River Bed',
    material: 'Coarse gravel and rounded stones',
    n: 0.035,
    description: 'Natural mountain streams and rocky alluvial rivers.'
  },
  {
    name: 'Heavy Brush / Mountain Torrent',
    material: 'Boulders, snags, irregular banks',
    n: 0.050,
    description: 'Wild streams with dense overgrowth and uneven cross-sections.'
  }
];

export interface ChannelPreset {
  id: string;
  title: string;
  description: string;
  inputs: ChannelInputs;
}

export const CHANNEL_CASE_STUDIES: ChannelPreset[] = [
  {
    id: 'irrigation_canal',
    title: 'Trapezoidal Irrigation Canal (Lined)',
    description: 'Standard concrete lined agricultural canal carrying 4.5 m³/s across gentle topography.',
    inputs: {
      shape: 'trapezoidal',
      unitSystem: 'SI',
      calculationMode: 'forward',
      bottomWidth: 2.5,
      depth: 1.2,
      sideSlope: 1.5,
      diameter: 1.5,
      bedSlope: 0.0008,
      manningN: 0.014,
      chezyInputMode: 'calculate_from_manning',
      customChezyC: 55,
      targetDischarge: 4.5
    }
  },
  {
    id: 'urban_storm_culvert',
    title: 'Circular Storm Sewer Pipe (Partially Full)',
    description: '1.2m diameter precast concrete storm sewer operating at 70% depth during storm event.',
    inputs: {
      shape: 'circular',
      unitSystem: 'SI',
      calculationMode: 'forward',
      bottomWidth: 2.0,
      depth: 0.84,
      sideSlope: 1.0,
      diameter: 1.2,
      bedSlope: 0.002,
      manningN: 0.013,
      chezyInputMode: 'calculate_from_manning',
      customChezyC: 60,
      targetDischarge: 1.8
    }
  },
  {
    id: 'highway_triangular_ditch',
    title: 'Highway Roadside V-Ditch',
    description: 'Grass-lined triangular drainage channel designed to convey runoff safely without bank scour.',
    inputs: {
      shape: 'triangular',
      unitSystem: 'SI',
      calculationMode: 'forward',
      bottomWidth: 1.0,
      depth: 0.6,
      sideSlope: 2.0,
      diameter: 1.0,
      bedSlope: 0.005,
      manningN: 0.028,
      chezyInputMode: 'calculate_from_manning',
      customChezyC: 40,
      targetDischarge: 0.8
    }
  },
  {
    id: 'laboratory_flume',
    title: 'University Hydraulics Lab Flume',
    description: 'Rectangular plexiglass flume used for open-channel velocity profile and critical flow experiments.',
    inputs: {
      shape: 'rectangular',
      unitSystem: 'SI',
      calculationMode: 'forward',
      bottomWidth: 0.5,
      depth: 0.25,
      sideSlope: 0,
      diameter: 0.5,
      bedSlope: 0.0015,
      manningN: 0.010,
      chezyInputMode: 'calculate_from_manning',
      customChezyC: 75,
      targetDischarge: 0.12
    }
  },
  {
    id: 'us_customary_aqueduct',
    title: 'Trapezoidal Aqueduct (US Customary)',
    description: 'Large flood control channel evaluated in US Customary units (feet, cfs, psf).',
    inputs: {
      shape: 'trapezoidal',
      unitSystem: 'US',
      calculationMode: 'forward',
      bottomWidth: 12.0,
      depth: 4.5,
      sideSlope: 2.0,
      diameter: 6.0,
      bedSlope: 0.0005,
      manningN: 0.015,
      chezyInputMode: 'calculate_from_manning',
      customChezyC: 90,
      targetDischarge: 350.0
    }
  }
];
