import * as THREE from "three";
import * as methods from "/methods.js";
import * as base from "/firebase.js";
import * as wordHelper from "/wordHelper.js";

import { OrbitControls } from "https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js";
// import { json } from "express";
const clock = new THREE.Clock();
const poppingBulbs = [];
const bulbs = [];
const links = [];
const mainInput = document.getElementById("input-main-submit");
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
const params = new URLSearchParams(window.location.search);
const dataStr = params.get("d");
let isViewer = false;
if (dataStr != null) {
    isViewer = true;
    data.bulbs_data = JSON.parse(decodeURIComponent(dataStr));
}
let inputValue = "";
async function drawAll() {
    if (Array.isArray(data.bulbs_data)) {
        data.bulbs_data.forEach((bulb) => {
            drawSphere(String(bulb.text), bulb.x, bulb.y);
        });
    }
    data.bulbs_data = [];
}

async function drawSphere(value, x, y, index) {
    value = value != undefined ? value : inputValue;
    let deg = Math.round(data.bulbIndex * 30) * (Math.PI / 180);
    let count = await base.getData("siteData/bulbs/" + value);
    let radius = 1 + count / 50;
    let bulb = methods.drawBulb(0, 0, 2, value);

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
        bulb.position.y + radius / 3,
        radius * 2,
        value,
        radius
    );
    let textLabel2 = methods.drawText(
        bulb.position.x,
        bulb.position.y - radius / 3,
        radius * 2,
        `(${String(count)}${count == 1 ? " prs" : " ppl"})`,
        radius
    );
    const group = new THREE.Group();
    group.add(textLabel);
    group.add(textLabel2);
    group.add(bulb);
    scene.add(group);

    group.index = index != null ? index : data.bulbIndex;
    group.bulbMesh = bulb;
    group.textValue = value;
    group.xPos = x;
    group.yPos = y;
    group.currentSize = count;
    group.radius = radius; // set real radius immediately
    group.position.copy(
        new THREE.Vector3(
            x != undefined ? x : 10 * Math.sin(deg),
            y != undefined ? y : 10 * Math.cos(deg)
        )
    );

    data.bulbs_data.push({
        x: 10 * Math.sin(deg),
        y: 10 * Math.cos(deg),
        text: value,
    });
    let link = methods.drawLine(mainBulb, bulb);
    group.link = link;
    links.push(link);
    scene.add(link);
    data.bulbIndex++;
    bulbs.push(group);
}
let draggedBulb = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
document.body.addEventListener("pointerdown", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(bulbs, true);
    if (
        intersects.length > 0 &&
        intersects[0].object.parent != mainBulb.parent
    ) {
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
        let guessed = false;
        for (let i = 0; i < data.bulbs_data.length; i++) {
            if (data.bulbs_data[i].text == inputValue) {
                alert("Already guessed");
                guessed = true;
                break;
            }
        }
        if (guessed) {
            return;
        }
        let isWord = await wordHelper.isWord(inputValue);
        if (isWord && wordHelper.hasIdentityLikeWord(inputValue)) {
            mainInput.value = "";
            await base.incrementValue("siteData/bulbs", inputValue);
            drawSphere();
        } else {
            alert("Invalid Word");
        }

        if (tag == "input" || tag === "textarea") return;
    }
});

camera.position.z = 25;
document.getElementById("removeAll").addEventListener("click", function () {
    if (confirm("Reset Map?")) {
        data.bulbs_data = [];
        localStorage.removeItem("bulbs_data");
        location.reload();
    }
});

document.getElementById("share").addEventListener("click", function () {
    let val = encodeURIComponent(JSON.stringify(data.bulbs_data));
    const params = new URLSearchParams();

    params.set("d", val);

    const url =
        window.location.origin +
        window.location.pathname +
        "?" +
        params.toString();
    console.log(url);
});

document.getElementById("resetCam").addEventListener("click", function () {
    const changes = {
        changeX: camera.position.x / 100,
        changeY: camera.position.y / 100,
        changeZ: (camera.position.z - 40) / 100,

        rotateX: camera.rotation.x / 100,
        rotateY: camera.rotation.y / 100,
        rotateZ: camera.rotation.z / 100,
    };

    let count = 0;
    let loop = setInterval(() => {
        if (count == 100) clearInterval(loop);
        count++;
        camera.position.set(
            camera.position.x - changes.changeX,
            camera.position.y - changes.changeY,
            camera.position.z - changes.changeZ
        );
        camera.rotation.set(
            camera.rotation.x - changes.rotateX,
            camera.rotation.y - changes.rotateY,
            camera.rotation.z - changes.rotateZ
        );
    }, 1);
    setTimeout(() => {
        // camera.position.set(0, 0, 40);
        controls.target.set(0, 0, 0); // keep orbit centered
        controls.update();
    }, 500);
});
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = true;
controls.enableZoom = true;

let mainBulb;
controls.minDistance = 3;
controls.maxDistance = 1000;

async function draw() {
    mainBulb = methods.drawBulb(0, 0, 3);
    const group = new THREE.Group();
    group.add(methods.drawText(0, 0, 3, "You", 3));
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
            const pA = new THREE.Vector3(0, 0, 0);
            const pB = new THREE.Vector3(0, 0, 0);
            bulb.bulbMesh.getWorldPosition(pA);
            bulb2.bulbMesh.getWorldPosition(pB);
            const centerDist = pA.distanceTo(pB);
            const minDist = bulb.radius + bulb2.radius;
            let overlap = minDist - centerDist;

            overlap *= -1;

            if (overlap < 4) {
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

            if (bulb.index !== undefined && data.bulbs_data[bulb.index]) {
                data.bulbs_data[bulb.index].x = roundtoTenth(bulb.position.x);
                data.bulbs_data[bulb.index].y = roundtoTenth(bulb.position.y);
            }
            if (bulb2.index !== undefined && data.bulbs_data[bulb2.index]) {
                data.bulbs_data[bulb2.index].x = roundtoTenth(bulb2.position.x);
                data.bulbs_data[bulb2.index].y = roundtoTenth(bulb2.position.y);
            }
        }
    }
}
function roundtoTenth(num) {
    return Math.round(num * 10) / 10;
}
setInterval(() => {
    localStorage.setItem("bulbs_data", JSON.stringify(data.bulbs_data));
}, 500);
async function updateall() {
    let dataLive = await base.getData("siteData/bulbs");
    Array(dataLive).forEach(function (elm) {
        const len = bulbs.length;
        for (let i = 0; i < len; i++) {
            let currentBulb = bulbs[i];
            if (
                elm[currentBulb.textValue] != undefined &&
                currentBulb.currentSize != elm[currentBulb.textValue]
            ) {
                scene.remove(bulbs[i].link);
                bulbs.splice(i, 1);

                links.splice(i, 1);
                for (let j = 0; j < data.bulbs_data.length; j++) {
                    if (data.bulbs_data[j].text == currentBulb.textValue) {
                        data.bulbs_data.splice(j, 1);
                    }
                }
                drawSphere(
                    currentBulb.textValue,
                    currentBulb.position.x,
                    currentBulb.position.y,
                    currentBulb.index
                );
                scene.remove(currentBulb);
            }
        }
    });
}
setInterval(() => {
    updateall();
}, 2000);
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
