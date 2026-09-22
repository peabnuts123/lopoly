import type { Enum } from "@lopoly/engine/util";

export type ShaderType = Enum<typeof ShaderType>;
export const ShaderType = {
  FRAGMENT_SHADER: 0x8B30,
  VERTEX_SHADER: 0x8B31,
} as const;
