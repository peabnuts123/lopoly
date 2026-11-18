import { describe, test, expect } from 'vitest';

import { Vector3 } from '@lopoly/engine/math/Vector3';
import { AxisAlignedBoundingBox } from '@lopoly/engine/collision';
import { BoxColliderNode } from '@lopoly/engine/scene/nodes/BoxColliderNode';
import { MockSceneNode } from '@test/mock/MockSceneNode';
import { createMockScene } from '@test/util';
import type { Triangle } from "@lopoly/engine/models/geometry";

import { RayCast } from './RayCast';

describe("Ray casting", () => {
  describe("Ray-BoxColliderNode intersection", () => {
    test("Returns the nearest forward hit for a rotated box", () => {
      // Setup
      const { scene } = createMockScene();
      const collider = new BoxColliderNode(scene, "box", 0, {
        x: 2, y: 2, z: 4,
      });
      collider.rotation.y = 90;
      const rayOrigin = new Vector3(0, 0, 3);
      const rayDirection = new Vector3(0, 0, -2);

      // Test
      const result = RayCast.intersectBoxCollider(rayOrigin, rayDirection, collider);

      // Assert
      expect(result).toBeCloseTo(1);
    });

    test("Returns undefined when the ray misses the box", () => {
      // Setup
      const { scene } = createMockScene();
      const collider = new BoxColliderNode(scene, "box", 0, {
        x: 2, y: 2, z: 2,
      });
      const rayOrigin = new Vector3(2, 0, 3);
      const rayDirection = new Vector3(0, 0, -1);

      // Test
      const result = RayCast.intersectBoxCollider(rayOrigin, rayDirection, collider);

      // Assert
      expect(result).toBeUndefined();
    });

    test("Returns zero when the ray starts inside the box", () => {
      // Setup
      const { scene } = createMockScene();
      const collider = new BoxColliderNode(scene, "box", 0, {
        x: 2, y: 2, z: 2,
      });
      const rayOrigin = new Vector3(0, 0, 0);
      const rayDirection = new Vector3(1, 0, 0);

      // Test
      const result = RayCast.intersectBoxCollider(rayOrigin, rayDirection, collider);

      // Assert
      expect(result).toBe(0);
    });

    test("Considers the collider's full transform hierarchy", () => {
      // Setup
      const { scene } = createMockScene();
      const parent = new MockSceneNode(scene, "parent");
      const collider = new BoxColliderNode(scene, "box", 0, {
        x: 2, y: 2, z: 4,
      }, parent);
      collider.position.z = 1;

      // Mutate parent transform
      parent.position.setValue(3, -2, 5);
      parent.rotation.y = 90;
      parent.scale.setValue(2, 3, 4);

      const rayOrigin = new Vector3(7, -2, 10);
      const rayDirection = new Vector3(0, 0, -3);

      // Test
      const result = RayCast.intersectBoxCollider(rayOrigin, rayDirection, collider);

      // Assert
      expect(result).toBeCloseTo(1);
    });

    test("Returns the closest hit for a box with negative scale", () => {
      // Setup
      const { scene } = createMockScene();
      const collider = new BoxColliderNode(scene, "box", 0, {
        x: 2, y: 2, z: 2,
      });
      collider.scale.setValue(-1, 1, 1);
      const rayOrigin = new Vector3(4, 0, 0);
      const rayDirection = new Vector3(-3, 0, 0);

      // Test
      const result = RayCast.intersectBoxCollider(rayOrigin, rayDirection, collider);

      // Assert
      expect(result).toBeCloseTo(1);
    });

    test("Returns undefined when the box is behind the ray", () => {
      // Setup
      const { scene } = createMockScene();
      const collider = new BoxColliderNode(scene, "box", 0, {
        x: 2, y: 2, z: 2,
      });
      const rayOrigin = new Vector3(0, 0, 3);
      const rayDirection = new Vector3(0, 0, 1);

      // Test
      const result = RayCast.intersectBoxCollider(rayOrigin, rayDirection, collider);

      // Assert
      expect(result).toBeUndefined();
    });

    test("Returns undefined when the box has zero scale", () => {
      // Setup
      const { scene } = createMockScene();
      const collider = new BoxColliderNode(scene, "box", 0, {
        x: 2, y: 2, z: 2,
      });
      const rayOrigin = new Vector3(0, 0, 3);
      const rayDirection = new Vector3(0, 0, -1);
      const initialResult = RayCast.intersectBoxCollider(rayOrigin, rayDirection, collider);

      // Test
      collider.scale.z = 0;
      const updatedResult = RayCast.intersectBoxCollider(rayOrigin, rayDirection, collider);

      // Assert
      expect(initialResult).toBe(2);
      expect(updatedResult).toBeUndefined();
    });
  });

  describe("Ray-AABB intersection", () => {
    test("Against corner of unit cube", () => {
      // Setup
      const size = 1;
      const aabb = new AxisAlignedBoundingBox({
        xMin: -size,
        xMax: size,
        yMin: -size,
        yMax: size,
        zMin: -size,
        zMax: size,
      });

      const rayOrigin = new Vector3(-size * 2, -size * 2, -size * 2);
      const rayDirection = new Vector3(size, size, size);

      // Test
      const result = RayCast.intersectAABB(rayOrigin, rayDirection, aabb);
      const intersectionPoint = result === undefined ? undefined : rayDirection.scale(result).addSelf(rayOrigin);

      // Assert
      expect(result).toBe(1);
      expect(intersectionPoint).toEqual(new Vector3(-size, -size, -size));
    });

    test("Axis-aligned against middle of AABB", () => {
      // Setup
      const size = 1;
      const aabb = new AxisAlignedBoundingBox({
        xMin: -size,
        xMax: size,
        yMin: -size,
        yMax: size,
        zMin: -size,
        zMax: size,
      });

      const rayOrigin = new Vector3(0, 0, size * 2);
      const rayDirection = new Vector3(0, 0, -size);

      // Test
      const result = RayCast.intersectAABB(rayOrigin, rayDirection, aabb);
      const intersectionPoint = rayDirection.scale(result!).addSelf(rayOrigin);

      // Assert
      expect(result).toBe(1);
      expect(intersectionPoint).toEqual(new Vector3(0, 0, size));
    });

    test("No intersection", () => {
      // Setup
      const size = 1;
      const aabb = new AxisAlignedBoundingBox({
        xMin: -size,
        xMax: size,
        yMin: -size,
        yMax: size,
        zMin: -size,
        zMax: size,
      });

      const rayOrigin = new Vector3(-size * 2, 0, size * 2);
      const rayDirection = new Vector3(0, 0, -size);

      // Test
      const result = RayCast.intersectAABB(rayOrigin, rayDirection, aabb);

      // Assert
      expect(result).toBeUndefined();
    });
    test("Negative / reverse intersection", () => {
      // Setup
      const size = 1;
      const aabb = new AxisAlignedBoundingBox({
        xMin: -size,
        xMax: size,
        yMin: -size,
        yMax: size,
        zMin: -size,
        zMax: size,
      });

      const rayOrigin = new Vector3(-size * 2, -size * 2, -size * 2);
      const rayDirection = new Vector3(-size, -size, -size);

      // Test
      const result = RayCast.intersectAABB(rayOrigin, rayDirection, aabb);

      // Assert
      expect(result).toBeUndefined();
    });
    test("Ray origin inside AABB", () => {
      // Setup
      const size = 1;
      const aabb = new AxisAlignedBoundingBox({
        xMin: -size,
        xMax: size,
        yMin: -size,
        yMax: size,
        zMin: -size,
        zMax: size,
      });

      const rayOrigin = new Vector3(0, 0, 0);
      const rayDirection = new Vector3(size, size, size);

      // Test
      const result = RayCast.intersectAABB(rayOrigin, rayDirection, aabb);

      // Assert
      expect(result).toBe(0);
    });
    test("Ray origin on near edge of AABB", () => {
      // Setup
      const size = 1;
      const aabb = new AxisAlignedBoundingBox({
        xMin: -size,
        xMax: size,
        yMin: -size,
        yMax: size,
        zMin: -size,
        zMax: size,
      });

      const rayOrigin = new Vector3(-size, -size, -size);
      const rayDirection = new Vector3(size, size, size);

      // Test
      const result = RayCast.intersectAABB(rayOrigin, rayDirection, aabb);

      // Assert
      expect(result).toBe(0);
    });
    test("Ray origin on far edge of AABB", () => {
      // Setup
      const size = 1;
      const aabb = new AxisAlignedBoundingBox({
        xMin: -size,
        xMax: size,
        yMin: -size,
        yMax: size,
        zMin: -size,
        zMax: size,
      });

      const rayOrigin = new Vector3(size, size, size);
      const rayDirection = new Vector3(size, size, size);

      // Test
      const result = RayCast.intersectAABB(rayOrigin, rayDirection, aabb);

      // Assert
      expect(result).toBeUndefined();
    });
    test("0-width, axis aligned AABB", () => {
      // Setup
      const size = 1;
      const aabb = new AxisAlignedBoundingBox({
        xMin: -size,
        xMax: size,
        yMin: -size,
        yMax: size,
        zMin: -0,
        zMax: 0,
      });

      const rayOrigin = new Vector3(0, 0, size * 2);
      const rayDirection = new Vector3(0, 0, -size);

      // Test
      const result = RayCast.intersectAABB(rayOrigin, rayDirection, aabb);
      const intersectionPoint = result === undefined ? undefined : rayDirection.scale(result).addSelf(rayOrigin);

      // Assert
      expect(result).toBe(2);
      expect(intersectionPoint).toEqual(new Vector3(0, 0, 0));
    });
  });

  describe("Ray-Triangle intersection", () => {
    test("Flat triangle at origin", () => {
      // Setup
      const triangle: Triangle = [
        new Vector3(0, 0, 1), // Top
        new Vector3(-1, 0, -0.5), // Left
        new Vector3(1, 0, -0.5), // Right
      ];
      // Ray will intersect with 0,0,0
      const rayOrigin = new Vector3(2, 2, 2);
      const rayDirection = new Vector3(-1, -1, -1);

      // Test
      const result = RayCast.intersectTriangle(rayOrigin, rayDirection, triangle);
      const intersectionPoint = result === undefined ? undefined : rayDirection.scale(result).addSelf(rayOrigin);

      // Assert
      expect(result).toBe(2);
      expect(intersectionPoint).toEqual(new Vector3(0, 0, 0));
    });
    test("Triangle on an angle", () => {
      // Setup
      const triangle: Triangle = [
        new Vector3(0.5, 1, -0.5), // Top
        new Vector3(0.5, 0, -1), // Left
        new Vector3(1, 0, -0.5), // Right
      ];
      const midPoint = triangle[0].add(triangle[1]).addSelf(triangle[2]).scaleSelf(1 / 3);
      // Ray will intersect with midPoint
      const rayOrigin = new Vector3(0, 0, 0);
      const rayDirection = new Vector3(2, 1, -2);

      // Test
      const result = RayCast.intersectTriangle(rayOrigin, rayDirection, triangle);
      const intersectionPoint = result === undefined ? undefined : rayDirection.scale(result).addSelf(rayOrigin);

      // Assert
      expect(result).toBe(1 / 3);
      expect(intersectionPoint).toEqual(midPoint);
    });
    test("No intersection", () => {
      // Setup
      const triangle: Triangle = [
        new Vector3(0.5, 1, -0.5), // Top
        new Vector3(0.5, 0, -1), // Left
        new Vector3(1, 0, -0.5), // Right
      ];
      // Ray will not intersect
      const rayOrigin = new Vector3(0, 0, 0);
      const rayDirection = new Vector3(-1, 0, 0);

      // Test
      const result = RayCast.intersectTriangle(rayOrigin, rayDirection, triangle);

      // Assert
      expect(result).toBeUndefined();
    });
    test("Negative / reverse intersection", () => {
      // Setup
      const triangle: Triangle = [
        new Vector3(0.5, 1, -0.5), // Top
        new Vector3(0.5, 0, -1), // Left
        new Vector3(1, 0, -0.5), // Right
      ];
      // Ray would intersect with midPoint, but is pointing the other direction
      const rayOrigin = new Vector3(0, 0, 0);
      const rayDirection = new Vector3(-2, -1, 2);

      // Test
      const result = RayCast.intersectTriangle(rayOrigin, rayDirection, triangle);

      // Assert
      expect(result).toBeUndefined();
    });
    test("Ray origin on surface of triangle", () => {
      // Setup
      const triangle: Triangle = [
        new Vector3(0, 0, 1), // Top
        new Vector3(-1, 0, -0.5), // Left
        new Vector3(1, 0, -0.5), // Right
      ];
      const rayOrigin = new Vector3(0, 0, 0);
      const rayDirection = new Vector3(0, 1, 0);

      // Test
      const result = RayCast.intersectTriangle(rayOrigin, rayDirection, triangle);

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
