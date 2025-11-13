import * as THREE from "three";
import * as methods from "/methods.js";
import * as base from "/firebase.js";
import { OrbitControls } from "https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js";

const mainInput = document.getElementById("input-main");
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
await methods.preloadFont();
let bulbIndex = 0;
document.addEventListener("keydown", async function (event) {
    let inputValue = mainInput.value;
    mainInput.value = "";

    const tag = event.target.tagName.toLowerCase();
    if (event.code == "Enter") {
        bulbIndex++;
        let deg = Math.round(bulbIndex * 30) * (Math.PI / 180);
        let bulb2 = methods.drawBulb(10 * Math.sin(deg), 10 * Math.cos(deg), 2);
        scene.add(bulb2);
        scene.add(
            methods.drawText(bulb2.position.x, bulb2.position.y, 2, inputValue)
        );
        scene.add(methods.drawLine(mainBulb, bulb2));

        await base.incrementValue("siteData/bulbs", inputValue);
    }
    if (tag == "input" || tag === "textarea") return;

    pressedKeys[event.code] = true;
});
document.addEventListener("keyup", function (event) {
    const tag = event.target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    pressedKeys[event.code] = false;
});

document.addEventListener("wheel", (event) => {
    // camera.position.z += event.deltaY > 0 ? 0.3 : -0.3;
});
document.body.addEventListener("click", function () {
    // document.body.requestFullscreen();
});
camera.position.z = 5;
const controls = new OrbitControls(camera, renderer.domElement);

controls.enablePan = true;
controls.enableZoom = true;

let mainBulb;
controls.minDistance = 3;
controls.maxDistance = 50;
async function draw() {
    mainBulb = methods.drawBulb(0, 0, 2);
    scene.add(mainBulb);

    scene.add(methods.drawText(0, 0, 2, "Hello!"));

    console.log(await base.getData("/siteData/bulbs"));
}
draw();
const speed = 0.2;
function animate() {
    renderer.render(scene, camera);

    // if (pressedKeys["KeyW"]) camera.position.y += speed;
    // if (pressedKeys["KeyS"]) camera.position.y -= speed;
    // if (pressedKeys["KeyA"]) camera.position.x -= speed;
    // if (pressedKeys["KeyD"]) camera.position.x += speed;
}
