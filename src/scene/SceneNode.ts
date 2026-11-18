import { Vector3 } from "@lopoly/engine/math/Vector3";
import { Matrix4 } from "@lopoly/engine/math/Matrix4";
import { Rotation } from "@lopoly/engine/transform/Rotation";
import { Transform } from "@lopoly/engine/transform/Transform";
import type { Computed } from "@lopoly/engine/util/Computed";

import type { IScene } from "./Scene";

export interface ForEachChildArgs {
  /** Whether to iterate recursively through the entire hierarchy or just this SceneNode's direct children. */
  recursive: boolean;
  /** Whether disabled nodes should be skipped. If this node is disabled, its children will be skipped. */
  includeDisabled: boolean;
}
export const DefaultForEachChildArgs: ForEachChildArgs = {
  recursive: false,
  includeDisabled: true,
};

export interface FindChildArgs {
  /** Whether to iterate recursively through the entire hierarchy or just this SceneNode's direct children. */
  recursive: boolean;
  /** Whether disabled nodes should be skipped (including this node). */
  includeDisabled: boolean;
}
export const DefaultFindChildArgs: FindChildArgs = {
  recursive: false,
  includeDisabled: true,
};

export abstract class SceneNode {
  protected scene: IScene;
  public name: string;
  private _enabled: boolean;
  private _isDestroyed: boolean;

  private transform: Transform<SceneNode>;

  public constructor(scene: IScene, name: string, parent?: SceneNode) {
    // Validate
    if (parent !== undefined && parent.scene !== scene) {
      throw new Error("Cannot set a node's parent to a node from another scene");
    }

    this.scene = scene;
    this.name = name;
    this._enabled = true;

    this.transform = new Transform<SceneNode>(this, parent?.transform);
    this._isDestroyed = false;

    // Add node to scene (if top-level)
    if (parent === undefined) {
      this.scene.addTopLevelNode(this);
    }
  }

  /**
   * Execute a callback function for each child node of this node.
   * @param fn The callback function to execute for each child
   * @param args Args object. See {@link ForEachChildArgs}
   */
  public forEachChild(fn: (child: SceneNode) => void, args?: Partial<ForEachChildArgs>): void {
    const recursive = args?.recursive ?? DefaultForEachChildArgs.recursive;
    const includeDisabled = args?.includeDisabled ?? DefaultForEachChildArgs.includeDisabled;

    // Don't iterate children if this node is disabled (and `includeDisabled` is false)
    if (!includeDisabled && !this.enabled) return;

    this.transform.forEachChild((childTransform) => {
      const child = childTransform.node;
      if (child.enabled || includeDisabled) {
        fn(child);
        if (recursive) {
          child.forEachChild(fn, args);
        }
      }
    }, false);
  }

  public findChild(fn: (child: SceneNode) => boolean, args?: Partial<FindChildArgs>): SceneNode | undefined {
    const recursive = args?.recursive ?? DefaultFindChildArgs.recursive;
    const includeDisabled = args?.includeDisabled ?? DefaultFindChildArgs.includeDisabled;

    // Don't iterate children if this node is disabled (and `includeDisabled` is false)
    if (!includeDisabled && !this.enabled) return undefined;

    let result: SceneNode | undefined = undefined;
    this.transform.forEachChild((childTransform) => {
      // We're iterating with a function, so we can't early return.
      // If we've already found a result, just skip iterating.
      if (result !== undefined) return;

      const child = childTransform.node;
      if (child.enabled || includeDisabled) {
        if (fn(child)) {
          // Child matched, record result (will skip iterating)
          result = child;
        } else if (recursive) {
          // Child did not match, search in children
          result = child.findChild(fn, args);
        }
      }
    }, false);

    return result;
  }

  /**
   * Called each frame to update this node's state. Override this method in subclasses
   * to implement per-frame update logic.
   *
   * @param dt - The time elapsed since the last frame, in seconds
   * @param time - Arbitrary number that increases in real time.
   */
  public onUpdate(dt: number, time: number): void {
    /* No-op */
    // @NOTE Just shushing the linter about `dt` being unused.
    // eslint-disable doesn't work great because `ts` also
    // complains about it.
    void dt;
    void time;
  }

  public destroy(): void {
    // Flag that object has been destroyed to prevent multiple calls
    if (this.isDestroyed) return;
    this._isDestroyed = true;

    // Remove node from scene hierarchy
    if (this.parent === undefined) {
      this.scene.removeTopLevelNode(this);
    } else {
      this.transform.parent = undefined;
    }

    // Fire callbacks
    this.onDestroyedSafe();
    this.forEachChild((child) => child.onDestroyedSafe(), { recursive: true, includeDisabled: true });
  }

  protected onEnabled(): void { }
  protected onDisabled(): void { }
  protected onDestroyed(): void { }
  private onEnabledSafe(): void {
    try {
      this.onEnabled();
    } catch (e) {
      console.error(`'${this.onEnabled.name}()' callback threw error: `, e);
    }
  }
  private onDisabledSafe(): void {
    try {
      this.onDisabled();
    } catch (e) {
      console.error(`'${this.onDisabled.name}()' callback threw error: `, e);
    }
  }
  private onDestroyedSafe(): void {
    try {
      this.onDestroyed();
    } catch (e) {
      console.error(`'${this.onDestroyed.name}()' callback threw error: `, e);
    }
  }

