import {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-GR66SJS4.js";
import "./chunk-KELN5O3F.js";
import "./chunk-JQ3MZ4MR.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-SLIFD7RD.js";
import "./chunk-MFJIHEYW.js";
import "./chunk-XMGJMARJ.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-H5O5ZQLP.js";
import "./chunk-2SI4SMXN.js";
import "./chunk-LIAX36NB.js";
import "./chunk-GV3K7GAV.js";
import "./chunk-MAX5Q4UG.js";
import "./chunk-WGPRHOIE.js";
import "./chunk-RPJPZP64.js";
import "./chunk-RD3N466G.js";
import "./chunk-3ZPKHYCR.js";
import "./chunk-7LVFRMKO.js";
import "./chunk-YNBC5UWE.js";
import "./chunk-UGRWDZBU.js";
import "./chunk-6WV5Y5M5.js";
import "./chunk-QLNEHLUF.js";
import "./chunk-BQBAMQJC.js";
import "./chunk-EI26SGLQ.js";
import "./chunk-GSPD3CXJ.js";
import "./chunk-EVUGJCFS.js";
import "./chunk-QJL5MVQJ.js";
import "./chunk-VTGEJ362.js";
import "./chunk-NRJLZYK5.js";
import "./chunk-WDMUDEB6.js";

// node_modules/@angular/material/fesm2022/select.mjs
var matSelectAnimations = {
  // Represents
  // trigger('transformPanel', [
  //   state(
  //     'void',
  //     style({
  //       opacity: 0,
  //       transform: 'scale(1, 0.8)',
  //     }),
  //   ),
  //   transition(
  //     'void => showing',
  //     animate(
  //       '120ms cubic-bezier(0, 0, 0.2, 1)',
  //       style({
  //         opacity: 1,
  //         transform: 'scale(1, 1)',
  //       }),
  //     ),
  //   ),
  //   transition('* => void', animate('100ms linear', style({opacity: 0}))),
  // ])
  /** This animation transforms the select's overlay panel on and off the page. */
  transformPanel: {
    type: 7,
    name: "transformPanel",
    definitions: [
      {
        type: 0,
        name: "void",
        styles: {
          type: 6,
          styles: { opacity: 0, transform: "scale(1, 0.8)" },
          offset: null
        }
      },
      {
        type: 1,
        expr: "void => showing",
        animation: {
          type: 4,
          styles: {
            type: 6,
            styles: { opacity: 1, transform: "scale(1, 1)" },
            offset: null
          },
          timings: "120ms cubic-bezier(0, 0, 0.2, 1)"
        },
        options: null
      },
      {
        type: 1,
        expr: "* => void",
        animation: {
          type: 4,
          styles: { type: 6, styles: { opacity: 0 }, offset: null },
          timings: "100ms linear"
        },
        options: null
      }
    ],
    options: {}
  }
};
export {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatOptgroup,
  MatOption,
  MatPrefix,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger,
  MatSuffix,
  matSelectAnimations
};
//# sourceMappingURL=@angular_material_select.js.map
