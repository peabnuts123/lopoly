import { describe, test, expect } from 'vitest';
import { WebFileSystem } from './WebFileSystem';

describe(WebFileSystem.name, () => {
  test.each([
    { label: 'absolute prefix + absolute path', prefix: '/my-website', path: '/models/foo.glb', expected: `/my-website/models/foo.glb` },
    { label: 'absolute prefix + relative path', prefix: '/my-website', path: 'models/foo.glb', expected: `/my-website/models/foo.glb` },
    { label: 'relative prefix + absolute path', prefix: 'my-website', path: '/models/foo.glb', expected: `my-website/models/foo.glb` },
    { label: 'relative prefix + relative path', prefix: 'my-website', path: 'models/foo.glb', expected: `my-website/models/foo.glb` },
    { label: 'attempt to escape prefix', prefix: '/my-website', path: '../models/foo.glb', expected: `/my-website/models/foo.glb` },
    { label: 'valid path traversal', prefix: '/my-website', path: '/models/trucks/../foo.glb', expected: `/my-website/models/foo.glb` },
  ])(`${WebFileSystem.prototype['getUrlForPath'].name} with prefix can resolve the correct path`, ({ prefix, path, expected, label }) => {
    // Setup
    const fileSystem = new WebFileSystem(prefix);

    // Test
    const result = fileSystem['getUrlForPath'](path);

    // Assert
    expect(result, `(label='${label}')`).toBe(expected);
  });
});
