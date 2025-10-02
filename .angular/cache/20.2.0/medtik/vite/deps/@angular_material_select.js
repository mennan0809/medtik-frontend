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
} from "./chunk-WOEGZLND.js";
import "./chunk-A5J737LZ.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-CPYFXOBD.js";
import "./chunk-RCDERTWH.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-EV2C4INL.js";
import "./chunk-IP3Q4GXM.js";
import "./chunk-HVYEHRKB.js";
import "./chunk-DT7HTRCP.js";
import "./chunk-PH4WTDVA.js";
import "./chunk-NLJYA6MC.js";
import "./chunk-GYDG2X3Q.js";
import "./chunk-EMAM7DBZ.js";
import "./chunk-5Q7DF4MY.js";
import "./chunk-VENV3F3G.js";
import "./chunk-5ET5XJRZ.js";
import "./chunk-GWFLKVBH.js";
import "./chunk-XLOHFJTD.js";
import "./chunk-3IG5LR7X.js";
import "./chunk-YWEKFZWO.js";
import "./chunk-UV5R6I7S.js";
import "./chunk-KHYNWU2B.js";
import "./chunk-K5PTRXZF.js";
import "./chunk-7UJZXIJQ.js";
import "./chunk-JENSKEDP.js";
import "./chunk-NGL74CKO.js";
import "./chunk-SXW6FJSI.js";
import "./chunk-3GU2IGVG.js";
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
