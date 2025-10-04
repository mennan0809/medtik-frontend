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
} from "./chunk-3DXT67CS.js";
import "./chunk-NEE5H4DV.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-73VOV3JZ.js";
import "./chunk-CWJYMMQZ.js";
import "./chunk-PLMGTTZS.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-DJRDRERX.js";
import "./chunk-PT22LDXX.js";
import "./chunk-6KGF5NRM.js";
import "./chunk-54U45ZWZ.js";
import "./chunk-LV3BQ6NE.js";
import "./chunk-VS2VPTZP.js";
import "./chunk-GQATU6PC.js";
import "./chunk-4NKEXUWS.js";
import "./chunk-XUCA3KNC.js";
import "./chunk-ET7F3PFR.js";
import "./chunk-UGRWDZBU.js";
import "./chunk-6WV5Y5M5.js";
import "./chunk-TJIBE23D.js";
import "./chunk-R4DZESQT.js";
import "./chunk-QLNEHLUF.js";
import "./chunk-KASQX4V6.js";
import "./chunk-IEIH7PL2.js";
import "./chunk-NKEHHMDN.js";
import "./chunk-SVHSL2F5.js";
import "./chunk-4WSFHCSA.js";
import "./chunk-KB574W5H.js";
import "./chunk-PLYDU33I.js";
import "./chunk-6FLZN62G.js";
import "./chunk-D5HPMNDN.js";
import "./chunk-53B2AV33.js";
import "./chunk-W3LQWAEF.js";
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
