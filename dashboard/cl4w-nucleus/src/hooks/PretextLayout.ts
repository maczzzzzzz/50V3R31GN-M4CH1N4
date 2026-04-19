/**
 * PretextLayout.ts
 *
 * A lightweight implementation of the Pretext philosophy for PIXI.js.
 * Decouples text measurement from the rendering loop.
 */

export interface LineRange {
  start: number;
  end: number;
  width: number;
}

export class PretextLayout {
  private readonly context: CanvasRenderingContext2D;
  private readonly font: string;

  constructor(font: string = '12px monospace') {
    const canvas = document.createElement('canvas');
    this.context = canvas.getContext('2d')!;
    this.font = font;
    this.context.font = this.font;
  }

  /**
   * Prepare text by measuring all possible break points.
   */
  prepare(text: string): number[] {
    const words = text.split(' ');
    const widths: number[] = [];
    words.forEach(word => {
      widths.push(this.context.measureText(word + ' ').width);
    });
    return widths;
  }

  /**
   * Layout text into lines for a target width.
   */
  layout(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const width = this.context.measureText(testLine).width;
      
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
  }
}
