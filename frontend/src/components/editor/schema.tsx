import {
  BlockNoteSchema,
  defaultBlockSpecs,
} from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";

const formulaBlock = createReactBlockSpec(
  {
    type: "formula",
    propSchema: {
      formula: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ block }) => {
      const text = block.props.formula;
      const empty = !text;
      return (
        <div
          className={`bn-formula-block${empty ? " bn-formula-block--empty" : ""}`}
          contentEditable={false}
        >
          {empty ? "∫ u dv = u·v − ∫ v du" : text}
        </div>
      );
    },
  },
);

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    formula: formulaBlock,
  },
});