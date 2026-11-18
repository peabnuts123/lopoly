import type { EngineConfig, IEngine } from "@lopoly/engine/Engine";
import type { Ubo } from "@lopoly/engine/materials/Ubo";
import { Color3 } from "@lopoly/engine/math/Color3";
import { Vector3 } from "@lopoly/engine/math/Vector3";

import { DirectionalLightNode, PointLightNode } from "./nodes";

const SizeOfVec4 = 4;

export const LightingUboPropertyNames = [
  'ambientLightColor',
  'pointLightPositions',
  'pointLightColors',
  'pointLightIntensities',
  'pointLightRanges',
  'directionalLightOrientations',
  'directionalLightColors',
  'directionalLightIntensities',
] as const;
export type LightingUboPropertyName = (typeof LightingUboPropertyNames)[number];
export type LightingUbo = Ubo<LightingUboPropertyName>;
export const LightingUboName = 'Lighting';
export const LightingUboIndex = 2;

export class SceneLighting {
  private readonly engine: IEngine;

  public ambientColor: Color3;
  private pointLights: PointLightNode[];
  private directionalLights: DirectionalLightNode[];

  private tmp_pointLightPositionData: Float32Array = new Float32Array();
  private tmp_pointLightColorData: Float32Array = new Float32Array();
  private tmp_pointLightIntensityData: Float32Array = new Float32Array();
  private tmp_pointLightRangeData: Float32Array = new Float32Array();
  private tmp_directionalLightOrientationData: Float32Array = new Float32Array();
  private tmp_directionalLightColorData: Float32Array = new Float32Array;
  private tmp_directionalLightIntensityData: Float32Array = new Float32Array();
  private tmp_directionalLightVectors: Vector3[] = [];

  public constructor(engine: IEngine) {
    this.engine = engine;
    this.pointLights = [];
    this.directionalLights = [];
    this.ambientColor = new Color3(0, 0, 0);
  }

  public bindToUbo(gl: WebGL2RenderingContext, ubo: LightingUbo): void {
    this.ensureTmpValuesAreInitialised();

    // Ambient light
    ubo.setProperty(gl, 'ambientLightColor', new Float32Array([
      this.ambientColor.r / 0xFF,
      this.ambientColor.g / 0xFF,
      this.ambientColor.b / 0xFF,
    ]));

    // Point lights
    /* Bind light data */
    // Populate light data until we've reached the max lights
    let i = 0;
    for (const light of this.pointLights) {
      if (light.enabled) {
        /* - Position */
        this.tmp_pointLightPositionData[i * SizeOfVec4 + 0] = light.absolutePosition.x;
        this.tmp_pointLightPositionData[i * SizeOfVec4 + 1] = light.absolutePosition.y;
        this.tmp_pointLightPositionData[i * SizeOfVec4 + 2] = light.absolutePosition.z;
        /* - Color */
        this.tmp_pointLightColorData[i * SizeOfVec4 + 0] = light.color.r / 0xFF;
        this.tmp_pointLightColorData[i * SizeOfVec4 + 1] = light.color.g / 0xFF;
        this.tmp_pointLightColorData[i * SizeOfVec4 + 2] = light.color.b / 0xFF;
        /* Intensity */
        this.tmp_pointLightIntensityData[i * SizeOfVec4 + 0] = light.intensity;
        /* Range */
        this.tmp_pointLightRangeData[i * SizeOfVec4 + 0] = light.range;

        i++;
        if (i >= this.config.maxPointLights) {
          break;
        }
      }
    }
    // Fill remaining space in buffers with empty data
    while (i < this.config.maxPointLights) {
      /* Slot is empty - disable */
      /* - Position */
      this.tmp_pointLightPositionData[i * SizeOfVec4 + 0] = 0;
      this.tmp_pointLightPositionData[i * SizeOfVec4 + 1] = 0;
      this.tmp_pointLightPositionData[i * SizeOfVec4 + 2] = 0;
      /* - Color */
      this.tmp_pointLightColorData[i * SizeOfVec4 + 0] = 0;
      this.tmp_pointLightColorData[i * SizeOfVec4 + 1] = 0;
      this.tmp_pointLightColorData[i * SizeOfVec4 + 2] = 0;
      /* Intensity */
      this.tmp_pointLightIntensityData[i * SizeOfVec4 + 0] = 0;
      /* Range */
      this.tmp_pointLightRangeData[i * SizeOfVec4 + 0] = 0;

      i++;
    }
    // Bind buffers to GL
    ubo.setProperty(gl, 'pointLightPositions', this.tmp_pointLightPositionData);
    ubo.setProperty(gl, 'pointLightColors', this.tmp_pointLightColorData);
    ubo.setProperty(gl, 'pointLightIntensities', this.tmp_pointLightIntensityData);
    ubo.setProperty(gl, 'pointLightRanges', this.tmp_pointLightRangeData);

    // Directional lights
    /* Bind light data */
    // Populate light data until we've reached the max lights
    i = 0;
    for (const light of this.directionalLights) {
      if (light.enabled) {
        /* Light is present */
        // Calculate direction vector from Quaternion
        light.absoluteRotation.q.rotateVectorInPlace(
          this.tmp_directionalLightVectors[i]
            .setValue(0, 1, 0),
        );
        /* - Orientation */
        this.tmp_directionalLightOrientationData[i * SizeOfVec4 + 0] = this.tmp_directionalLightVectors[i].x;
        this.tmp_directionalLightOrientationData[i * SizeOfVec4 + 1] = this.tmp_directionalLightVectors[i].y;
        this.tmp_directionalLightOrientationData[i * SizeOfVec4 + 2] = this.tmp_directionalLightVectors[i].z;
        /* - Color */
        this.tmp_directionalLightColorData[i * SizeOfVec4 + 0] = light.color.r / 0xFF;
        this.tmp_directionalLightColorData[i * SizeOfVec4 + 1] = light.color.g / 0xFF;
        this.tmp_directionalLightColorData[i * SizeOfVec4 + 2] = light.color.b / 0xFF;
        /* Intensity */
        this.tmp_directionalLightIntensityData[i * SizeOfVec4 + 0] = light.intensity;

        i++;
        if (i >= this.config.maxDirectionalLights) {
          break;
        }
      }
    }
    while (i < this.config.maxDirectionalLights) {
      /* Slot is empty - disable */
      /* - Position */
      this.tmp_directionalLightOrientationData[i * SizeOfVec4 + 0] = 0;
      this.tmp_directionalLightOrientationData[i * SizeOfVec4 + 1] = 0;
      this.tmp_directionalLightOrientationData[i * SizeOfVec4 + 2] = 0;
      /* - Color */
      this.tmp_directionalLightColorData[i * SizeOfVec4 + 0] = 0;
      this.tmp_directionalLightColorData[i * SizeOfVec4 + 1] = 0;
      this.tmp_directionalLightColorData[i * SizeOfVec4 + 2] = 0;
      /* Intensity */
      this.tmp_directionalLightIntensityData[i * SizeOfVec4 + 0] = 0;

      i++;
    }
    // Bind buffers to GL
    ubo.setProperty(gl, 'directionalLightOrientations', this.tmp_directionalLightOrientationData);
    ubo.setProperty(gl, 'directionalLightColors', this.tmp_directionalLightColorData);
    ubo.setProperty(gl, 'directionalLightIntensities', this.tmp_directionalLightIntensityData);
  }

