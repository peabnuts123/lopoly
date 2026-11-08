import { Vector3, Color3, Quaternion, Color4, rand, chooseRandom } from '@lopoly/engine/math';
import { CameraNode, ModelNode } from '@lopoly/engine/scene/nodes';
import { Model } from '@lopoly/engine/models';
import { Engine } from '@lopoly/engine/Engine';
import { DirectionalLightNode, ObjectNode, Scene, SceneNode } from '@lopoly/engine/scene';
import { WebFileSystem } from '@lopoly/engine/filesystem/WebFileSystem';

import { DebugGeometry } from '@game/util/DebugGeometry';
import { GltfLoader } from '@lopoly/engine/loaders/GltfLoader';
import { Material, ShaderBlendingMode } from '@lopoly/engine/materials';
import { Cubemap, Texture } from '@lopoly/engine/textures';

const MaxRuntimeSeconds = 20;
const fileSystem = new WebFileSystem();
const debugGeometry = new DebugGeometry(fileSystem);

const Flags = {
  /* @NOTE Flags duplicated so they can be turned off via commenting */
  ...{
    LightingEnabled: false,
  },
  LightingEnabled: true,
};

export abstract class Game {
  public static async run(canvas: HTMLCanvasElement): Promise<void> {
    /* Engine */
    const engine = new Engine(canvas, fileSystem, { rendering: { fullScreenDither: true } });
    const scene = new Scene(engine);
    scene.lighting.ambientColor = new Color3(1, 1, 1).scaleSelf(50);
    scene.clearColour = new Color3(60, 128, 255);

    const runLoopHooks: Array<(dt: number, time: number) => void> = [];

    /* Lighting */
    if (Flags.LightingEnabled) {
      const light = new DirectionalLightNode(scene, 'light');
      light.rotation.x = -45;
      light.rotation.z = 180;
    }

    /* Camera */
    const camera = new CameraNode(scene, 'camera', 35);
    camera.position.y = 20;
    camera.position.z = 6;
    camera.pointAt(Vector3.zero().withY(3));

    /* Models */
    const shadowModel = await Model.fromDefinition(engine, {
      rootParts: [
        debugGeometry.simplePart({
          name: 'shadow',
          primitive: debugGeometry.planePrimitive(1, 1),
          material: {
            name: 'shadow',
            alpha: { mode: 'BLEND' },
          },
        }),
      ],
      animations: [],
      dependencies: [],
    });
    const shadowMaterial = new Material({
      blendingMode: ShaderBlendingMode.Subtractive(),
      diffuseColor: Color4.white().scaleSelf(0.3).withA(0),
      diffuseTexture: await Texture.load(engine, '/textures/shadow.png'),
      unlit: true,
    });

    const gemModelDefinition = await GltfLoader.loadModel('/models/gem.glb', fileSystem);
    const gemModel = await Model.fromDefinition(engine, gemModelDefinition);
    const shineCubemap = await Cubemap.loadBoxNet(engine, '/textures/cubemaps/shine_box-net.png');
    const gemMaterial = new Material({
      diffuseColor: Color4.fuchsia(),
      reflectionCubemap: shineCubemap,
      reflectionIntensity: 1,
    });
    gemModel.setMaterialOverride('Gem', gemMaterial);

    /* Scene */
    const numGems = 50;
    const allGems: SceneNode[] = [];
    for (let i = 0; i < numGems; i++) {
      allGems.push(createGem(12));
    }


    /* Run */
    engine.run((dt, time, stop) => {
      runLoopHooks.forEach((hook) => hook(dt, time));

      if (time > MaxRuntimeSeconds) {
        stop();
      }
    });

    function createGem(range: number): SceneNode {
      const gemParent = new ObjectNode(scene, 'gem:parent');
      const gem = new ModelNode(scene, 'gem', gemModel, gemParent);
      gem.setMaterialOverride('Gem', new Material({
        diffuseColor: chooseRandom([
          Color4.red(),
          Color4.green(),
          Color4.blue(),
          Color4.fuchsia(),
          Color4.yellow(),
        ]),
      }));
      gem.rotation.x = -45;

      gemParent.position = getNonIntersectingGemPosition(range);
      const animationOffset = rand(0, 1);

      const shadow = new ModelNode(scene, 'gem:shadow', shadowModel, gemParent);
      shadow.position.y = -0.6;
      shadow.scale.scaleSelf(1.7);

      const GemRotatePeriodSeconds = 3;
      runLoopHooks.push((_dt, time) => {
        const t = ((time / GemRotatePeriodSeconds) + animationOffset) * 360;
        gem.rotation.q = Quaternion.fromAxisAngle(Vector3.right(), 45)
          .multiplySelf(Quaternion.fromAxisAngle(Vector3.up(), -t));
        gemParent.rotation.z = t;

        shadow.absoluteRotation.q = Quaternion.identity();
      });



      shadow.setMaterialOverride('shadow', shadowMaterial);


      return gemParent;
    }

    function getNonIntersectingGemPosition(range: number): Vector3 {
      const MinimumDistance = 2;

      let candidatePosition: Vector3;
      let shortest: number;

      do {
        candidatePosition = new Vector3(rand(-range, range), rand(-range, range), 0);
        shortest = Infinity;
        for (const gem of allGems) {
          const distance = candidatePosition.subtract(gem.position).length();
          if (distance < shortest) {
            shortest = distance;
          }
        }
      } while (shortest < MinimumDistance);

      return candidatePosition;
    }
  }
}
