import { describe, expect, test } from 'vitest';

import { Material } from '@lopoly/engine/materials/Material';

import { ModelMaterialOverrides } from './ModelMaterialOverrides';

describe(ModelMaterialOverrides.name, () => {
  test("Changing an inherited override material updates the child's `getResult()`", () => {
    // Setup
    const defaultMaterial = new Material({ unlit: false });
    const parent = new ModelMaterialOverrides(new Map([['body', defaultMaterial]]));
    const child = new ModelMaterialOverrides(parent);
    const inheritedOverride = new Material({ unlit: true });
    parent.setOverride('body', inheritedOverride, 'override');

    const initialChildResultIsUnlit = child.getResult('body').unlit;

    // Test
    inheritedOverride.unlit = false;

    const updatedChildResultIsUnlit = child.getResult('body').unlit;

    // Assert
    expect(initialChildResultIsUnlit).toBe(true);
    expect(updatedChildResultIsUnlit).toBe(false);
  });

  test("Changing a default material updates `getResult()`", () => {
    // Setup
    const defaultMaterial = new Material({ unlit: false });
    const overrides = new ModelMaterialOverrides(new Map([['body', defaultMaterial]]));

    const initialResultIsUnlit = overrides.getResult('body').unlit;

    // Test
    defaultMaterial.unlit = true;

    const updatedResultIsUnlit = overrides.getResult('body').unlit;

    // Assert
    expect(initialResultIsUnlit).toBe(false);
    expect(updatedResultIsUnlit).toBe(true);
  });
});
