import { describe, test, expect } from 'vitest';
import { SceneNode } from './SceneNode';
import { MockEngine } from '@test/mock/MockEngine';
import { Scene, type IScene } from './Scene';

describe(SceneNode.name, () => {
  describe("enabled", () => {
    test("Disabling a top-level node marks it as disabled, fires `onDisabled()`", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const node = new MockSceneNode(scene, 'mock:node');

      const initialIsEnabled = node.enabled;

      // Test
      node.enabled = false;

      const updatedIsEnabled = node.enabled;

      // Assert
      expect(initialIsEnabled).toBe(true);
      expect(updatedIsEnabled).toBe(false);
      expect(node.timesOnEnabledCalled).toBe(0);
      expect(node.timesOnDisabledCalled).toBe(1);
    });
    test("Enabling a disabled top-level node marks it as enabled, fires `onEnabled()`", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const node = new MockSceneNode(scene, 'mock:node', { enabled: false });

      const initialIsEnabled = node.enabled;

      // Test
      node.enabled = true;

      const updatedIsEnabled = node.enabled;

      // Assert
      expect(initialIsEnabled).toBe(false);
      expect(updatedIsEnabled).toBe(true);
      expect(node.timesOnEnabledCalled).toBe(1);
      expect(node.timesOnDisabledCalled).toBe(0);
    });
    test("Disabling a parent node marks an enabled child as disabled, fires `onDisabled()`", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode');
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: parentNode });

      const initialParentNodeIsEnabled = parentNode.enabled;
      const initialChildNodeIsEnabled = childNode.enabled;

      // Test
      parentNode.enabled = false;

      const updatedParentNodeIsEnabled = parentNode.enabled;
      const updatedChildNodeIsEnabled = childNode.enabled;

      // Assert
      expect(initialParentNodeIsEnabled).toBe(true);
      expect(initialChildNodeIsEnabled).toBe(true);
      expect(updatedParentNodeIsEnabled).toBe(false);
      expect(updatedChildNodeIsEnabled).toBe(false);
      expect(parentNode.timesOnEnabledCalled).toBe(0);
      expect(parentNode.timesOnDisabledCalled).toBe(1);
      expect(childNode.timesOnEnabledCalled).toBe(0);
      expect(childNode.timesOnDisabledCalled).toBe(1);
    });
    test("Enabling a disabled parent node marks an enabled child as enabled, fires `onEnabled()`", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode', { enabled: false });
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: parentNode });

      const initialParentNodeIsEnabled = parentNode.enabled;
      const initialChildNodeIsEnabled = childNode.enabled;

      // Test
      parentNode.enabled = true;

      const updatedParentNodeIsEnabled = parentNode.enabled;
      const updatedChildNodeIsEnabled = childNode.enabled;

      // Assert
      expect(initialParentNodeIsEnabled).toBe(false);
      expect(initialChildNodeIsEnabled).toBe(false);
      expect(updatedParentNodeIsEnabled).toBe(true);
      expect(updatedChildNodeIsEnabled).toBe(true);
      expect(parentNode.timesOnEnabledCalled).toBe(1);
      expect(parentNode.timesOnDisabledCalled).toBe(0);
      expect(childNode.timesOnEnabledCalled).toBe(1);
      expect(childNode.timesOnDisabledCalled).toBe(0);
    });
    test("Disabling a child of a disabled parent does not fire `onDisabled()` on itself or its child", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode', { enabled: false });
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: parentNode });
      const grandchildNode = new MockSceneNode(scene, 'mock:grandchildNode', { parent: childNode });

      const initialParentNodeIsEnabled = parentNode.enabled;
      const initialChildNodeIsEnabled = childNode.enabled;
      const initialGrandchildNodeIsEnabled = grandchildNode.enabled;

      // Test
      childNode.enabled = false;

      const updatedParentNodeIsEnabled = parentNode.enabled;
      const updatedChildNodeIsEnabled = childNode.enabled;
      const updatedGrandchildNodeIsEnabled = grandchildNode.enabled;

      // Assert
      expect(initialParentNodeIsEnabled).toBe(false);
      expect(initialChildNodeIsEnabled).toBe(false);
      expect(initialGrandchildNodeIsEnabled).toBe(false);
      expect(updatedParentNodeIsEnabled).toBe(false);
      expect(updatedChildNodeIsEnabled).toBe(false);
      expect(updatedGrandchildNodeIsEnabled).toBe(false);
      expect(parentNode.timesOnDisabledCalled).toBe(0);
      expect(childNode.timesOnDisabledCalled).toBe(0);
      expect(grandchildNode.timesOnDisabledCalled).toBe(0);
    });
    test("Enabling a child of a disabled parent does not fire `onEnabled()` on itself or its child", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode', { enabled: false });
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: parentNode, enabled: false });
      const grandchildNode = new MockSceneNode(scene, 'mock:grandchildNode', { parent: childNode });

      const initialParentNodeIsEnabled = parentNode.enabled;
      const initialChildNodeIsEnabled = childNode.enabled;
      const initialGrandchildNodeIsEnabled = grandchildNode.enabled;

      // Test
      childNode.enabled = true;

      const updatedParentNodeIsEnabled = parentNode.enabled;
      const updatedChildNodeIsEnabled = childNode.enabled;
      const updatedGrandchildNodeIsEnabled = grandchildNode.enabled;

      // Assert
      expect(initialParentNodeIsEnabled).toBe(false);
      expect(initialChildNodeIsEnabled).toBe(false);
      expect(initialGrandchildNodeIsEnabled).toBe(false);
      expect(updatedParentNodeIsEnabled).toBe(false);
      expect(updatedChildNodeIsEnabled).toBe(false);
      expect(updatedGrandchildNodeIsEnabled).toBe(false);
      expect(parentNode.timesOnEnabledCalled).toBe(0);
      expect(childNode.timesOnEnabledCalled).toBe(0);
      expect(grandchildNode.timesOnEnabledCalled).toBe(0);
    });
    test("Setting `enabled` on an already enabled node does not fire `onEnabled()`", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const node = new MockSceneNode(scene, 'mock:node');

      const initialIsEnabled = node.enabled;

      // Test
      node.enabled = true;

      const updatedIsEnabled = node.enabled;

      // Assert
      expect(initialIsEnabled).toBe(true);
      expect(updatedIsEnabled).toBe(true);
      expect(node.timesOnEnabledCalled).toBe(0);
      expect(node.timesOnDisabledCalled).toBe(0);
    });
    test("Setting `disabled` on an already disabled node does not fire `onDisabled()`", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const node = new MockSceneNode(scene, 'mock:node', { enabled: false });

      const initialIsEnabled = node.enabled;

      // Test
      node.enabled = false;

      const updatedIsEnabled = node.enabled;

      // Assert
      expect(initialIsEnabled).toBe(false);
      expect(updatedIsEnabled).toBe(false);
      expect(node.timesOnEnabledCalled).toBe(0);
      expect(node.timesOnDisabledCalled).toBe(0);
    });
    test("Enabling a parent of a disabled child does not fire `onEnabled()` on the child", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode', { enabled: false });
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: parentNode, enabled: false });

      const initialParentNodeIsEnabled = parentNode.enabled;
      const initialChildNodeIsEnabled = childNode.enabled;

      // Test
      parentNode.enabled = true;

      const updatedParentNodeIsEnabled = parentNode.enabled;
      const updatedChildNodeIsEnabled = childNode.enabled;

      // Assert
      expect(initialParentNodeIsEnabled).toBe(false);
      expect(initialChildNodeIsEnabled).toBe(false);
      expect(updatedParentNodeIsEnabled).toBe(true);
      expect(updatedChildNodeIsEnabled).toBe(false);
      expect(parentNode.timesOnEnabledCalled).toBe(1);
      expect(childNode.timesOnEnabledCalled).toBe(0);
    });
    test("Disabling a parent of a disabled child does not fire `onDisabled()` on the child", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode');
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: parentNode, enabled: false });

      const initialParentNodeIsEnabled = parentNode.enabled;
      const initialChildNodeIsEnabled = childNode.enabled;

      // Test
      parentNode.enabled = false;

      const updatedParentNodeIsEnabled = parentNode.enabled;
      const updatedChildNodeIsEnabled = childNode.enabled;

      // Assert
      expect(initialParentNodeIsEnabled).toBe(true);
      expect(initialChildNodeIsEnabled).toBe(false);
      expect(updatedParentNodeIsEnabled).toBe(false);
      expect(updatedChildNodeIsEnabled).toBe(false);
      expect(parentNode.timesOnDisabledCalled).toBe(1);
      expect(childNode.timesOnDisabledCalled).toBe(0);
    });
    test("Disabling a node only fires `onDisabled()` for enabled nodes in its hierarchy", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode');
      const enabledChildNode = new MockSceneNode(scene, 'mock:enabledChildNode', { parent: parentNode });
      const enabledGrandchildNode = new MockSceneNode(scene, 'mock:enabledGrandchildNode', { parent: enabledChildNode });
      const disabledChildNode = new MockSceneNode(scene, 'mock:disabledChildNode', { parent: parentNode, enabled: false });
      const disabledGrandchildNode = new MockSceneNode(scene, 'mock:disabledGrandchildNode', { parent: disabledChildNode });

      const initialParentNodeIsEnabled = parentNode.enabled;
      const initialEnabledChildNodeIsEnabled = enabledChildNode.enabled;
      const initialEnabledGrandchildNodeIsEnabled = enabledGrandchildNode.enabled;
      const initialDisabledChildNodeIsEnabled = disabledChildNode.enabled;
      const initialDisabledGrandchildNodeIsEnabled = disabledGrandchildNode.enabled;

      // Test
      parentNode.enabled = false;

      const updatedParentNodeIsEnabled = parentNode.enabled;
      const updatedEnabledChildNodeIsEnabled = enabledChildNode.enabled;
      const updatedEnabledGrandchildNodeIsEnabled = enabledGrandchildNode.enabled;
      const updatedDisabledChildNodeIsEnabled = disabledChildNode.enabled;
      const updatedDisabledGrandchildNodeIsEnabled = disabledGrandchildNode.enabled;

      // Assert
      expect(initialParentNodeIsEnabled).toBe(true);
      expect(initialEnabledChildNodeIsEnabled).toBe(true);
      expect(initialEnabledGrandchildNodeIsEnabled).toBe(true);
      expect(initialDisabledChildNodeIsEnabled).toBe(false);
      expect(initialDisabledGrandchildNodeIsEnabled).toBe(false);
      expect(updatedParentNodeIsEnabled).toBe(false);
      expect(updatedEnabledChildNodeIsEnabled).toBe(false);
      expect(updatedEnabledGrandchildNodeIsEnabled).toBe(false);
      expect(updatedDisabledChildNodeIsEnabled).toBe(false);
      expect(updatedDisabledGrandchildNodeIsEnabled).toBe(false);
      expect(parentNode.timesOnDisabledCalled).toBe(1);
      expect(enabledChildNode.timesOnDisabledCalled).toBe(1);
      expect(enabledGrandchildNode.timesOnDisabledCalled).toBe(1);
      expect(disabledChildNode.timesOnDisabledCalled).toBe(0);
      expect(disabledGrandchildNode.timesOnDisabledCalled).toBe(0);
    });
    test("Enabling a node only fires `onEnabled()` for nodes that become enabled in its hierarchy", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode', { enabled: false });
      const enabledChildNode = new MockSceneNode(scene, 'mock:enabledChildNode', { parent: parentNode });
      const enabledGrandchildNode = new MockSceneNode(scene, 'mock:enabledGrandchildNode', { parent: enabledChildNode });
      const disabledChildNode = new MockSceneNode(scene, 'mock:disabledChildNode', { parent: parentNode, enabled: false });
      const disabledGrandchildNode = new MockSceneNode(scene, 'mock:disabledGrandchildNode', { parent: disabledChildNode, enabled: false });

      const initialParentNodeIsEnabled = parentNode.enabled;
      const initialEnabledChildNodeIsEnabled = enabledChildNode.enabled;
      const initialEnabledGrandchildNodeIsEnabled = enabledGrandchildNode.enabled;
      const initialDisabledChildNodeIsEnabled = disabledChildNode.enabled;
      const initialDisabledGrandchildNodeIsEnabled = disabledGrandchildNode.enabled;

      // Test
      parentNode.enabled = true;

      const updatedParentNodeIsEnabled = parentNode.enabled;
      const updatedEnabledChildNodeIsEnabled = enabledChildNode.enabled;
      const updatedEnabledGrandchildNodeIsEnabled = enabledGrandchildNode.enabled;
      const updatedDisabledChildNodeIsEnabled = disabledChildNode.enabled;
      const updatedDisabledGrandchildNodeIsEnabled = disabledGrandchildNode.enabled;

      // Assert
      expect(initialParentNodeIsEnabled).toBe(false);
      expect(initialEnabledChildNodeIsEnabled).toBe(false);
      expect(initialEnabledGrandchildNodeIsEnabled).toBe(false);
      expect(initialDisabledChildNodeIsEnabled).toBe(false);
      expect(initialDisabledGrandchildNodeIsEnabled).toBe(false);
      expect(updatedParentNodeIsEnabled).toBe(true);
      expect(updatedEnabledChildNodeIsEnabled).toBe(true);
      expect(updatedEnabledGrandchildNodeIsEnabled).toBe(true);
      expect(updatedDisabledChildNodeIsEnabled).toBe(false);
      expect(updatedDisabledGrandchildNodeIsEnabled).toBe(false);
      expect(parentNode.timesOnEnabledCalled).toBe(1);
      expect(enabledChildNode.timesOnEnabledCalled).toBe(1);
      expect(enabledGrandchildNode.timesOnEnabledCalled).toBe(1);
      expect(disabledChildNode.timesOnEnabledCalled).toBe(0);
      expect(disabledGrandchildNode.timesOnEnabledCalled).toBe(0);
    });
    test("Throwing an error from onEnabled() does not interrupt processing", () => {
      // Setup
      class DangerousMockSceneNode extends MockSceneNode {
        public override onEnabled(): void {
          super.onEnabled();
          throw new Error(`Mock error`);
        }
      }
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const node = new DangerousMockSceneNode(scene, 'mock:node', { enabled: false });
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: node });

      // Test
      const testFunc = (): void => {
        node.enabled = true;
      };

      // Assert
      expect(testFunc).not.toThrow();
      expect(node.timesOnEnabledCalled).toBe(1);
      expect(childNode.timesOnEnabledCalled).toBe(1);
    });
    test("Throwing an error from onDisabled() does not interrupt processing", () => {
      // Setup
      class DangerousMockSceneNode extends MockSceneNode {
        public override onDisabled(): void {
          super.onDisabled();
          throw new Error(`Mock error`);
        }
      }
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const node = new DangerousMockSceneNode(scene, 'mock:node');
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: node });

      // Test
      const testFunc = (): void => {
        node.enabled = false;
      };

      // Assert
      expect(testFunc).not.toThrow();
      expect(node.timesOnDisabledCalled).toBe(1);
      expect(childNode.timesOnDisabledCalled).toBe(1);
    });
  });
  describe("parent", () => {
    test("Changing a node's parent between enabled nodes transfers its hierarchy without firing onEnabled/onDisabled callbacks", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const originalParentNode = new MockSceneNode(scene, 'mock:originalParentNode');
      const targetParentNode = new MockSceneNode(scene, 'mock:targetParentNode');
      const node = new MockSceneNode(scene, 'mock:node', { parent: originalParentNode });
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: node });
      const grandchildNode = new MockSceneNode(scene, 'mock:grandchildNode', { parent: childNode });

      const initialNodeParent = node.parent;
      const initialOriginalParentNodeIsEnabled = originalParentNode.enabled;
      const initialTargetParentNodeIsEnabled = targetParentNode.enabled;
      const initialNodeIsEnabled = node.enabled;
      const initialChildNodeIsEnabled = childNode.enabled;
      const initialGrandchildNodeIsEnabled = grandchildNode.enabled;
      const initialOriginalParentChildren = originalParentNode.getAllChildren();
      const initialTargetParentChildren = targetParentNode.getAllChildren();

      // Test
      node.parent = targetParentNode;

      const updatedNodeParent = node.parent;
      const updatedNodeIsEnabled = node.enabled;
      const updatedChildNodeIsEnabled = childNode.enabled;
      const updatedGrandchildNodeIsEnabled = grandchildNode.enabled;
      const updatedOriginalParentChildren = originalParentNode.getAllChildren();
      const updatedTargetParentChildren = targetParentNode.getAllChildren();

      // Assert
      expect(initialNodeParent).toBe(originalParentNode);
      expect(initialOriginalParentNodeIsEnabled).toBe(true);
      expect(initialTargetParentNodeIsEnabled).toBe(true);
      expect(initialNodeIsEnabled).toBe(true);
      expect(initialChildNodeIsEnabled).toBe(true);
      expect(initialGrandchildNodeIsEnabled).toBe(true);
      expect(initialOriginalParentChildren).toContain(node);
      expect(initialOriginalParentChildren).toContain(childNode);
      expect(initialOriginalParentChildren).toContain(grandchildNode);
      expect(initialTargetParentChildren).not.toContain(node);
      expect(updatedNodeParent).toBe(targetParentNode);
      expect(updatedNodeIsEnabled).toBe(true);
      expect(updatedChildNodeIsEnabled).toBe(true);
      expect(updatedGrandchildNodeIsEnabled).toBe(true);
      expect(updatedOriginalParentChildren).not.toContain(node);
      expect(updatedTargetParentChildren).toContain(node);
      expect(updatedTargetParentChildren).toContain(childNode);
      expect(updatedTargetParentChildren).toContain(grandchildNode);
      expect(node.timesOnEnabledCalled).toBe(0);
      expect(node.timesOnDisabledCalled).toBe(0);
      expect(childNode.timesOnEnabledCalled).toBe(0);
      expect(childNode.timesOnDisabledCalled).toBe(0);
      expect(grandchildNode.timesOnEnabledCalled).toBe(0);
      expect(grandchildNode.timesOnDisabledCalled).toBe(0);
    });
    test("Changing a node's parent between disabled nodes transfers its hierarchy without firing onEnabled/onDisabled callbacks", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const originalParentNode = new MockSceneNode(scene, 'mock:originalParentNode', { enabled: false });
      const targetParentNode = new MockSceneNode(scene, 'mock:targetParentNode', { enabled: false });
      const node = new MockSceneNode(scene, 'mock:node', { parent: originalParentNode });
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: node });
      const grandchildNode = new MockSceneNode(scene, 'mock:grandchildNode', { parent: childNode });

      const initialNodeParent = node.parent;
      const initialOriginalParentNodeIsEnabled = originalParentNode.enabled;
      const initialTargetParentNodeIsEnabled = targetParentNode.enabled;
      const initialNodeIsEnabled = node.enabled;
      const initialChildNodeIsEnabled = childNode.enabled;
      const initialGrandchildNodeIsEnabled = grandchildNode.enabled;
      const initialOriginalParentChildren = originalParentNode.getAllChildren();
      const initialTargetParentChildren = targetParentNode.getAllChildren();

      // Test
      node.parent = targetParentNode;

      const updatedNodeParent = node.parent;
      const updatedNodeIsEnabled = node.enabled;
      const updatedChildNodeIsEnabled = childNode.enabled;
      const updatedGrandchildNodeIsEnabled = grandchildNode.enabled;
      const updatedOriginalParentChildren = originalParentNode.getAllChildren();
      const updatedTargetParentChildren = targetParentNode.getAllChildren();

      // Assert
      expect(initialNodeParent).toBe(originalParentNode);
      expect(initialOriginalParentNodeIsEnabled).toBe(false);
      expect(initialTargetParentNodeIsEnabled).toBe(false);
      expect(initialNodeIsEnabled).toBe(false);
      expect(initialChildNodeIsEnabled).toBe(false);
      expect(initialGrandchildNodeIsEnabled).toBe(false);
      expect(initialOriginalParentChildren).toContain(node);
      expect(initialOriginalParentChildren).toContain(childNode);
      expect(initialOriginalParentChildren).toContain(grandchildNode);
      expect(initialTargetParentChildren).not.toContain(node);
      expect(updatedNodeParent).toBe(targetParentNode);
      expect(updatedNodeIsEnabled).toBe(false);
      expect(updatedChildNodeIsEnabled).toBe(false);
      expect(updatedGrandchildNodeIsEnabled).toBe(false);
      expect(updatedOriginalParentChildren).not.toContain(node);
      expect(updatedTargetParentChildren).toContain(node);
      expect(updatedTargetParentChildren).toContain(childNode);
      expect(updatedTargetParentChildren).toContain(grandchildNode);
      expect(node.timesOnEnabledCalled).toBe(0);
      expect(node.timesOnDisabledCalled).toBe(0);
      expect(childNode.timesOnEnabledCalled).toBe(0);
      expect(childNode.timesOnDisabledCalled).toBe(0);
      expect(grandchildNode.timesOnEnabledCalled).toBe(0);
      expect(grandchildNode.timesOnDisabledCalled).toBe(0);
    });
    test("Setting a node's parent to undefined makes it a top-level scene node", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode');
      const node = new MockSceneNode(scene, 'mock:node', { parent: parentNode });

      const initialNodeParent = node.parent;
      const initialTopLevelNodesIncludesNode = scene['topLevelNodes'].includes(node);

      // Test
      node.parent = undefined;

      const updatedNodeParent = node.parent;
      const updatedTopLevelNodesIncludesNode = scene['topLevelNodes'].includes(node);

      // Assert
      expect(initialNodeParent).toBe(parentNode);
      expect(initialTopLevelNodesIncludesNode).toBe(false);
      expect(updatedNodeParent).toBeUndefined();
      expect(updatedTopLevelNodesIncludesNode).toBe(true);
    });
    test("Setting the parent of a top-level node moves its hierarchy underneath the target node", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const targetNode = new MockSceneNode(scene, 'mock:targetNode');
      const node = new MockSceneNode(scene, 'mock:node');

      const initialNodeParent = node.parent;
      const initialTopLevelNodesIncludesNode = scene['topLevelNodes'].includes(node);
      const initialTargetNodeChildren = targetNode.getAllChildren();

      // Test
      node.parent = targetNode;

      const updatedNodeParent = node.parent;
      const updatedTopLevelNodesIncludesNode = scene['topLevelNodes'].includes(node);
      const updatedTargetNodeChildren = targetNode.getAllChildren();

      // Assert
      expect(initialNodeParent).toBeUndefined();
      expect(initialTopLevelNodesIncludesNode).toBe(true);
      expect(initialTargetNodeChildren).not.toContain(node);
      expect(updatedNodeParent).toBe(targetNode);
      expect(updatedTopLevelNodesIncludesNode).toBe(false);
      expect(updatedTargetNodeChildren).toContain(node);
    });
    test("Moving a hierarchy from an enabled parent to a disabled parent disables enabled nodes", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const originalParentNode = new MockSceneNode(scene, 'mock:originalParentNode');
      const targetParentNode = new MockSceneNode(scene, 'mock:targetParentNode', { enabled: false });
      const node = new MockSceneNode(scene, 'mock:node', { parent: originalParentNode });
      const enabledChildNode = new MockSceneNode(scene, 'mock:enabledChildNode', { parent: node });
      const disabledChildNode = new MockSceneNode(scene, 'mock:disabledChildNode', { parent: node, enabled: false });
      const grandchildNode = new MockSceneNode(scene, 'mock:grandchildNode', { parent: disabledChildNode });

      const initialOriginalParentNodeIsEnabled = originalParentNode.enabled;
      const initialTargetParentNodeIsEnabled = targetParentNode.enabled;
      const initialNodeIsEnabled = node.enabled;
      const initialEnabledChildNodeIsEnabled = enabledChildNode.enabled;
      const initialDisabledChildNodeIsEnabled = disabledChildNode.enabled;
      const initialGrandchildNodeIsEnabled = grandchildNode.enabled;

      // Test
      node.parent = targetParentNode;

      const updatedNodeParent = node.parent;
      const updatedNodeIsEnabled = node.enabled;
      const updatedEnabledChildNodeIsEnabled = enabledChildNode.enabled;
      const updatedDisabledChildNodeIsEnabled = disabledChildNode.enabled;
      const updatedGrandchildNodeIsEnabled = grandchildNode.enabled;

      // Assert
      expect(initialOriginalParentNodeIsEnabled).toBe(true);
      expect(initialTargetParentNodeIsEnabled).toBe(false);
      expect(initialNodeIsEnabled).toBe(true);
      expect(initialEnabledChildNodeIsEnabled).toBe(true);
      expect(initialDisabledChildNodeIsEnabled).toBe(false);
      expect(initialGrandchildNodeIsEnabled).toBe(false);
      expect(updatedNodeParent).toBe(targetParentNode);
      expect(updatedNodeIsEnabled).toBe(false);
      expect(updatedEnabledChildNodeIsEnabled).toBe(false);
      expect(updatedDisabledChildNodeIsEnabled).toBe(false);
      expect(updatedGrandchildNodeIsEnabled).toBe(false);
      expect(node.timesOnDisabledCalled).toBe(1);
      expect(enabledChildNode.timesOnDisabledCalled).toBe(1);
      expect(disabledChildNode.timesOnDisabledCalled).toBe(0);
      expect(grandchildNode.timesOnDisabledCalled).toBe(0);
    });
    test("Moving a hierarchy from a disabled parent to an enabled parent enables nodes that are locally enabled", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const originalParentNode = new MockSceneNode(scene, 'mock:originalParentNode', { enabled: false });
      const targetParentNode = new MockSceneNode(scene, 'mock:targetParentNode');
      const node = new MockSceneNode(scene, 'mock:node', { parent: originalParentNode });
      const enabledChildNode = new MockSceneNode(scene, 'mock:enabledChildNode', { parent: node });
      const disabledChildNode = new MockSceneNode(scene, 'mock:disabledChildNode', { parent: node, enabled: false });
      const grandchildNode = new MockSceneNode(scene, 'mock:grandchildNode', { parent: disabledChildNode });

      const initialOriginalParentNodeIsEnabled = originalParentNode.enabled;
      const initialTargetParentNodeIsEnabled = targetParentNode.enabled;
      const initialNodeIsEnabled = node.enabled;
      const initialEnabledChildNodeIsEnabled = enabledChildNode.enabled;
      const initialDisabledChildNodeIsEnabled = disabledChildNode.enabled;
      const initialGrandchildNodeIsEnabled = grandchildNode.enabled;

      // Test
      node.parent = targetParentNode;

      const updatedNodeParent = node.parent;
      const updatedNodeIsEnabled = node.enabled;
      const updatedEnabledChildNodeIsEnabled = enabledChildNode.enabled;
      const updatedDisabledChildNodeIsEnabled = disabledChildNode.enabled;
      const updatedGrandchildNodeIsEnabled = grandchildNode.enabled;

      // Assert
      expect(initialOriginalParentNodeIsEnabled).toBe(false);
      expect(initialTargetParentNodeIsEnabled).toBe(true);
      expect(initialNodeIsEnabled).toBe(false);
      expect(initialEnabledChildNodeIsEnabled).toBe(false);
      expect(initialDisabledChildNodeIsEnabled).toBe(false);
      expect(initialGrandchildNodeIsEnabled).toBe(false);
      expect(updatedNodeParent).toBe(targetParentNode);
      expect(updatedNodeIsEnabled).toBe(true);
      expect(updatedEnabledChildNodeIsEnabled).toBe(true);
      expect(updatedDisabledChildNodeIsEnabled).toBe(false);
      expect(updatedGrandchildNodeIsEnabled).toBe(false);
      expect(node.timesOnEnabledCalled).toBe(1);
      expect(enabledChildNode.timesOnEnabledCalled).toBe(1);
      expect(disabledChildNode.timesOnEnabledCalled).toBe(0);
      expect(grandchildNode.timesOnEnabledCalled).toBe(0);
    });
    test("Moving a hierarchy from a disabled parent to be a top-level node in the scene enables nodes that are locally enabled", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode', { enabled: false });
      const node = new MockSceneNode(scene, 'mock:node', { parent: parentNode });
      const enabledChildNode = new MockSceneNode(scene, 'mock:enabledChildNode', { parent: node });
      const disabledChildNode = new MockSceneNode(scene, 'mock:disabledChildNode', { parent: node, enabled: false });
      const grandchildNode = new MockSceneNode(scene, 'mock:grandchildNode', { parent: disabledChildNode });

      const initialParentNodeIsEnabled = parentNode.enabled;
      const initialNodeIsEnabled = node.enabled;
      const initialEnabledChildNodeIsEnabled = enabledChildNode.enabled;
      const initialDisabledChildNodeIsEnabled = disabledChildNode.enabled;
      const initialGrandchildNodeIsEnabled = grandchildNode.enabled;
      const initialTopLevelNodesIncludesNode = scene['topLevelNodes'].includes(node);

      // Test
      node.parent = undefined;

      const updatedNodeParent = node.parent;
      const updatedNodeIsEnabled = node.enabled;
      const updatedEnabledChildNodeIsEnabled = enabledChildNode.enabled;
      const updatedDisabledChildNodeIsEnabled = disabledChildNode.enabled;
      const updatedGrandchildNodeIsEnabled = grandchildNode.enabled;
      const updatedTopLevelNodesIncludesNode = scene['topLevelNodes'].includes(node);

      // Assert
      expect(initialParentNodeIsEnabled).toBe(false);
      expect(initialNodeIsEnabled).toBe(false);
      expect(initialEnabledChildNodeIsEnabled).toBe(false);
      expect(initialDisabledChildNodeIsEnabled).toBe(false);
      expect(initialGrandchildNodeIsEnabled).toBe(false);
      expect(initialTopLevelNodesIncludesNode).toBe(false);
      expect(updatedNodeParent).toBeUndefined();
      expect(updatedNodeIsEnabled).toBe(true);
      expect(updatedEnabledChildNodeIsEnabled).toBe(true);
      expect(updatedDisabledChildNodeIsEnabled).toBe(false);
      expect(updatedGrandchildNodeIsEnabled).toBe(false);
      expect(updatedTopLevelNodesIncludesNode).toBe(true);
      expect(node.timesOnEnabledCalled).toBe(1);
      expect(enabledChildNode.timesOnEnabledCalled).toBe(1);
      expect(disabledChildNode.timesOnEnabledCalled).toBe(0);
      expect(grandchildNode.timesOnEnabledCalled).toBe(0);
    });
    test("Setting the same parent again has no effect", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode');
      const node = new MockSceneNode(scene, 'mock:node', { parent: parentNode });
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: node });

      const initialNodeParent = node.parent;
      const initialNodeIsEnabled = node.enabled;
      const initialChildNodeIsEnabled = childNode.enabled;
      const initialParentChildren = parentNode.getAllChildren();

      // Test
      node.parent = parentNode;

      const updatedNodeParent = node.parent;
      const updatedNodeIsEnabled = node.enabled;
      const updatedChildNodeIsEnabled = childNode.enabled;
      const updatedParentChildren = parentNode.getAllChildren();

      // Assert
      expect(initialNodeParent).toBe(parentNode);
      expect(initialNodeIsEnabled).toBe(true);
      expect(initialChildNodeIsEnabled).toBe(true);
      expect(initialParentChildren).toHaveLength(2);
      expect(initialParentChildren).toContain(node);
      expect(initialParentChildren).toContain(childNode);
      expect(updatedNodeParent).toBe(parentNode);
      expect(updatedNodeIsEnabled).toBe(true);
      expect(updatedChildNodeIsEnabled).toBe(true);
      expect(updatedParentChildren).toHaveLength(2);
      expect(updatedParentChildren).toContain(node);
      expect(updatedParentChildren).toContain(childNode);
      expect(node.timesOnEnabledCalled).toBe(0);
      expect(node.timesOnDisabledCalled).toBe(0);
      expect(childNode.timesOnEnabledCalled).toBe(0);
      expect(childNode.timesOnDisabledCalled).toBe(0);
    });
    test("Setting a top-level node's parent to undefined again has no effect", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const node = new MockSceneNode(scene, 'mock:node');

      const initialNodeParent = node.parent;
      const initialTopLevelNodesIncludesNode = scene['topLevelNodes'].includes(node);

      // Test
      node.parent = undefined;

      const updatedNodeParent = node.parent;
      const updatedTopLevelNodesIncludesNode = scene['topLevelNodes'].includes(node);

      // Assert
      expect(initialNodeParent).toBeUndefined();
      expect(initialTopLevelNodesIncludesNode).toBe(true);
      expect(updatedNodeParent).toBeUndefined();
      expect(updatedTopLevelNodesIncludesNode).toBe(true);
      expect(node.timesOnEnabledCalled).toBe(0);
      expect(node.timesOnDisabledCalled).toBe(0);
    });
    test("Setting a node's parent to itself throws an error", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const node = new MockSceneNode(scene, 'mock:node');

      // Test
      const testFunc = (): void => {
        node.parent = node;
      };

      // Assert
      expect(testFunc).toThrow("Cannot set a node as its own parent");
    });
    test("Setting a node's parent to its descendant throws an error", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode');
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: parentNode });

      // Test
      const testFunc = (): void => {
        parentNode.parent = childNode;
      };

      // Assert
      expect(testFunc).toThrow("Cannot set a node's parent to one of its descendants");
    });
    test("Setting a node's parent to a node from another scene throws an error", () => {
      // Setup
      const engine = new MockEngine();
      const otherEngine = new MockEngine();
      const scene = new MockScene(engine);
      const otherScene = new MockScene(otherEngine);
      const node = new MockSceneNode(scene, 'mock:node');
      const otherNode = new MockSceneNode(otherScene, 'mock:otherNode');

      // Test
      const testFunc = (): void => {
        node.parent = otherNode;
      };

      // Assert
      expect(testFunc).toThrow("Cannot set a node's parent to a node from another scene");
    });
    test("Constructing a node with a parent from another scene throws an error", () => {
      // Setup
      const engine = new MockEngine();
      const otherEngine = new MockEngine();
      const scene = new MockScene(engine);
      const otherScene = new MockScene(otherEngine);
      const otherParentNode = new MockSceneNode(otherScene, 'mock:otherParentNode');

      // Test
      const createNode = (): MockSceneNode => new MockSceneNode(scene, 'mock:node', { parent: otherParentNode });

      // Assert
      expect(createNode).toThrow("Cannot set a node's parent to a node from another scene");
    });
    test("Top-level membership is correct in `onEnabled()` callback", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode', { enabled: false });
      const node = new MockSceneNode(scene, 'mock:node', { parent: parentNode });
      let isTopLevelDuringCallback: boolean | undefined;
      node.addOnEnabledHook(() => {
        isTopLevelDuringCallback = scene['topLevelNodes'].includes(node);
      });

      // Test
      node.parent = undefined;

      // Assert
      expect(isTopLevelDuringCallback).toBe(true);
    });
    test("Top-level membership is correct in `onDisabled()` callback", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode', { enabled: false });
      const node = new MockSceneNode(scene, 'mock:node');
      let isTopLevelDuringCallback: boolean | undefined;
      node.addOnDisabledHook(() => {
        isTopLevelDuringCallback = scene['topLevelNodes'].includes(node);
      });

      // Test
      node.parent = parentNode;

      // Assert
      expect(isTopLevelDuringCallback).toBe(false);
    });
  });
  describe("destroy", () => {
    test("Destroying a top-level node removes it and its descendants from the scene", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode');
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: parentNode });
      const otherNode = new MockSceneNode(scene, 'mock:otherNode');

      const initialSceneNodes: SceneNode[] = [];
      scene.forEachNodeInHierarchy((node) => initialSceneNodes.push(node), true);

      // Test
      parentNode.destroy();

      const updatedSceneNodes: SceneNode[] = [];
      scene.forEachNodeInHierarchy((node) => updatedSceneNodes.push(node), true);

      // Assert
      expect(initialSceneNodes).toContain(parentNode);
      expect(initialSceneNodes).toContain(childNode);
      expect(initialSceneNodes).toContain(otherNode);
      expect(updatedSceneNodes).not.toContain(parentNode);
      expect(updatedSceneNodes).not.toContain(childNode);
      expect(updatedSceneNodes).toContain(otherNode);
    });
    test("Destroying a child node removes it and its descendants from the scene", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode');
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: parentNode });
      const grandchildNode = new MockSceneNode(scene, 'mock:grandchildNode', { parent: childNode, enabled: false });

      const initialSceneNodes = scene.getAllNodes();
      const initialParentChildren = parentNode.getAllChildren();

      // Test
      childNode.destroy();

      const updatedSceneNodes = scene.getAllNodes();
      const updatedParentChildren = parentNode.getAllChildren();

      // Assert
      expect(initialSceneNodes).toContain(parentNode);
      expect(initialSceneNodes).toContain(childNode);
      expect(initialSceneNodes).toContain(grandchildNode);
      expect(initialParentChildren).toContain(childNode);
      expect(initialParentChildren).toContain(grandchildNode);
      expect(updatedSceneNodes).toContain(parentNode);
      expect(updatedSceneNodes).not.toContain(childNode);
      expect(updatedSceneNodes).not.toContain(grandchildNode);
      expect(updatedParentChildren).not.toContain(childNode);
      expect(updatedParentChildren).not.toContain(grandchildNode);
    });
    test("Destroying a node calls `destroy()` on it and its children", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const parentNode = new MockSceneNode(scene, 'mock:parentNode');
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: parentNode });
      const grandchildNode = new MockSceneNode(scene, 'mock:grandchildNode', { parent: childNode, enabled: false });

      const initialSceneNodes = scene.getAllNodes();
      const initialParentTimesDestroyCalled = parentNode.timesOnDestroyedCalled;
      const initialChildTimesDestroyCalled = childNode.timesOnDestroyedCalled;
      const initialGrandchildTimesDestroyCalled = grandchildNode.timesOnDestroyedCalled;

      // Test
      parentNode.destroy();

      const updatedSceneNodes = scene.getAllNodes();
      const updatedParentTimesDestroyCalled = parentNode.timesOnDestroyedCalled;
      const updatedChildTimesDestroyCalled = childNode.timesOnDestroyedCalled;
      const updatedGrandchildTimesDestroyCalled = grandchildNode.timesOnDestroyedCalled;

      // Assert
      expect(initialSceneNodes).toContain(parentNode);
      expect(initialSceneNodes).toContain(childNode);
      expect(initialSceneNodes).toContain(grandchildNode);
      expect(updatedSceneNodes).not.toContain(parentNode);
      expect(updatedSceneNodes).not.toContain(childNode);
      expect(updatedSceneNodes).not.toContain(grandchildNode);
      expect(initialParentTimesDestroyCalled).toBe(0);
      expect(initialChildTimesDestroyCalled).toBe(0);
      expect(initialGrandchildTimesDestroyCalled).toBe(0);
      expect(updatedParentTimesDestroyCalled).toBe(1);
      expect(updatedChildTimesDestroyCalled).toBe(1);
      expect(updatedGrandchildTimesDestroyCalled).toBe(1);
    });
    test("Destroying a node twice does not fire onDestroyed callback a second time", () => {
      // Setup
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const node = new MockSceneNode(scene, 'mock:node');

      const initialTimesOnDestroyCalled = node.timesOnDestroyedCalled;

      // Test
      node.destroy();
      const firstUpdatedTimesOnDestroyCalled = node.timesOnDestroyedCalled;
      node.destroy();
      const secondUpdatedTimesOnDestroyCalled = node.timesOnDestroyedCalled;



      // Assert
      expect(initialTimesOnDestroyCalled).toBe(0);
      expect(firstUpdatedTimesOnDestroyCalled).toBe(1);
      expect(secondUpdatedTimesOnDestroyCalled).toBe(1);
    });
    test("Throwing an error from onDestroyed() does not interrupt processing", () => {
      // Setup
      class DangerousMockSceneNode extends MockSceneNode {
        public override onDestroyed(): void {
          super.onDestroyed();
          throw new Error(`Mock error`);
        }
      }
      const engine = new MockEngine();
      const scene = new MockScene(engine);
      const node = new DangerousMockSceneNode(scene, 'mock:node');
      const childNode = new MockSceneNode(scene, 'mock:childNode', { parent: node });

      // Test
      const testFunc = (): void => {
        node.destroy();
      };

      // Assert
      expect(testFunc).not.toThrow();
      expect(node.timesOnDestroyedCalled).toBe(1);
      expect(childNode.timesOnDestroyedCalled).toBe(1);
    });
  });
});

