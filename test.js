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
    camera.position.set(0, 0, 500);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(windowW, windowH);
    document.body.appendChild(renderer.domElement);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    THREE.ColorManagement.enabled = true;

    // SKYBOX (Black Sphere)
    const skyBoxGeometry = new THREE.SphereGeometry(100000, 32, 32);
    const skyBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
    const skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    scene.add(skyBox);

    // GLOBE (Earth)
    const earthGeometry = new THREE.SphereGeometry(100, 32, 32);
    const earthTexture = new THREE.TextureLoader().load("assets/earth_texture.jpg"); // Add the path to your Earth texture
    const earthMaterial = new THREE.MeshPhongMaterial({ map: earthTexture });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = false; // Disable panning

    // LIGHTING
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 3, 5).normalize();
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    // RENDER LOOP
    function render() {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    render();
});
