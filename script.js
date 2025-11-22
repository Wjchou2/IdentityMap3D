import * as THREE from "three";
import * as methods from "/methods.js";
import * as base from "/firebase.js";
import { OrbitControls } from "https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js";
// import { json } from "express";
const clock = new THREE.Clock();
const poppingBulbs = [];
const bulbs = [];
const links = [];
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
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);
await methods.preloadFont();

const data = {
    bulbIndex: 0,
    bulbs_data: JSON.parse(localStorage.getItem("bulbs_data")),
};
data.bulbs_data = data.bulbs_data != null ? data.bulbs_data : [];
let inputValue = "";
async function drawAll() {
    if (Array.isArray(data.bulbs_data)) {
        data.bulbs_data.forEach((bulb) => {
            drawSphere(String(bulb.text), bulb.x, bulb.y);
            console.log(bulb.x, bulb.y);
        });
    }
    data.bulbs_data = [];
}
// async function drawAll() {

//     let data = await base.getData("siteData/bulbs");
//     // console.log(data);
//     for (const key in data) {
//         data.bulbIndex++;

//         drawSphere(String(key));
//     }
// }
async function drawSphere(value, x, y) {
    value = value != undefined ? value : inputValue;
    let deg = Math.round(data.bulbIndex * 30) * (Math.PI / 180);
    let count = await base.getData("siteData/bulbs/" + value);
    let radius = 1 + count / 10;

    let bulb = methods.drawBulb(0, 0, 2);

    bulb.scale.setScalar(0.001);

    poppingBulbs.push({
        object: bulb,
        startTime: clock.getElapsedTime(),
        duration: 0.5,
        startScale: 0.1,
        endScale: radius,
    });
    let textLabel = methods.drawText(
        bulb.position.x,
        bulb.position.y + 0.5,
        radius * 2,
        value,
        count/2
    );
    let textLabel2 = methods.drawText(
        bulb.position.x,
        bulb.position.y - 0.5,
        radius * 2,
        `(${String(count)}${count == 1 ? " person" : " people"})`,
         count/2
    );
    const group = new THREE.Group();
    group.add(textLabel);
    group.add(textLabel2);
    group.add(bulb);
    scene.add(group);
    group.index = data.bulbIndex;
    group.bulbMesh = bulb;
    group.radius = radius; // set real radius immediately
    group.position.copy(
        new THREE.Vector3(
            x != undefined ? x : 10 * Math.sin(deg),
            y != undefined ? y : 10 * Math.cos(deg)
        )
    );
    bulbs.push(group);
    data.bulbs_data.push({
        x: 10 * Math.sin(deg),
        y: 10 * Math.cos(deg),
        text: value,
    });
    let link = methods.drawLine(mainBulb, bulb);
    links.push(link);
    scene.add(link);
    data.bulbIndex++;
}
let draggedBulb = null;

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
document.body.addEventListener("pointerdown", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(bulbs, true);
    if (intersects.length > 0 && intersects[0].object != mainBulb) {
        draggedBulb = intersects[0].object.parent;
        controls.enabled = false;
    }
});
window.addEventListener("pointerup", () => {
    if (draggedBulb) {
        draggedBulb.beingDragged = false;
        draggedBulb.bulbMesh.material.color.set(0x00ff00);
    }

    draggedBulb = null;
    controls.enabled = true;
});
const pointer = new THREE.Vector2();
const hitPoint = new THREE.Vector3();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

document.addEventListener("pointermove", async function (event) {
    if (draggedBulb != null) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
            draggedBulb.position.copy(hitPoint);
            draggedBulb.beingDragged = true;
            draggedBulb.bulbMesh.material.color.set(0xffff00);
        }
    }
});

document.addEventListener("keydown", async function (event) {
    const tag = event.target.tagName.toLowerCase();
    inputValue = mainInput.value;
    if (event.code == "Enter" && mainInput.value != "") {
        mainInput.value = "";
        await base.incrementValue("siteData/bulbs", inputValue);
        drawSphere();
    }
    if (tag == "input" || tag === "textarea") return;
});

camera.position.z = 40;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = true;
controls.enableZoom = true;

let mainBulb;
controls.minDistance = 3;
controls.maxDistance = 200;

async function draw() {
    mainBulb = methods.drawBulb(0, 0, 2);
    const group = new THREE.Group();
    group.add(methods.drawText(0, 0, 2, "You", 2));
    group.add(mainBulb);
    scene.add(group);
    group.bulbMesh = mainBulb;
    group.radius = 2;
    bulbs.push(group);
    drawAll();
}
draw();
function updatePhysics() {
    for (let i = 0; i < bulbs.length; i++) {
        for (let j = 0; j < bulbs.length; j++) {
            if (i == j) continue;
            const bulb = bulbs[i];
            const bulb2 = bulbs[j];
            const pA = new THREE.Vector3();
            const pB = new THREE.Vector3();
            bulb.bulbMesh.getWorldPosition(pA);
            bulb2.bulbMesh.getWorldPosition(pB);
            // bulb.getWorldPosition(pA);
            // bulb2.getWorldPosition(pB);

            const centerDist = pA.distanceTo(pB);
            const minDist = bulb.radius + bulb2.radius;
            let overlap = minDist - centerDist;
            overlap *= -1;

            if (overlap < 8) {
                const dir = pA.clone().sub(pB).normalize();
                const force = Math.min(overlap * 0.1, 0.4); // cap max push per frame

                let oneIsMain =
                    bulb == mainBulb.parent || bulb2 == mainBulb.parent;
                if (!bulbs[i].beingDragged) {
                    bulb.position.addScaledVector(
                        dir,
                        overlap *
                            (bulb == mainBulb.parent ? 0 : force) *
                            (oneIsMain ? 2 : 1)
                    );
                }
                if (!bulbs[j].beingDragged) {
                    bulb2.position.addScaledVector(
                        dir,
                        -overlap *
                            (bulb2 == mainBulb.parent ? 0 : force) *
                            (oneIsMain ? 2 : 1)
                    );
                }
            }
            console.log(
                data.bulbs_data,
                bulb.index,
                data.bulbs_data[bulb.index]
            );
            if (bulb.index !== undefined && data.bulbs_data[bulb.index]) {
                data.bulbs_data[bulb.index].x = bulb.position.x;
                data.bulbs_data[bulb.index].y = bulb.position.y;
            }
            if (bulb2.index !== undefined && data.bulbs_data[bulb2.index]) {
                data.bulbs_data[bulb2.index].x = bulb2.position.x;
                data.bulbs_data[bulb2.index].y = bulb2.position.y;
            }
        }
    }
}
setInterval(() => {
    localStorage.setItem("bulbs_data", JSON.stringify(data.bulbs_data));
    // localStorage.setItem("bulb_index", JSON.stringify(data.bulbIndex));
}, 500);
function animate() {
    const now = clock.getElapsedTime();

    for (let i = poppingBulbs.length - 1; i >= 0; i--) {
        const pop = poppingBulbs[i];
        const t = Math.min((now - pop.startTime) / pop.duration, 1);
        const p = 0.3;
        const eased =
            Math.pow(2, -7 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) +
            1;
        pop.object.scale.setScalar(
            pop.startScale + (pop.endScale - pop.startScale) * eased
        );
        if (t >= 1) {
            poppingBulbs.splice(i, 1);
            pop.object.parent.radius = pop.endScale;
        }
    }
    updatePhysics();

    for (const link of links) {
        methods.updateLink(link);
    }

    renderer.render(scene, camera);
}
