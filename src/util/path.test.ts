import { describe, test, expect } from 'vitest';
import { canonicalisePath } from './path';

describe(canonicalisePath.name, () => {
  test.each([
    { label: 'canonical absolute paths', input: '/textures/asphalt.png', expected: '/textures/asphalt.png' },
    { label: 'canonical relative paths', input: 'textures/asphalt.png', expected: 'textures/asphalt.png' },
    { label: 'absolute paths', input: 'textures/../asphalt.png', expected: 'asphalt.png' },
    { label: 'relative paths', input: '/textures/../asphalt.png', expected: '/asphalt.png' },
    { label: 'valid path traversal', input: '/models/../textures/asphalt.png', expected: '/textures/asphalt.png' },
    { label: 'path traversal above root', input: '/models/../../textures/asphalt.png', expected: '/textures/asphalt.png' },
    { label: 'strips blank segments', input: '/textures//asphalt.png', expected: '/textures/asphalt.png' },
  ])(`produces expected result ($label)`, ({ label, input, expected }) => {
    // Setup / Test
    const result = canonicalisePath(input);

    // Assert
    expect(result, label).toBe(expected);
  });
});
