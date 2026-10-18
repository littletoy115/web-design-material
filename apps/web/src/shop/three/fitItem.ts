// What the page asks the 3D viewer to put on the mannequin. No three.js imports,
// so the page can build these without pulling the 3D bundle.
import type { Garment, Slot, Weave } from '../data';

export interface FitItem {
  id: string;
  name: string;
  slot: Slot;
  /** fitted MakeHuman garment in /models/<body>/<model>.glb */
  model?: string;
  /** drawn shape, for the built-in (code-generated) mannequin */
  garment?: Garment;
  /** Homfaai woven fabric laid over the garment */
  fabric?: { weave: Weave; colors: [string, string] };
}