interface MockSceneNodeArgs {
  parent?: SceneNode;
  enabled?: boolean;
}

class MockSceneNode extends SceneNode {
  public timesOnEnabledCalled: number = 0;
  public timesOnDisabledCalled: number = 0;
  public timesOnDestroyedCalled: number = 0;

  public constructor(scene: IScene, name: string, args?: MockSceneNodeArgs) {
    super(scene, name, args?.parent);
    if (args?.enabled !== undefined) {
      this['_enabled'] = args.enabled;
    }
  }

  public getAllChildren(): SceneNode[] {
    const children: SceneNode[] = [];
    this.forEachChild((child) => children.push(child), { recursive: true, includeDisabled: true });
    return children;
  }

  private onEnabledHooks: Array<() => void> = [];
  private onDisabledHooks: Array<() => void> = [];
  private onDestroyedHooks: Array<() => void> = [];

  public addOnEnabledHook(fn: () => void): void {
    this.onEnabledHooks.push(fn);
  }
  protected override onEnabled(): void {
    this.timesOnEnabledCalled++;
    for (const fn of this.onEnabledHooks) {
      fn();
    }
  }

  public addOnDisabledHook(fn: () => void): void {
    this.onDisabledHooks.push(fn);
  }
  protected override onDisabled(): void {
    this.timesOnDisabledCalled++;
    for (const fn of this.onDisabledHooks) {
      fn();
    }
  }

  public addOnDestroyedHook(fn: () => void): void {
    this.onDestroyedHooks.push(fn);
  }
  public override onDestroyed(): void {
    this.timesOnDestroyedCalled++;
    for (const fn of this.onDestroyedHooks) {
      fn();
    }
  }

  public inspect(): string {
    return `${this.constructor.name}("${this.name}")`;
  }
}

class MockScene extends Scene {
  public getAllNodes(): SceneNode[] {
    const allNodes: SceneNode[] = [];
    this.forEachNodeInHierarchy((node) => allNodes.push(node), true);
    return allNodes;
  }
}
