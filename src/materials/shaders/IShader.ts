import  type { IEngine } from '@lopoly/engine/Engine';
import type { ShaderVariantOptions } from './ShaderVariant';

export interface IShader {
  get vertexShaderSource(): string;
  get fragmentShaderSource(): string;
  getDefines(engine: IEngine, options: ShaderVariantOptions): string[];
}
