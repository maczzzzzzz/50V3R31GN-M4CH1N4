/**
 * scripts/forge/district-prompts.ts
 *
 * Sovereign Asset Forge — District Hideout Definitions
 * 
 * Provides explicitly detailed, lore-accurate descriptions of various locations
 * for every major district to eliminate AI guesswork and maintain precise prop placement.
 */

export function getDistrictPrompt(districtName: string, locationType?: string): string {
  const d = districtName.toLowerCase();
  
  // Choose location type if not provided
  let loc = locationType;
  if (!loc) {
    if (d.includes('watson')) loc = 'cramped black-market ripperdoc clinic or electronics sweatshop';
    else if (d.includes('glen')) loc = 'corrupted municipal office taken over by gang members';
    else if (d.includes('heywood') || d.includes('santo domingo')) loc = 'heavy industrial warehouse or makeshift shanty village inside a factory';
    else if (d.includes('japantown')) loc = 'ruined traditional tea house or blood-stained illicit braindance parlor';
    else if (d.includes('pacifica')) loc = 'abandoned amusement park facility or decaying coastal resort lobby';
    else if (d.includes('rancho')) loc = 'suburban "beaverville" house transformed into a survivalist tent city';
    else if (d.includes('executive') || d.includes('charter')) loc = 'sterile, high-end corporate netrunner safehouse or luxury penthouse';
    else if (d.includes('europe')) loc = 'old-world brick architecture corrupted by neo-militaristic corporate tech';
    else if (d.includes('badlands') || d.includes('road')) loc = 'dusty abandoned gas station or desert smuggler bunker';
    else if (d.includes('hot zone') || d.includes('center')) loc = 'irradiated, nuked city center rubble with scavenged corporate ruins';
    else loc = 'seedy alleyway bar or gritty street-level safehouse';
  }

  const baseStr = `Location Type: ${loc}\n`;

  if (d.includes('watson')) {
    return baseStr + `District Lore: Watson (Kabuki / Little China) is a booming, overcrowded development zone dominated by Asian immigrant communities, factories, and the NODESTADT Co-Prosperity Sphere. 
    Mandatory Props: High-tech factory scrap used as furniture, Japanese/Chinese cultural motifs, sliding paper doors, neon signs visible through windows or cast lighting, industrial corporate tech mixed with street trash, scattered noodle boxes, surgical chairs or electronic workbenches if applicable.`;
  }
  if (d.includes('glen')) {
    return baseStr + `District Lore: The Glen is the seat of City Hall and government, but heavily bordered by violent Valentinos and 6th Street gang territories. It is a place of corrupted luxury. 
    Mandatory Props: Stolen high-end corporate couches/desks juxtaposed with gang graffiti on the walls, Valentino religious icons (candles, Santa Muerte shrines), 6th Street military surplus, bullet holes in expensive plaster, makeshift weapon workbenches, empty liquor bottles.`;
  }
  if (d.includes('heywood') || d.includes('santo domingo')) {
    return baseStr + `District Lore: Heywood / Santo Domingo features overpacked suburbs, massive industrial zones, tent cities, and Nomad campsites. 
    Mandatory Props: Cinderblock walls, heavy machinery parts repurposed as tables, Nomad survival gear, rusted corrugated metal plates on the floor, oil drums used as trash cans, makeshift hammocks or cots, heavy industrial crates, chains, and weapon lockers.`;
  }
  if (d.includes('japantown')) {
    return baseStr + `District Lore: Old Japantown is a ruined, sprawling Combat Zone controlled by the Tyger Claws gang, formerly a beautiful cultural center. 
    Mandatory Props: Broken neon kanji signs, ruined tatami mats on the floor, gang weaponry (katanas, cyberware parts), bullet-ridden shoji screens, makeshift barricades over windows, blood-stained floors, abandoned medical supplies.`;
  }
  if (d.includes('pacifica')) {
    return baseStr + `District Lore: Pacifica is a former coastal resort and amusement park, now a slow-rebuilding ruin by the sea. 
    Mandatory Props: Faded carnival memorabilia, sand and beach debris blown indoors, rusting rollercoaster parts repurposed as furniture, faded bright colors, scavenged resort furniture, broken slot machines or arcade cabinets used as tables.`;
  }
  if (d.includes('rancho')) {
    return baseStr + `District Lore: Rancho Coronado has endless rows of ruined suburban "beavervilles" taken over by tent cities, plagued by water scarcity and the Albino Alligators gang. 
    Mandatory Props: Hoarded water filtration tanks and jugs, 1950s-style suburban furniture decaying and heavily modified, makeshift tents erected inside living rooms, survivalist gear, dust and dirt covering all surfaces.`;
  }
  if (d.includes('executive') || d.includes('charter')) {
    return baseStr + `District Lore: Executive Zone / Charter Hill is the heavily guarded, pristine playground of the corporate elite. 
    Mandatory Props: High-end synthetic wood flooring, pristine netrunning terminals, expensive modern artwork, bulletproof glass, pristine white/black surfaces, high-end security cameras and gear, minimalist luxury furniture.`;
  }
  if (d.includes('europe')) {
    return baseStr + `District Lore: Little Europe features towering modern skyscrapers mixed with classic brick European architecture. 
    Mandatory Props: Old brick walls, classic European architecture (arches, wood panels) corrupted by cyberpunk tech, neo-militaristic corporate gear, elegant but decaying vintage furniture, secure netrunning terminals, thick heavy drapes.`;
  }
  if (d.includes('badlands') || d.includes('road')) {
    return baseStr + `District Lore: The Badlands are vast, arid, polluted desert wastes roamed by Nomads and Wraiths. 
    Mandatory Props: Car parts, CHOOH2 fuel barrels, dusty tarps, engine blocks used as tables, sleeping bags, heavy survival gear, sand everywhere, rusted tools, spare tires.`;
  }
  if (d.includes('hot zone') || d.includes('center')) {
    return baseStr + `District Lore: The Hot Zone is the irradiated, destroyed ruins of the old corporate center from the 2023 nuke. 
    Mandatory Props: Melted corporate logo signs, fused slag, twisted rebar, glowing radioactive debris, heavy hazard-suit castoffs, completely collapsed ceilings, ash-covered floors.`;
  }

  // Default fallback
  return baseStr + `District Lore: NODESTADT (Generic) is a sprawling, dangerous cyberpunk metropolis. 
    Mandatory Props: Standard runner gear, weapons cache on a table, sleeping mat on the floor, netrunning deck with glowing cables, empty takeout containers, scattered ammo, neon glow from streetlights outside.`;
}
