import { CameraUboIndex } from '@lopoly/engine/scene/nodes/CameraNode';
import { LightingUboIndex } from '@lopoly/engine/scene/SceneLighting';
import type { IEngine } from '@lopoly/engine/Engine';

import { ShaderBlendingMode } from './ShaderBlendingMode';
import type { IShader } from './IShader';
import { ShaderType } from './ShaderType';

export interface ShaderVariantOptions {
  hasDiffuseColor: boolean;
  hasVertexColors: boolean;
  hasDiffuseTexture: boolean;
  blendingMode: ShaderBlendingMode;
  unlit: boolean;
  hasSkin: boolean;
  hasReflection: boolean;
}
export const DefaultShaderVariantOptions: ShaderVariantOptions = {
  hasDiffuseColor: false,
  hasVertexColors: false,
  hasDiffuseTexture: false,
  blendingMode: ShaderBlendingMode.None(),
  unlit: false,
  hasSkin: false,
  hasReflection: false,
};

export class ShaderVariant {
  public readonly id: number;

  private readonly gl: WebGL2RenderingContext;
  public readonly program: WebGLProgram;

  public constructor(engine: IEngine, id: number, shader: IShader, options?: Partial<ShaderVariantOptions>) {
    const { gl } = engine;

    this.gl = gl;
    this.id = id;
    const vertexShader = gl.createShader(ShaderType.VERTEX_SHADER);
    const fragmentShader = gl.createShader(ShaderType.FRAGMENT_SHADER);
    const program = this.program = gl.createProgram();

    if (!vertexShader || !fragmentShader || !program) {
      throw new Error(`Failed to allocate GL objects`);
    }

    function inject(name: string, injected: string, src: string): string {
      return src.replace(new RegExp(`#pragma\\s+inject\\s*\\(\\s*${name}\\s*\\)\\s*$`, "m"), injected);
    }
    const DefaultDefines = ([
      ['_ShaderId', `${id}`],
      [`MAX_POINT_LIGHTS`, `${engine.config.lighting.maxPointLights}`],
      [`MAX_DIRECTIONAL_LIGHTS`, `${engine.config.lighting.maxDirectionalLights}`],
    ] satisfies Array<[key: string, value: string]>)
      .map(([key, value]) => `#define ${key} ${value}`)
      .join('\n') + '\n';
    const definesBlock = DefaultDefines + shader.getDefines(engine, {
      ...DefaultShaderVariantOptions,
      ...options,
    })
      .map((define) => `#define ${define}`).join('\n') + '\n';

    const vertexShaderSource = inject('defines', definesBlock, shader.vertexShaderSource);
    gl.shaderSource(vertexShader, vertexShaderSource);
    const fragmentShaderSource = inject('defines', definesBlock, shader.fragmentShaderSource);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    // console.log(`Shader '${id}'\n<VERTEX_SHADER>\n${vertexShaderSource}\n</VERTEX_SHADER>\n<FRAGMENT_SHADER>\n${fragmentShaderSource}\n</FRAGMENT_SHADER>`);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const errorMessage = gl.getShaderInfoLog(vertexShader);
      throw new Error(`Failed to compile vertex shader: ${errorMessage}`);
    }
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const errorMessage = gl.getShaderInfoLog(fragmentShader);
      throw new Error(`Failed to compile fragment shader: ${errorMessage}`);
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const errorMessage = gl.getProgramInfoLog(program);
      throw new Error(`Failed to link GL program: ${errorMessage}`);
    }

    const cameraUboBlockIndex = gl.getUniformBlockIndex(this.program, "Camera");
    if (cameraUboBlockIndex !== gl.INVALID_INDEX) {
      gl.uniformBlockBinding(this.program, cameraUboBlockIndex, CameraUboIndex);
    }
    const lightingUboBlockIndex = gl.getUniformBlockIndex(this.program, "Lighting");
    if (lightingUboBlockIndex !== gl.INVALID_INDEX) {
      gl.uniformBlockBinding(this.program, lightingUboBlockIndex, LightingUboIndex);
    }
  }

  public getAttribute(attributeName: string): number | undefined {
    const attribute = this.gl.getAttribLocation(this.program, attributeName);
    if (attribute < 0) {
      return undefined;
    } else {
      return attribute;
    }
  }

  public getUniform(uniformName: string): WebGLUniformLocation | undefined {
    const uniform = this.gl.getUniformLocation(this.program, uniformName);
    if (uniform === null) {
      return undefined;
    }

    return uniform;
  }
}
