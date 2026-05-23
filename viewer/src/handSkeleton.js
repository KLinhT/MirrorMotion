import * as THREE from "three";
import { HAND_CONNECTIONS } from "./handConnections";

// A class to represent the hand skeleton in the 3D scene
export class HandSkeleton {
  constructor(scene) {
    this.joints = [];
    this.bones = [];

    const jointGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x4cc9f0,
      roughness: 0.4,
      metalness: 0.1,
    });

    for (let i = 0; i < 21; i++) {
      const joint = new THREE.Mesh(jointGeometry, jointMaterial);
      scene.add(joint);
      this.joints.push(joint);
    }

    const boneGeometry = new THREE.CylinderGeometry(0.015, 0.015, 1, 12);
    const boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.1,
    });

    for (let i = 0; i < HAND_CONNECTIONS.length; i++) {
      const bone = new THREE.Mesh(boneGeometry, boneMaterial);
      scene.add(bone);
      this.bones.push(bone);
    }
  }

  update(landmarks) {
    for (let i = 0; i < 21; i++) {
      this.joints[i].position.copy(landmarks[i]);
    }

    HAND_CONNECTIONS.forEach(([a, b], index) => {
      this.updateBone(this.bones[index], landmarks[a], landmarks[b]);
    });
  }

  updateBone(bone, start, end) {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    if (length === 0) {
      bone.visible = false;
      return;
    }

    bone.visible = true;

    const midpoint = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);

    bone.position.copy(midpoint);
    bone.scale.set(1, length, 1);

    const yAxis = new THREE.Vector3(0, 1, 0);
    bone.quaternion.setFromUnitVectors(
      yAxis,
      direction.clone().normalize()
    );
  }
}