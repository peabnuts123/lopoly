import type { DrawTask, IEngine } from "@lopoly/engine/Engine";
import { Color3 } from "@lopoly/engine/math/Color3";

import { SceneLighting } from "./SceneLighting";
import type { ForEachChildArgs, SceneNode } from "./SceneNode";
import { DrawableSceneNode } from "./DrawableSceneNode";
import { CameraNode } from "./nodes/CameraNode";

export const DefaultClearColor = Color3.black();

export interface IScene {

  addTopLevelNode(node: SceneNode): SceneNode;
  removeTopLevelNode(node: SceneNode): void;
  onUpdate(dt: number, time: number): void;
  draw(drawQueue: DrawTask[]): void;
  forEachNodeInHierarchy(fn: (node: SceneNode) => void, includeDisabled?: boolean): void;
  registerCamera(camera: CameraNode): void;
  deregisterCamera(camera: CameraNode): void;


  get activeCamera(): CameraNode | undefined;
  get engine(): IEngine;
  set engine(value: IEngine);
  get lighting(): SceneLighting;
  set lighting(value: SceneLighting);
  get clearColour(): Color3;
  set clearColour(value: Color3);
}

export class Scene implements IScene {
  private cameras: CameraNode[];
  public readonly engine: IEngine;
  private topLevelNodes: SceneNode[];
  public readonly lighting: SceneLighting;
  public clearColour: Color3;

  public constructor(engine: IEngine) {
    this.engine = engine;
    this.topLevelNodes = [];
    this.cameras = [];
    this.lighting = new SceneLighting(engine);
    this.clearColour = DefaultClearColor.clone();

    if (engine.activeScene === undefined) {
      engine.loadScene(this);
    }
  }

  public addTopLevelNode<TNode extends SceneNode>(node: TNode): TNode {
    if (node.parent !== undefined) {
      throw new Error(`Cannot add node '${node.name}' to scene as top-level node, it is already the child of '${node.parent.name}'`);
    } else if (this.topLevelNodes.some((topLevelNode) => topLevelNode === node)) {
      console.warn(`Tried to add node '${node.name}' to scene as top-level node but it is already a top-level node`);
    } else {
      this.topLevelNodes.push(node);
    }
    return node;
  }

  public removeTopLevelNode(node: SceneNode): void {
    const index = this.topLevelNodes.indexOf(node);
    if (index >= 0) {
      this.topLevelNodes.splice(index, 1);
    } else {
      console.warn(`Tried to remove node '${node.name}' from scene top-level nodes but it is not a top-level node`);
    }
  }

  public onUpdate(dt: number, time: number): void {
    this.forEachNodeInHierarchy((node) => {
      node.onUpdate(dt, time);
    });
  }

  public draw(drawQueue: DrawTask[]): void {
    this.forEachNodeInHierarchy((node) => {
      if (node instanceof DrawableSceneNode) {
        node.draw(this.engine, drawQueue);
      }
    });
  }

  public registerCamera(camera: CameraNode): void {
    // @NOTE Insert at the start of the collection.
    // Newer camera always takes priority.
    this.cameras.unshift(camera);
  }

  public deregisterCamera(camera: CameraNode): void {
    const index = this.cameras.indexOf(camera);
    if (index === -1) {
      console.error(`[${Scene.name}] (${this.deregisterCamera.name}) Failed to deregister camera - it was not in the list of registered cameras`);
      return;
    }

    this.cameras.splice(index, 1);
  }

  /** Re-usable args instances to call `forEachChild()` without allocating */
  private readonly tmp_forEachNodeInHierarchyArgs_includeDisabled: ForEachChildArgs = { recursive: true, includeDisabled: true };
  private readonly tmp_forEachNodeInHierarchyArgs_excludeDisabled: ForEachChildArgs = { recursive: true, includeDisabled: false };
  public forEachNodeInHierarchy(fn: (node: SceneNode) => void, includeDisabled: boolean = false): void {
    for (const node of this.topLevelNodes) {
      if (node.enabled || includeDisabled) {
        fn(node);
        node.forEachChild(fn, includeDisabled ? this.tmp_forEachNodeInHierarchyArgs_includeDisabled : this.tmp_forEachNodeInHierarchyArgs_excludeDisabled);
      }
    }
  }

  public get activeCamera(): CameraNode | undefined {
    for (const camera of this.cameras) {
      if (camera.enabled) return camera;
    }

    return undefined;
  }
}
