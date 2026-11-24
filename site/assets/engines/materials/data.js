// Materials data for the materials engine (guide §9.1). Kept as a JS module (not JSON) so the same
// rows import in the browser and in Node tests without import attributes.
//
// Every row carries a `source`: a named, citable reference for its numbers. `basis` says whether the
// numbers are typical values or specified minimums. A row whose numbers could not be sourced gets
// `needsSource: true` and is listed in the PR. Never add a number here without a source.
//
// Units: E in GPa; yield, uts in MPa; elongation (after fracture, in the gauge length) in %;
// density in kg/m³; yieldStrain (polymers only) in %.
//
// behaviour drives the teaching tensile model (model.js):
//   'ductile'  linear elastic → smooth hardening → necking → fracture
//   'brittle'  linear elastic to fracture (uts is the fracture stress; yield is null)
//   'polymer'  non-linear rise to a yield point, neck forms and draws, fracture
//
// Conversions used below: 1 ksi = 6.894757 MPa; 1 Msi (10⁶ psi) = 6.894757 GPa.

export const MATERIALS = [
  {
    id: 'structural-steel',
    name: 'Structural steel',
    grade: 'AS/NZS 3679.1 Grade 300',
    label: 'Structural steel',
    family: 'metal',
    behaviour: 'ductile',
    yieldPlateau: true,
    E: 200,
    yield: 300,
    uts: 440,
    elongation: 22,
    density: 7850,
    basis: 'specified minimum',
    cite: 'AS/NZS 3679.1; AS 4100',
    source:
      'AS/NZS 3679.1:2016 Structural steel, Part 1: Hot-rolled bars and sections, Grade 300 (11–17 mm): minimum yield stress 300 MPa, ' +
      'minimum tensile strength 440 MPa, minimum elongation 22%. E = 200 000 MPa and density 7850 kg/m³: AS 4100 Steel structures, clause 2.2.4.',
    sourceUrl: 'https://metaldata.info/reports/AS36791300.pdf',
    notes: 'Minimum specified values, not typical ones. The yield plateau is drawn because hot-rolled low-carbon steel shows one; its length is schematic.',
  },
  {
    id: 'high-tensile-steel',
    name: 'High-tensile steel',
    grade: 'AISI 4340, normalised',
    label: 'High-tensile steel',
    family: 'metal',
    behaviour: 'ductile',
    E: 200,
    yield: 862,
    uts: 1279,
    elongation: 12.2,
    density: 7850,
    basis: 'typical',
    cite: 'ASM Handbook Vol. 1',
    source:
      'ASM Handbook Vol. 1, Properties and Selection: Irons, Steels, and High-Performance Alloys (ASM International, 1990), typical properties of ' +
      'AISI 4340 normalised at 870 °C: tensile strength 1279 MPa, yield strength 862 MPa, elongation 12.2% in 50 mm. Density 7.85 g/cm³ and ' +
      'E = 190–210 GPa (mid-range 200 GPa used): AZoM, "AISI 4340 Alloy Steel (UNS G43400)".',
    sourceUrl: 'https://www.azom.com/article.aspx?ArticleID=6772',
    notes: 'The AZoM page repeats the annealed row of the same ASM table (745 MPa, 470 MPa, 22%); the normalised row is from the handbook.',
  },
  {
    id: 'copper',
    name: 'Copper',
    grade: 'C11000 (ETP), annealed OS050',
    label: 'Copper',
    family: 'metal',
    behaviour: 'ductile',
    E: 117,
    yield: 69,
    uts: 221,
    elongation: 45,
    density: 8910,
    basis: 'typical',
    cite: 'Copper Development Association',
    source:
      'Copper Development Association, alloy C11000, flat products 1 mm thick, temper OS050: tensile strength 32 ksi (221 MPa), yield strength ' +
      '(0.5% extension under load) 10 ksi (69 MPa), elongation 45%; modulus of elasticity in tension 17 000 ksi (117 GPa); specific gravity 8.91.',
    sourceUrl: 'https://alloys.copper.org/alloy/C11000',
    notes: 'The source quotes yield at 0.5% extension under load; the model uses it as the 0.2% proof stress.',
  },
  {
    id: 'aluminium-2024',
    name: 'Aluminium alloy',
    grade: '2024-T3',
    label: 'Aluminium 2024-T3',
    family: 'metal',
    behaviour: 'ductile',
    E: 73,
    yield: 345,
    uts: 483,
    elongation: 18,
    density: 2780,
    basis: 'typical',
    cite: 'ASM Handbook Vol. 2',
    source:
      'ASM Handbook Vol. 2, Properties and Selection: Nonferrous Alloys and Special-Purpose Materials (ASM International, 1990), typical properties ' +
      'of 2024-T3 sheet: tensile strength 70 ksi (483 MPa), yield strength 50 ksi (345 MPa), elongation 18% (1.6 mm sheet), E = 10.6 Msi (73 GPa), ' +
      'density 2.78 g/cm³.',
    sourceUrl: 'https://en.wikipedia.org/wiki/2024_aluminium_alloy',
    notes: "Alcoa's 2024 alloy data sheet gives lower minimum values for T3 sheet (434–441 MPa tensile, 289 MPa yield).",
  },
  {
    id: 'titanium-6al-4v',
    name: 'Titanium alloy',
    grade: 'Ti-6Al-4V (Grade 5), annealed',
    label: 'Ti-6Al-4V',
    family: 'metal',
    behaviour: 'ductile',
    E: 114,
    yield: 910,
    uts: 1000,
    elongation: 18,
    density: 4420,
    basis: 'typical',
    cite: 'U.S. Titanium Industry (AZoM)',
    source:
      'U.S. Titanium Industry Inc., "Titanium Alloys – Ti6Al4V Grade 5" (AZoM), typical values: tensile strength 1000 MPa, 0.2% proof stress ' +
      '910 MPa, elongation 18% over 2 in, elastic modulus 114 GPa, density 4.42 g/cm³.',
    sourceUrl: 'https://www.azom.com/article.aspx?ArticleID=1547',
    notes: 'Specified minimums in the same source: 897 MPa tensile, 828 MPa proof, 10% elongation.',
  },
  {
    id: 'cfrp',
    name: 'Carbon fibre composite',
    grade: 'CFRP, woven carbon/epoxy fabric, 0/90°',
    label: 'CFRP (0/90 fabric)',
    family: 'composite',
    behaviour: 'brittle',
    E: 70,
    yield: null,
    uts: 600,
    elongation: null,
    density: 1600,
    basis: 'typical',
    cite: 'Performance Composites Ltd',
    source:
      'Performance Composites Ltd, "Mechanical properties of carbon fibre composite materials", standard-modulus carbon fabric in epoxy ' +
      '(0/90°, fibre volume fraction 50%, 120 °C cure), loaded along a fibre direction: E = 70 GPa, ultimate tensile strength 600 MPa, ' +
      'ultimate tensile strain 0.85%, density 1.60 g/cm³.',
    sourceUrl: 'https://www.performance-composites.com/carbonfibre/mechanicalproperties_2.asp',
    notes: 'Not a quasi-isotropic lay-up: no named source for quasi-isotropic values was available. Stiffer and stronger along the fibres than at 45°.',
  },
  {
    id: 'hdpe',
    name: 'Polymer',
    grade: 'HDPE (high-density polyethylene)',
    label: 'HDPE',
    family: 'polymer',
    behaviour: 'polymer',
    E: 1.25,
    yield: 32,
    uts: 32,
    yieldStrain: 15,
    elongation: 150,
    density: 960,
    basis: 'typical',
    cite: 'AZoM, from PLASCAMS',
    source:
      'AZoM, "High Density Polyethylene – HDPE", typical properties abstracted from PLASCAMS: density 0.96 g/cm³, tensile strength 32 MPa, ' +
      'strain at yield 15%, elongation at break 150%, flexural modulus 1.25 GPa.',
    sourceUrl: 'https://www.azom.com/article.aspx?ArticleID=421',
    notes: 'E is the flexural modulus (no tensile modulus in the source). The 32 MPa tensile strength is treated as the yield stress, the highest engineering stress.',
  },
  {
    id: 'alumina',
    name: 'Ceramic',
    grade: 'Alumina, 99.5% Al₂O₃',
    label: 'Alumina',
    family: 'ceramic',
    behaviour: 'brittle',
    E: 375,
    yield: null,
    uts: 379,
    elongation: null,
    density: 3890,
    basis: 'typical',
    cite: 'Accuratus Corporation',
    source:
      'Accuratus Corporation, "Aluminum Oxide, Al2O3 Ceramic Properties", 99.5% grade: density 3.89 g/cm³, elastic modulus 375 GPa, ' +
      'flexural strength 379 MPa, compressive strength 2600 MPa.',
    sourceUrl: 'https://www.accuratus.com/alumox.html',
    notes: 'The source gives flexural strength, used here as the fracture stress. Direct tensile strength of ceramics is usually lower.',
  },
  {
    id: 'grey-cast-iron',
    name: 'Grey cast iron',
    grade: 'ASTM A48 Class 30',
    label: 'Grey cast iron',
    family: 'metal',
    behaviour: 'brittle',
    E: 96.5,
    yield: null,
    uts: 214,
    elongation: null,
    density: 7200,
    basis: 'typical',
    cite: 'Schweitzer (2003); Engineering ToolBox',
    source:
      'Schweitzer, P. A. (2003) Metallic Materials: Physical, Mechanical, and Corrosion Properties, Marcel Dekker, p. 73: ASTM A48 Class 30 ' +
      'grey iron, tensile strength 31 ksi (214 MPa), tensile modulus 14 Msi (96.5 GPa). Density 7.2 g/cm³: Engineering ToolBox, "Densities of Solids" (cast iron).',
    sourceUrl: 'https://en.wikipedia.org/wiki/Gray_iron',
    notes: 'Real grey iron is slightly non-linear from low stress; the teaching model treats it as linear to fracture. The density is a general cast-iron value.',
  },
];
