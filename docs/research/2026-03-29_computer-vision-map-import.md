# Deep Research Analysis: Computer Vision Map Import
**Date:** Sunday, March 29, 2026
**Subject:** Automating Wall & Door Generation for Foundry VTT

## 1. Objective
To evaluate the capability of Node B (The Orchestrator) to use computer vision to automatically detect walls and doors from a flat image (e.g., `Apartment.JPG`) and generate a Foundry-compatible JSON payload for automatic scene building.

## 2. Experimental Data Output (`Apartment.JPG`)
Based on the visual analysis of the provided asset, here is an experimental JSON structure that maps the outer perimeter and primary internal doors. 
*(Note: Coordinates `c: [x1, y1, x2, y2]` are estimated pixel values based on a standard 100px grid).*

```json
{
  "walls": [
    // Outer Perimeter (Movement 1: Block, Sense 1: Block)
    { "c": [200, 100, 1600, 100], "move": 1, "sense": 1, "door": 0 }, // Top Wall
    { "c": [1600, 100, 1600, 900], "move": 1, "sense": 1, "door": 0 }, // Right Wall
    { "c": [200, 900, 1600, 900], "move": 1, "sense": 1, "door": 0 }, // Bottom Wall
    { "c": [200, 100, 200, 900], "move": 1, "sense": 1, "door": 0 }, // Left Wall
    
    // Internal Divisions
    { "c": [900, 100, 900, 400], "move": 1, "sense": 1, "door": 0 }, // Kitchen Wall
    
    // Doors (door: 1 indicates a normal door)
    { "c": [1600, 450, 1600, 550], "move": 1, "sense": 1, "door": 1 }, // Main Entrance
    { "c": [850, 400, 950, 400], "move": 1, "sense": 1, "door": 1 }    // Bedroom Door
  ]
}
```

## 3. GitHub Ecosystem & Integration Paths
While it is technically possible to write a custom Python/OpenCV script to do this natively on Node B, existing tools solve this problem elegantly.

### 3.1 The "Auto Wall" Solution
The current industry standard for this task is the **[Auto Wall](https://github.com/ThreeHats/auto-wall)** project by ThreeHats.
- **How it works:** It uses advanced edge and color detection to find lines.
- **Foundry Integration:** It pairs with the "Auto Wall Companion" module in Foundry, allowing GMs to copy an image, run it through the tool, and import the walls via the clipboard.

### 3.2 The UVTT Standard
If we implement our own CV pipeline, we should NOT output raw Foundry JSON. We should output **Universal VTT (.uvtt)** format.
- `line_of_sight`: Array of wall coordinates.
- `portals`: Array of door coordinates with state data (`closed: true`).
- **Why?** Foundry has robust, maintained modules (like Universal Battlemap Importer) that perfectly translate UVTT files into Scenes, handling the grid-math automatically.

## 4. Phase Alignment
This capability—while highly immersive—is a heavy development lift that falls outside the core gameplay loop of the MVP.

**Directive:** I am moving "Computer Vision Map Generation" into the **Phase 6 Quarantine Zone (Living City / World Expansion)**. 

During Phase 4, GMs will manually prep maps or use the existing "Auto Wall" community tool. In Phase 6, we can explore integrating a headless OpenCV Python script into Node B to automate the UVTT generation pipeline for dynamically spawned "Gig" locations.
