#!/usr/bin/env bash

set -e

# 1. Watson
echo "Forging Watson 1..."
npm run forge:master -- megabuilding-3x3 --style="Old Japantown Side Street" --district="Watson" --location="cramped black-market ripperdoc clinic"
echo "Forging Watson 2..."
npm run forge:master -- megabuilding-3x3 --style="Old Japantown Side Street" --district="Watson" --location="electronics sweatshop"

# 2. The Glen
echo "Forging The Glen 1..."
npm run forge:master -- megabuilding-3x3 --style="Safehouse" --district="The Glen" --location="corrupted municipal office"
echo "Forging The Glen 2..."
npm run forge:master -- megabuilding-3x3 --style="Safehouse" --district="The Glen" --location="high-end apartment taken over by gang members"

# 3. Heywood
echo "Forging Heywood 1..."
npm run forge:master -- megabuilding-3x3 --style="Sublevel 2 v2" --district="Heywood" --location="heavy industrial warehouse"
echo "Forging Heywood 2..."
npm run forge:master -- megabuilding-3x3 --style="Sublevel 2 v2" --district="Heywood" --location="makeshift shanty village inside a factory"

# 4. Japantown
echo "Forging Japantown 1..."
npm run forge:master -- megabuilding-3x3 --style="Old Japantown Side Street" --district="Japantown" --location="neon filled market"
echo "Forging Japantown 2..."
npm run forge:master -- megabuilding-3x3 --style="Old Japantown Side Street" --district="Japantown" --location="netrunner shop"

# 5. Pacifica
echo "Forging Pacifica 1..."
npm run forge:master -- megabuilding-3x3 --style="Martyr Motel" --district="Pacifica" --location="abandoned amusement park facility"
echo "Forging Pacifica 2..."
npm run forge:master -- megabuilding-3x3 --style="Martyr Motel" --district="Pacifica" --location="decaying coastal resort lobby"

# 6. Rancho Coronado
echo "Forging Rancho 1..."
npm run forge:master -- megabuilding-3x3 --style="Safehouse" --district="Rancho Coronado" --location="suburban beaverville house"
echo "Forging Rancho 2..."
npm run forge:master -- megabuilding-3x3 --style="Safehouse" --district="Rancho Coronado" --location="survivalist tent city"

# 7. Executive Zone
echo "Forging Executive Zone 1..."
npm run forge:master -- megabuilding-3x3 --style="Hotel Rooms" --district="Executive Zone" --location="sterile corporate netrunner safehouse"
echo "Forging Executive Zone 2..."
npm run forge:master -- megabuilding-3x3 --style="Hotel Rooms" --district="Executive Zone" --location="luxury penthouse"

# 8. Little Europe
echo "Forging Little Europe 1..."
npm run forge:master -- megabuilding-3x3 --style="Hotel Rooms" --district="Little Europe" --location="old-world brick architecture"
echo "Forging Little Europe 2..."
npm run forge:master -- megabuilding-3x3 --style="Hotel Rooms" --district="Little Europe" --location="neo-militaristic corporate outpost"

# 9. Badlands
echo "Forging Badlands 1..."
npm run forge:master -- megabuilding-3x3 --style="Nomad-Market-Light" --district="Badlands" --location="dusty abandoned gas station"
echo "Forging Badlands 2..."
npm run forge:master -- megabuilding-3x3 --style="Nomad-Market-Light" --district="Badlands" --location="desert smuggler bunker"

# 10. Hot Zone
echo "Forging Hot Zone 1..."
npm run forge:master -- megabuilding-3x3 --style="6th Street Shootout" --district="Hot Zone" --location="irradiated nuked city center rubble"
echo "Forging Hot Zone 2..."
npm run forge:master -- megabuilding-3x3 --style="6th Street Shootout" --district="Hot Zone" --location="scavenged corporate ruins"

echo "================================================="
echo "ALL 20 DISTRICT VARIATIONS GENERATED SUCCESSFULLY"
echo "================================================="