  public get enabledSelf(): boolean { return this._enabled; }
  public get enabled(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: SceneNode | undefined = this;
    while (node !== undefined) {
      if (node._enabled === false) {
        // This node or a parent of this node is disabled
        return false;
      }

      node = node.parent;
    }

    // Nothing in the hierarchy is disabled, so this node is enabled
    return true;
  }
  public set enabled(value: boolean) {
    // Avoid redundant work. State cannot change if we don't assign a new value
    if (this._enabled === value) return;

    // We need to track whether this node's `enabled` status actually changes,
    // to make sure we fire callbacks only when appropriate.
    // For example: If this node's parent is disabled, and we change this node also
    // to disabled, that will technically change its `_enabled` value, but it and
    // all of its descendants will all already be disabled, so their status won't actually change.
    const oldIsEnabled = this.enabled;

    if (value === true) {
      /* Enabling */

      // Set flag
      this._enabled = value;

      // Only fire callbacks if this node's `enabled` state actually changed
      const newIsEnabled = this.enabled;
      if (newIsEnabled !== oldIsEnabled) {
        // Fire `onEnabled()` callbacks
        this.onEnabledSafe();
        this.forEachChild((child) => child.onEnabledSafe(), { includeDisabled: false, recursive: true });
      }
    } else {
      /* Disabling */

      // Collect all currently enabled children
      const enabledChildren: SceneNode[] = [];
      this.forEachChild((child) => enabledChildren.push(child), { includeDisabled: false, recursive: true });

      // Set flag
      this._enabled = value;
      const newIsEnabled = this.enabled;

      // Only fire callbacks if this node's `enabled` state actually changed
      if (newIsEnabled !== oldIsEnabled) {
        // Fire `onDisabled()` callbacks
        this.onDisabledSafe();
        for (const enabledChild of enabledChildren) {
          enabledChild.onDisabledSafe();
        }
      }
    }
  }

  public get parent(): SceneNode | undefined { return this.transform.parent?.node; }
  public set parent(value: SceneNode | undefined) {
    // Avoid redundant work
    if (this.parent === value) return;

    // Validate
    if (value !== undefined && value.scene !== this.scene) {
      throw new Error("Cannot set a node's parent to a node from another scene");
    }
    if (value === this) {
      throw new Error("Cannot set a node as its own parent");
    }
    if (value !== undefined) {
      const descendant = this.findChild(
        (child) => child === value,
        { recursive: true, includeDisabled: true },
      );
      if (descendant !== undefined) {
        throw new Error("Cannot set a node's parent to one of its descendants");
      }
    }

    /**
     * true = enabled
     * false = disabled
     * undefined = top-level node
     */
    const oldParentType = this.parent?.enabled;
    /** Whether the old parent was enabled (or undefined) */
    const oldParentEnabled = oldParentType ?? true;
    /**
     * true = enabled
     * false = disabled
     * undefined = top-level node
     */
    const newParentType = value?.enabled;
    /** Whether the new parent is enabled (or undefined) */
    const newParentEnabled = newParentType ?? true;

    /**
     * Inform scene of any top-level node changes.
     * Must be called AFTER parent has changed but BEFORE onEnabled/onDisabled callbacks.
     */
    const updateTopLevelSceneNodes = (): void => {
      if (newParentType === undefined) {
        // Clearing parent / moving node to top-level
        this.scene.addTopLevelNode(this);
      } else if (oldParentType === undefined) {
        // Moving parent from top level to the child of another node
        this.scene.removeTopLevelNode(this);
      }
    };

    const oldIsEnabled = this.enabled;

    if (oldParentEnabled === false && newParentEnabled === true) {
      // Moving from disabled parent to enabled parent.
      // Fire `onEnabled` callbacks on newly enabled nodes.
      this.transform.parent = value?.transform;

      updateTopLevelSceneNodes();

      // Only fire callbacks if this node's `enabled` state actually changed
      const newIsEnabled = this.enabled;
      if (newIsEnabled !== oldIsEnabled) {
        this.onEnabledSafe();
        this.forEachChild((child) => child.onEnabledSafe(), { includeDisabled: false, recursive: true });
      }
    } else if (oldParentEnabled === true && newParentEnabled === false) {
      // Moving from enabled parent to disabled parent.
      // Fire `onDisabled` callbacks on any currently enabled nodes.

      // Collect all currently enabled children
      const enabledChildren: SceneNode[] = [];
      this.forEachChild((child) => enabledChildren.push(child), { includeDisabled: false, recursive: true });

      // Set parent
      this.transform.parent = value?.transform;

      updateTopLevelSceneNodes();

      // Only fire callbacks if this node's `enabled` state actually changed
      const newIsEnabled = this.enabled;
      if (newIsEnabled !== oldIsEnabled) {
        // Fire `onDisabled()` callbacks
        this.onDisabledSafe();
        for (const enabledChild of enabledChildren) {
          enabledChild.onDisabledSafe();
        }
      }
    } else {
      // Old / new parent have same `enabled` status. No callbacks needed.
      this.transform.parent = value?.transform;

      updateTopLevelSceneNodes();
    }
  }

  public get isDestroyed(): boolean { return this._isDestroyed; }

  public get position(): Vector3 { return this.transform.position; }
  public set position(value: Vector3) { this.transform.position = value; }
  public get rotation(): Rotation { return this.transform.rotation; }
  public get scale(): Vector3 { return this.transform.scale; }
  public set scale(value: Vector3) { this.transform.scale = value; }

  public get absolutePosition(): Vector3 { return this.transform.absolutePosition; }
  public set absolutePosition(value: Vector3) { this.transform.absolutePosition = value; }
  public get absoluteRotation(): Rotation { return this.transform.absoluteRotation; }
  public get absoluteScale(): Vector3 { return this.transform.absoluteScale; }
  public set absoluteScale(value: Vector3) { this.transform.absoluteScale = value; }

  public get worldMatrix(): Matrix4 { return this.transform.worldMatrix; }
  public get worldMatrixComputed(): Computed<Matrix4> { return this.transform.worldMatrixComputed; }
}
