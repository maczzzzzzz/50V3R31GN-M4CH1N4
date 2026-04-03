export class SensoryFilter {
  static getVisibleEntities(tokenId) {
    const token = canvas.tokens.get(tokenId);
    if (!token) return [];

    // Compute Line of Sight Polygon
    const los = canvas.walls.computePolygon({
      x: token.center.x,
      y: token.center.y,
      type: "sight",
      radius: token.vision.radius
    });

    const visibleTokens = canvas.tokens.placeables.filter(t => {
      if (t.id === tokenId) return false; // Ignore self
      return los.contains(t.center.x, t.center.y);
    });

    return visibleTokens.map(t => ({
      id: t.id,
      name: t.name,
      x: t.x,
      y: t.y,
      disposition: t.document.disposition
    }));
  }
}
