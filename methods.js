import * as THREE from "three";

import { FontLoader } from "https://unpkg.com/three@0.165.0/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://unpkg.com/three@0.165.0/examples/jsm/geometries/TextGeometry.js";

const loader = new FontLoader();
let cachedFont;
export function preloadFont() {
    return new Promise((resolve, reject) => {
        if (cachedFont) return resolve(cachedFont);
        loader.load(
            "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
            (font) => {
                cachedFont = font;
                resolve(font);
            },
            undefined,
            reject
        );
    });
}
// in methods.js (top-level loader)
const texLoader = new THREE.TextureLoader();

// in drawBulb, allow an optional texture URL

export function drawLine(obj1, obj2) {
    const pos1 = new THREE.Vector3();
    const pos2 = new THREE.Vector3();
    obj1.getWorldPosition(pos1);
    obj2.getWorldPosition(pos2);
    const curve = new THREE.LineCurve3(pos1, pos2);
    const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.1, 100, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.objA = obj1;
    tube.objB = obj2;
    return tube;
}
export function updateLink(link) {
    const pos1 = new THREE.Vector3();
    const pos2 = new THREE.Vector3();

    link.objA.getWorldPosition(pos1);
    link.objB.getWorldPosition(pos2);

    const curve = new THREE.LineCurve3(pos1, pos2);

    // replace geometry only, not the mesh
    link.geometry.dispose();
    link.geometry = new THREE.TubeGeometry(curve, 20, 0.4, 16, false);
}
function fontSizeForBulb(radius) {
    const baseRadius = 2; // your “You” bulb?
    const baseSize = 1; // looks good at baseRadius
    const minSize = 0.7;
    const maxSize = 10;

    const size = baseSize * (radius / baseRadius);
    return Math.min(maxSize, Math.max(minSize, size));
}

export function drawText(x, y, z, text, size) {
    let textMesh = "";

    const textGeo = new TextGeometry(text, {
        font: cachedFont,
        size: fontSizeForBulb(size),
        depth: 0.5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 3,
    });

    const textMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
    });
    textGeo.computeBoundingBox();
    const box = textGeo.boundingBox;
    const width = box.max.x - box.min.x;
    const height = box.max.y - box.min.y;

    textMesh = new THREE.Mesh(textGeo, textMat);
    textMesh.position.set(x - width / 2, y - height / 2, z);
    return textMesh;
}

export function drawBulb(x, y, radius, text) {
    const widthSegments = 32;
    const heightSegments = 16;
    const phiStart = 0;
    const phiLength = Math.PI * 2; // half of the sphere horizontally

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
    hemiSphere.position.set(x, y, 0);
    return hemiSphere;
}
