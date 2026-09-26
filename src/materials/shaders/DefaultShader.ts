import type { IEngine } from '@lopoly/engine/Engine';
import type { IShader } from './IShader';
import type { ShaderVariantOptions } from './ShaderVariant';

import VertexShaderSource from './src/shader.vert';
import FragmentShaderSource from './src/shader.frag';

export class DefaultShader implements IShader {
  public readonly vertexShaderSource: string;
  public readonly fragmentShaderSource: string;

  public constructor(
    vertexShaderSource: string,
    fragmentShaderSource: string,
  ) {
    this.vertexShaderSource = vertexShaderSource;
    this.fragmentShaderSource = fragmentShaderSource;
  }

  getDefines(engine: IEngine, options: ShaderVariantOptions): string[] {
    const defines: string[] = [];

    if (options.hasDiffuseColor) {
      defines.push('DIFFUSE_COLOR');
    }

    if (options.hasVertexColors) {
      defines.push('VERTEX_COLORS');
    }

    if (options.hasSkin) {
      defines.push('SKIN', 'MAX_BONES ' + engine.config.models.maxBones);
    }

    if (options.hasDiffuseTexture) {
      defines.push('DIFFUSE_TEXTURE');
    }

    if (options.blendingMode) {
      switch (options.blendingMode.type) {
        case 'None':
          /* No blending, will set alpha = 1.0 in shader by default */
          break;
        case 'Average':
          /* Averaged blending. Transparent pixels set to alpha=0.5f for blending */
          defines.push('FIXED_TRANSPARENCY_ALPHA 0.5f');
          break;
        case 'Additive':
          /* Additive blending. Transparent pixels set to alpha=0.0f for blending */
          defines.push('FIXED_TRANSPARENCY_ALPHA 0.0f');
          break;
        case 'Subtractive':
          /* Subtractive blending. Transparent pixels set to alpha=0.0f for blending */
          defines.push('FIXED_TRANSPARENCY_ALPHA 0.0f');
          break;
        case 'AlphaBlend':
          /* Alpha blend. Do not manipulate shader output alpha */
          defines.push('ALPHA_BLENDING');
          break;
        case 'AlphaClip':
          /* Alpha clip. Pixels with alpha less than the cutoff are discarded, otherwise rendered as opaque */
          defines.push('ALPHA_CLIPPING');
          break;
        default:
          throw new Error(`Unimplemented blending mode: '${(options.blendingMode as { type: unknown }).type}'`);
      }
    }

    if (options.unlit) {
      defines.push("UNLIT");
    }

    if (options.hasReflection) {
      defines.push(`REFLECTION`);
    }

    if (engine.config.rendering.fullScreenDither) {
      defines.push(`DITHER`);
      defines.push(`DITHER_BITS_PER_CHANNEL ${engine.config.rendering.fullScreenDitherBitsPerChannel}`);
    }

    return defines;
  }
}

export const DefaultShaderInstance = new DefaultShader(
  VertexShaderSource,
  FragmentShaderSource,
);