  public registerLight(light: PointLightNode | DirectionalLightNode): void {
    if (light instanceof PointLightNode) {
      this.pointLights.push(light);
      if (this.countActiveLights(this.pointLights) > this.config.maxPointLights) {
        console.warn(`[${SceneLighting.name}] (${this.registerLight.name}) Max point lights exceeded`);
      }
    } else if (light instanceof DirectionalLightNode) {
      this.directionalLights.push(light);
      if (this.countActiveLights(this.directionalLights) > this.config.maxDirectionalLights) {
        console.warn(`[${SceneLighting.name}] (${this.registerLight.name}) Max directional lights exceeded`);
      }
    } else {
      throw new Error(`Unimplemented light type: ${(light as object).constructor.name}`);
    }
  }

  public deregisterLight(light: PointLightNode | DirectionalLightNode): void {
    if (light instanceof PointLightNode) {
      const index = this.pointLights.indexOf(light);
      if (index === -1) {
        console.error(`[${SceneLighting.name}] (${this.deregisterLight.name}) Failed to deregister point light - it was not in the list of registered lights`);
        return;
      } else {
        this.pointLights.splice(index, 1);
      }
    } else if (light instanceof DirectionalLightNode) {
      const index = this.directionalLights.indexOf(light);
      if (index === -1) {
        console.error(`[${SceneLighting.name}] (${this.deregisterLight.name}) Failed to deregister directional light - it was not in the list of registered lights`);
        return;
      } else {
        this.directionalLights.splice(index, 1);
      }
    } else {
      throw new Error(`Unimplemented light type: ${(light as object).constructor.name}`);
    }
  }

  private countActiveLights<T extends PointLightNode | DirectionalLightNode>(collection: T[]): number {
    let count = 0;
    for (const light of collection) {
      if (light.enabled) count++;
    }
    return count;
  }

  private ensureTmpValuesAreInitialised(): void {
    /* Point lights */
    if (this.tmp_pointLightPositionData.length !== this.config.maxPointLights * SizeOfVec4) {
      this.tmp_pointLightPositionData = new Float32Array(this.config.maxPointLights * SizeOfVec4);
    }
    if (this.tmp_pointLightColorData.length !== this.config.maxPointLights * SizeOfVec4) {
      this.tmp_pointLightColorData = new Float32Array(this.config.maxPointLights * SizeOfVec4);
    }
    if (this.tmp_pointLightIntensityData.length !== this.config.maxPointLights * SizeOfVec4) {
      this.tmp_pointLightIntensityData = new Float32Array(this.config.maxPointLights * SizeOfVec4);
    }
    if (this.tmp_pointLightRangeData.length !== this.config.maxPointLights * SizeOfVec4) {
      this.tmp_pointLightRangeData = new Float32Array(this.config.maxPointLights * SizeOfVec4);
    }

    /* Directional lights */
    if (this.tmp_directionalLightOrientationData.length !== this.config.maxDirectionalLights * SizeOfVec4) {
      this.tmp_directionalLightOrientationData = new Float32Array(this.config.maxDirectionalLights * SizeOfVec4);
    }
    if (this.tmp_directionalLightColorData.length !== this.config.maxDirectionalLights * SizeOfVec4) {
      this.tmp_directionalLightColorData = new Float32Array(this.config.maxDirectionalLights * SizeOfVec4);
    }
    if (this.tmp_directionalLightIntensityData.length !== this.config.maxDirectionalLights * SizeOfVec4) {
      this.tmp_directionalLightIntensityData = new Float32Array(this.config.maxDirectionalLights * SizeOfVec4);
    }
    if (this.tmp_directionalLightVectors.length !== this.config.maxDirectionalLights) {
      this.tmp_directionalLightVectors.splice(0);
      for (let i = 0; i < this.config.maxDirectionalLights; i++) {
        this.tmp_directionalLightVectors.push(Vector3.zero());
      }
    }
  }

  private get config(): EngineConfig['lighting'] { return this.engine.config.lighting; }
}
