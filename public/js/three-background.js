// Three.js Hero Background with Particle Network
import * as THREE from '/node_modules/three/build/three.module.js';

class HeroBackground {
    constructor() {
        this.container = document.getElementById('hero-canvas');
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container,
            alpha: true,
            antialias: true
        });

        this.particles = [];
        this.connections = [];
        this.mouse = new THREE.Vector2();
        this.targetMouse = new THREE.Vector2();

        this.init();
        this.createParticles();
        this.createFloatingShapes();
        this.addLights();
        this.animate();
        this.addEventListeners();
    }

    init() {
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.camera.position.z = 50;

        // Fog for depth
        this.scene.fog = new THREE.Fog(0x0a0e27, 1, 100);

        // Listen for theme changes
        window.addEventListener('themeChange', (e) => {
            this.updateTheme(e.detail.theme);
        });
    }

    updateTheme(theme) {
        const isDark = theme === 'dark';

        // Update fog color
        const fogColor = isDark ? 0x0a0e27 : 0xf8f9fa;
        this.scene.fog.color.setHex(fogColor);

        // Update particle opacity
        if (this.particleSystem) {
            this.particleSystem.material.opacity = isDark ? 0.8 : 0.4;
        }

        // Update connection line opacity
        if (this.connectionLines) {
            this.connectionLines.material.opacity = isDark ? 0.2 : 0.1;
        }

        // Update floating shapes opacity
        this.floatingShapes.forEach(shape => {
            shape.material.opacity = isDark ? 0.3 : 0.15;
        });
    }

    createParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Random position
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = (Math.random() - 0.5) * 100;
            positions[i3 + 2] = (Math.random() - 0.5) * 50;

            // Color gradient (purple to blue)
            const color = new THREE.Color();
            color.setHSL(0.7 - Math.random() * 0.2, 0.8, 0.6);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            this.particles.push({
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02
                ),
                index: i
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);

        // Create connections
        this.createConnections();
    }

    createConnections() {
        const positions = this.particleSystem.geometry.attributes.position.array;
        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x667eea,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });

        this.connectionLines = new THREE.LineSegments(lineGeometry, lineMaterial);
        this.scene.add(this.connectionLines);
    }

    updateConnections() {
        const positions = this.particleSystem.geometry.attributes.position.array;
        const linePositions = [];
        const maxDistance = 15;

        for (let i = 0; i < positions.length; i += 3) {
            for (let j = i + 3; j < positions.length; j += 3) {
                const dx = positions[i] - positions[j];
                const dy = positions[i + 1] - positions[j + 1];
                const dz = positions[i + 2] - positions[j + 2];
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (distance < maxDistance) {
                    linePositions.push(positions[i], positions[i + 1], positions[i + 2]);
                    linePositions.push(positions[j], positions[j + 1], positions[j + 2]);
                }
            }
        }

        this.connectionLines.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(linePositions, 3)
        );
    }

    createFloatingShapes() {
        // Create some floating geometric shapes
        const shapes = [
            { geometry: new THREE.IcosahedronGeometry(2, 0), position: [-20, 10, -10] },
            { geometry: new THREE.OctahedronGeometry(1.5), position: [25, -15, -15] },
            { geometry: new THREE.TorusGeometry(1.5, 0.5, 16, 100), position: [-15, -20, -20] },
        ];

        this.floatingShapes = [];

        shapes.forEach((shape, index) => {
            const material = new THREE.MeshPhongMaterial({
                color: 0x667eea,
                wireframe: true,
                transparent: true,
                opacity: 0.3,
                emissive: 0x667eea,
                emissiveIntensity: 0.2
            });

            const mesh = new THREE.Mesh(shape.geometry, material);
            mesh.position.set(...shape.position);
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            this.scene.add(mesh);
            this.floatingShapes.push(mesh);
        });
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x667eea, 1, 100);
        pointLight1.position.set(20, 20, 20);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x764ba2, 1, 100);
        pointLight2.position.set(-20, -20, 20);
        this.scene.add(pointLight2);
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onResize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    onMouseMove(event) {
        this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Smooth mouse following
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        // Camera parallax
        this.camera.position.x = this.mouse.x * 5;
        this.camera.position.y = this.mouse.y * 5;
        this.camera.lookAt(this.scene.position);

        // Animate particles
        const positions = this.particleSystem.geometry.attributes.position.array;

        this.particles.forEach((particle) => {
            const i = particle.index * 3;

            positions[i] += particle.velocity.x;
            positions[i + 1] += particle.velocity.y;
            positions[i + 2] += particle.velocity.z;

            // Boundary check
            if (Math.abs(positions[i]) > 50) particle.velocity.x *= -1;
            if (Math.abs(positions[i + 1]) > 50) particle.velocity.y *= -1;
            if (Math.abs(positions[i + 2]) > 25) particle.velocity.z *= -1;
        });

        this.particleSystem.geometry.attributes.position.needsUpdate = true;

        // Update connections every few frames for performance
        if (Math.random() > 0.95) {
            this.updateConnections();
        }

        // Rotate floating shapes
        this.floatingShapes.forEach((shape, index) => {
            shape.rotation.x += 0.001 * (index + 1);
            shape.rotation.y += 0.002 * (index + 1);
            shape.position.y += Math.sin(Date.now() * 0.001 + index) * 0.01;
        });

        this.renderer.render(this.scene, this.camera);
    }
}

// Loading Screen Animation
class LoadingAnimation {
    constructor() {
        this.container = document.getElementById('loader-canvas');
        if (!this.container) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container,
            alpha: true,
            antialias: true
        });

        this.init();
        this.createLoadingShape();
        this.animate();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.camera.position.z = 5;
    }

    createLoadingShape() {
        const geometry = new THREE.IcosahedronGeometry(1, 1);
        const material = new THREE.MeshPhongMaterial({
            color: 0x667eea,
            wireframe: true,
            emissive: 0x667eea,
            emissiveIntensity: 0.5
        });

        this.loadingMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.loadingMesh);

        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(0, 0, 10);
        this.scene.add(light);
    }

    animate() {
        if (!this.loadingMesh) return;

        requestAnimationFrame(() => this.animate());

        this.loadingMesh.rotation.x += 0.01;
        this.loadingMesh.rotation.y += 0.01;

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this.renderer.dispose();
    }
}

// Initialize when DOM is ready
let heroBackground;
let loadingAnimation;

document.addEventListener('DOMContentLoaded', () => {
    // Start loading animation
    loadingAnimation = new LoadingAnimation();

    // Simulate loading time - faster for better UX
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');

        setTimeout(() => {
            loadingScreen.style.display = 'none';
            if (loadingAnimation) {
                loadingAnimation.destroy();
            }

            // Initialize hero background after loading
            const heroCanvas = document.getElementById('hero-canvas');
            if (heroCanvas) {
                heroBackground = new HeroBackground();
            }
        }, 300);
    }, 1000);
});

export { HeroBackground, LoadingAnimation };
