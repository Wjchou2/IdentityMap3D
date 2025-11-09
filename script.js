import * as THREE from "three";
import * as methods from "/methods.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
const dir = new THREE.DirectionalLight(0xffffff, 1);
dir.position.set(5, 10, 7);
scene.add(ambient, dir);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin = 0;
document.body.style.overflow = "hidden";
let pressedKeys = {};

renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

document.addEventListener("keydown", function (event) {
    pressedKeys[event.code] = true;
});
document.addEventListener("keyup", function (event) {
    pressedKeys[event.code] = false;
});

document.addEventListener("wheel", (event) => {
    camera.position.z += event.deltaY > 0 ? 0.3 : -0.3;
});
document.body.addEventListener("click", function () {
    document.body.requestFullscreen();
});
camera.position.z = 5;

function draw() {
    scene.add(methods.drawBulb(0, 0, 2));
    scene.add(methods.drawBulb(5, 5, 3));
    methods.drawText(0, 0, 2, "Hello!").then((textMesh) => {
        scene.add(textMesh);
    });
}
draw();
const speed = 0.2;
function animate() {
    renderer.render(scene, camera);

    if (pressedKeys["KeyW"]) camera.position.y += speed;
    if (pressedKeys["KeyS"]) camera.position.y -= speed;
    if (pressedKeys["KeyA"]) camera.position.x -= speed;
    if (pressedKeys["KeyD"]) camera.position.x += speed;
}
