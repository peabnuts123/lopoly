# Ray casting / collision handling (April 2026)

Notes on implementing collision handling.

- Nodes of different type of collision e.g. SphereColliderNode
  - SphereColliderNode
  - BoxColliderNode
  - MeshColliderNode
  - CylinderColliderNode (?)
  - PointCollider (?)

```typescript
const ground = new ModelNode(scene, "ground", boxModel);
const groundCollider = new BoxColliderNode(scene, "ground_collider", {
  x: 10,
  y: 1,
  z: 10,
});
ground.addChild(groundCollider);
ground.position.y = -0.5;
ground.scale.x = 10;
ground.scale.z = 10;


const player = new ObjectNode(scene, "player");
const playerCollider = new SphereCollider(scene, "player_collider", { radius: 0.3 });
player.addChild(playerCollider);
player.position = new Vector3(10, 0, 20);

playerCollider.move(player, new Vector3(0, -2, 0));
// Or
const playerMovement = playerCollider.computeMove(new Vector3(0, -2, 0));
/*
  - result
  - correction vector
 */
player.position.addSelf(playerMovement.result);

const castResult = playerCollider.cast(new Vector3(0, -2, 0));
/*
  - intersectionPoint
  - distance
 */
const isOnGround = castResult.intersectionPoint !== undefined;


const CollisionGroup = {
  player: 0,
  world: 1,
  enemy: 2,
}
// engine.configureCollisionGroup(CollisionGroup.player, {

// })
engine.disableCollision(CollisionGroup.player, CollisionGroup.world);

```

https://dyn4j.org/2010/01/sat/
https://research.ncl.ac.uk/game/mastersdegree/gametechnologies/physicstutorials/5collisionresponse/Physics%20-%20Collision%20Response.pdf
https://research.ncl.ac.uk/game/mastersdegree/gametechnologies/previousinformation/physics4collisiondetection/2017%20Tutorial%204%20-%20Collision%20Detection.pdf?utm_source=chatgpt.com
https://palitri.com/vault/stuff/maths/Rays%20closest%20point.pdf

## Narrow phase collision
### Take 1
|    | Sphere | Capsule | Box | ConvexMesh | ComplexMesh |
|--- | ------ | ------- | --- | ----------- | ------- |
| Sphere | Distance test | Project point to line, clamped, measure distance | [That guy's box/sphere algo](https://stackoverflow.com/a/69580193) | [Distance to each triangle](https://stackoverflow.com/questions/2924795/fastest-way-to-compute-point-to-triangle-distance-in-3d) | Distance to each triangle |
| Capsule | ~ | ? Distance between 2 lines | ? SAT ? | [That guy's triangle algorithm](https://photodiode.github.io/article/triangle-capsule-intersection.html) | That guy's triangle algorithm |
| Box | ~ | ~ | SAT | SAT | ? SAT each triangle |
| ConvexMesh | ~ | ~ | ~ | SAT | ? SAT each triangle |
| ComplexMesh | ~ | ~ | ~ | ~ | ? Disable ? Triangle x Triangle ? |

---

### Take 2 - Ah dang hold up what about non-linear scale
|    | Sphere | Capsule | Box | ConvexMesh | ComplexMesh |
|--- | ------ | ------- | --- | ----------- | ------- |
| Sphere | Distance test | Project point to line, clamped, measure distance | Transform sphere to box space, do AABB test | [Distance to each triangle](https://stackoverflow.com/questions/2924795/fastest-way-to-compute-point-to-triangle-distance-in-3d) | Distance to each triangle |
| Capsule | ~ | ? Distance between 2 lines | ? SAT ? | [That guy's triangle algorithm](https://photodiode.github.io/article/triangle-capsule-intersection.html) | That guy's triangle algorithm |
| Box | ~ | ~ | SAT | SAT | ? SAT each triangle |
| ConvexMesh | ~ | ~ | ~ | SAT | ? SAT each triangle |
| ComplexMesh | ~ | ~ | ~ | ~ | ? Disable ? Triangle x Triangle ? |

---

### Take 3
|    | Box | ConvexMesh | ComplexMesh |
|--- | --- | ----------- | ------- |
| Box | SAT | SAT | ? SAT each triangle |
| ConvexMesh | ~ | SAT | ? SAT each triangle |
| ComplexMesh | ~ | ~ | ? Disable ? Triangle x Triangle ? |