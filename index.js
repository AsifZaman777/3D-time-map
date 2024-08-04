import * as THREE from 'https://zimjs.org/cdn/r155/three.module.js';
import { OrbitControls } from 'https://zimjs.org/cdn/r155/OrbitControls_module.js';

window.addEventListener("DOMContentLoaded", () => {
    // SCENE
    const scene = new THREE.Scene();

    // CAMERA
    const viewAngle = 70;
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const aspectRatio = windowW / windowH;
    const near = 0.1;
    const far = 200000;
    const camera = new THREE.PerspectiveCamera(viewAngle, aspectRatio, near, far);
    camera.position.set(0, 10, 10);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(windowW, windowH);
    document.body.appendChild(renderer.domElement);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    THREE.ColorManagement.enabled = true;

    // SKYBOX (Black Sphere)
    const skyBoxGeometry = new THREE.SphereGeometry(100000, 32, 32);
    const skyTexture = new THREE.TextureLoader().load("assets/sky.jpg"); 
    const skyBoxMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide });
    const skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    scene.add(skyBox);

    // GLOBE (Earth)
    const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
    const earthTexture = new THREE.TextureLoader().load("assets/earthTexture.jpg");
    const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture, transparent: true, opacity: 1 });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = false; // Disable panning
    controls.maxDistance = 14.02;
    controls.minDistance = 7.01;

    // LIGHTING
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(5, 3, 5).normalize();
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff,1);
    scene.add(ambientLight);

    // Grid Helper
    const grid = new THREE.GridHelper(15, 30, '#cc0', '#999');
    grid.rotation.set(0, -Math.PI, 0);
    scene.add(grid);

    // Small marker sphere (quad)
    const quad = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        new THREE.MeshStandardMaterial({ color: 'yellow' })
    );

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // Pointer event listener for latitude and longitude
    window.addEventListener("pointerdown", event => {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        const table = document.getElementById("table");
        table.style.top = -20 + event.clientY + "px";
        table.style.left = 40 + event.clientX + "px";
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObject(earth, false);

        // Get current time
        const now = new Date();
        const timeString = now.toLocaleTimeString();

        if (intersects.length > 0) {
            quad.position.copy(intersects[0].point);
            scene.add(quad);
            console.log("x:" + quad.position.x + " y:" + quad.position.y + " z:" + quad.position.z);
            const lati = 90 - (57.2957795 * (Math.acos(-quad.position.y / 5)));
            let str = "";

            // Calculate longitude and display latitude, longitude, and current time
            if (Math.abs(lati) < 80.01) {
                str = "<table style='padding:0px;'><tr><td class='esq'>Latitude</td><td class='dir'>" + 
                      (quad.position.y >= 0 ? -Number(lati).toFixed(2) : Number(-(lati)).toFixed(2)) + 
                      "</td></tr>";
                const zValue = quad.position.z || 1e-10; // Avoid division by zero
                const longi = quad.position.z >= 0 ? 57.2957795 * Math.atan(quad.position.x / zValue) : 
                                                      180 + (57.2957795 * Math.atan(quad.position.x / zValue));
                str += "<tr><td class='esq'>Longitude</td><td class='dir'>" + 
                       (longi <= 180 ? Number(longi).toFixed(2) : Number(-90 - (270 - longi)).toFixed(2)) + 
                       "</td></tr>";

                // Calculate time from longitude
                const timeFromLongitude = calculateTimeFromLongitude(longi);
                str += "<tr><td class='esq'>Local Time</td><td class='dir'>" + timeFromLongitude + "</td></tr></table>";
                table.innerHTML = str;
                table.style.opacity = 1;
            } else {
                table.style.opacity = 0;
            }
        } else {
            table.innerHTML = "<table style='padding:0px;'><tr><td class='esq'>Current Time</td><td class='dir'>" + timeString + "</td></tr></table>";
            table.style.opacity = 0;
        }
    });

    const title = document.getElementById("title");
    title.innerHTML = "<u>The importance of longitudal line for calculating time</u>";

    // Render Loop
    function render() {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    render();

    // Function to calculate time based on longitude
    function calculateTimeFromLongitude(longitude) {
        const hours = Math.round((longitude + 180) / 15); // Adjust for longitude range [-180, 180]
        const now = new Date();
        const utcHours = now.getUTCHours();
        const localHours = (utcHours + hours + 24) % 24; // Handle wrapping around midnight
        const period = localHours >= 12 ? 'AM' : 'PM';
        const adjustedHour = localHours % 12 || 12; // Convert 24-hour time to 12-hour format
        const adjustedTime = `${adjustedHour}:${now.getMinutes().toString().padStart(2, '0')} ${period}`;
        return adjustedTime;
    }

    // Quadify function for Earth geometry
    function quadify(geometry, distance) {
        const pos = geometry.attributes.position;
        const quadAmount = pos.count / 6;
        const a1 = new THREE.Vector3(), b1 = new THREE.Vector3(), c1 = new THREE.Vector3(),
            a2 = new THREE.Vector3(), b2 = new THREE.Vector3(), c2 = new THREE.Vector3();
        const hSide = new THREE.Vector3(), vSide = new THREE.Vector3();

        for (let i = 0; i < quadAmount; i++) {
            a1.fromBufferAttribute(pos, i * 6 + 0);
            b1.fromBufferAttribute(pos, i * 6 + 1);
            c1.fromBufferAttribute(pos, i * 6 + 2);
            a2.fromBufferAttribute(pos, i * 6 + 3);
            b2.fromBufferAttribute(pos, i * 6 + 4);
            c2.fromBufferAttribute(pos, i * 6 + 5);

            // Adjust vertices to create quads
            vSide.subVectors(c1, a1).normalize();
            a1.addScaledVector(vSide, distance);
            c1.addScaledVector(vSide, -distance);
            c2.addScaledVector(vSide, -distance);

            vSide.subVectors(b2, a2).normalize();
            b1.addScaledVector(vSide, distance);
            a2.addScaledVector(vSide, distance);
            b2.addScaledVector(vSide, -distance);

            hSide.subVectors(b1, a1).normalize();
            a1.addScaledVector(hSide, distance);
            b1.addScaledVector(hSide, -distance);
            a2.addScaledVector(hSide, -distance);

            vSide.subVectors(c2, b2).normalize();
            b2.addScaledVector(vSide, distance);
            c2.addScaledVector(vSide, -distance);
            c1.addScaledVector(vSide, -distance);

            pos.setXYZ(i * 6 + 0, a1.x, a1.y, a1.z);
            pos.setXYZ(i * 6 + 1, b1.x, b1.y, b1.z);
            pos.setXYZ(i * 6 + 2, c1.x, c1.y, c1.z);
            pos.setXYZ(i * 6 + 3, a2.x, a2.y, a2.z);
            pos.setXYZ(i * 6 + 4, b2.x, b2.y, b2.z);
            pos.setXYZ(i * 6 + 5, c2.x, c2.y, c2.z);
        }
    }

    // Apply quadify function to Earth geometry
    quadify(earth.geometry, 0.0001);
    earth.geometry.computeVertexNormals();
    earth.rotation.set(-0.015, -Math.PI / 2, 0);
});
