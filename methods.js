import * as THREE from "three";

import { FontLoader } from "https://unpkg.com/three@0.165.0/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://unpkg.com/three@0.165.0/examples/jsm/geometries/TextGeometry.js";

const loader = new FontLoader();
export function drawText(x, y, z, text) {
    loader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
        (font) => {
            const textGeo = new TextGeometry(text, {
                font: font,
                size: 0.5, // text height
                depth: 0.1, // text depth (3D thickness)
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 3,
            });

            const textMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const textMesh = new THREE.Mesh(textGeo, textMat);

            // position text above hemisphere
            textMesh.position.set(0, 2.1, 0); // adjust y to sit just above your hemisphere radius
            textMesh.rotation.y = Math.PI; // optional: rotate to face camera
            textMesh.position.set(x, y, z);
        }
    );
    return textMesh;
}
let bulbs = [];

export function drawBulb(x, y, radius) {
    const widthSegments = 32;
    const heightSegments = 16;
    const phiStart = 0;
    const phiLength = Math.PI; // half of the sphere horizontally

    const hemiGeometry = new THREE.SphereGeometry(
        radius,
        widthSegments,
        heightSegments,
        phiStart,
        phiLength
    );
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        roughness: 0.4,
        metalness: 0.2,
    });
    const hemiSphere = new THREE.Mesh(hemiGeometry, material);
    hemiSphere.position.set(x, y, z);
    bulbs.push(hemiSphere);
    return hemiSphere;
}
export function getBulbs() {
    return bulbs;
}
