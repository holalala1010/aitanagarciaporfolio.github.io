const THREE = require('aframe/src/lib/three');
const obj = new THREE.Object3D();
obj.lookAt(new THREE.Vector3(0, 0, 10)); // target is at +Z
console.log("Vector(0,0,10):", obj.rotation.x, obj.rotation.y, obj.rotation.z);
obj.lookAt(new THREE.Vector3(0, 0, -10)); // target is at -Z
console.log("Vector(0,0,-10):", obj.rotation.x, obj.rotation.y, obj.rotation.z);
