import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.159.0/examples/jsm/loaders/GLTFLoader.js';

(function () {
  const initMatchScene = async () => {
    const canvas = document.getElementById('match-3d-canvas');
    const exitButton = document.getElementById('match-exit-btn');
    if (!canvas) return false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14141e);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color(0x14141e), 1);

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight || 1, 0.1, 100);
    camera.position.set(0, 1.4, 7.2);
    camera.lookAt(0, 0.8, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff0d6, 1.8);
    keyLight.position.set(4, 7, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7ab8ff, 0.8);
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);

    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(4.8, 5.2, 0.8, 48),
      new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.8, metalness: 0.12 })
    );
    table.position.y = -1.75;
    scene.add(table);

    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.7, 0.22, 48),
      new THREE.MeshStandardMaterial({ color: 0xf4d7a5, roughness: 0.65, metalness: 0.08 })
    );
    plate.position.y = -1.2;
    scene.add(plate);

    const fallbackRoot = new THREE.Group();

    const handFallback = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.6, 1.6, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0xf4d6b8, roughness: 0.7 })
    );
    handFallback.position.set(0, -2.05, 2.2);
    handFallback.rotation.x = -0.5;
    fallbackRoot.add(handFallback);

    const pizzaFallback = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5c969, roughness: 0.75 })
    );
    pizzaFallback.position.set(0, -1.1, 0);
    fallbackRoot.add(pizzaFallback);

    const aiFallback = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.2, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x9fd3ff, roughness: 0.8 })
    );
    aiFallback.position.set(0, -0.2, -3.2);
    fallbackRoot.add(aiFallback);

    scene.add(fallbackRoot);

    const loadedModels = { hand: null, pizza: null, alpaca: null };
    const assetMap = {
      hand: new URL('../assets/models/hand.glb', import.meta.url).href,
      pizza: new URL('../assets/models/Pizza.glb', import.meta.url).href,
      alpaca: new URL('../assets/models/Alpaca.glb', import.meta.url).href
    };

    const loader = new GLTFLoader();

    const loadModel = (key, url, apply) => new Promise((resolve) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene || gltf.scenes?.[0];
          if (model) {
            apply(model);
            scene.add(model);
            loadedModels[key] = model;
          }
          resolve(model);
        },
        undefined,
        () => {
          console.warn(`Unable to load ${key} model at ${url}`);
          resolve(null);
        }
      );
    });

    await Promise.all([
      loadModel('hand', assetMap.hand, (model) => {
        model.position.set(0, -2.0, 2.3);
        model.rotation.set(-0.75, 0, 0);
        model.scale.setScalar(0.9);
      }),
      loadModel('pizza', assetMap.pizza, (model) => {
        model.position.set(0, -1.1, 0);
        model.scale.setScalar(0.8);
      }),
      loadModel('alpaca', assetMap.alpaca, (model) => {
        model.position.set(0, -0.5, -3.1);
        model.rotation.set(0, Math.PI, 0);
        model.scale.setScalar(0.9);
      })
    ]);

    if (loadedModels.hand) {
      handFallback.visible = false;
    }
    if (loadedModels.pizza) {
      pizzaFallback.visible = false;
    }
    if (loadedModels.alpaca) {
      aiFallback.visible = false;
    }

    const resizeRenderer = () => {
      const { clientWidth, clientHeight } = canvas;
      const ratio = Math.min(window.devicePixelRatio, 2);
      if (canvas.width !== Math.floor(clientWidth * ratio) || canvas.height !== Math.floor(clientHeight * ratio)) {
        renderer.setPixelRatio(ratio);
        renderer.setSize(clientWidth, clientHeight, false);
      }
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();

      if (loadedModels.pizza) {
        loadedModels.pizza.rotation.y = t * 0.55;
      }

      if (loadedModels.alpaca) {
        loadedModels.alpaca.position.y = -0.45 + Math.sin(t * 1.6) * 0.08;
      }

      if (loadedModels.hand) {
        loadedModels.hand.position.y = -2.0 + Math.sin(t * 2.2) * 0.06;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    resizeRenderer();
    window.addEventListener('resize', resizeRenderer);

    if (exitButton) {
      exitButton.addEventListener('click', () => {
        if (window.sceneManager && typeof window.sceneManager.show === 'function') {
          window.sceneManager.show('title');
        }
      });
    }

    animate();
    return true;
  };

  const ensureMatchScene = async () => {
    if (document.getElementById('match-3d-canvas')) {
      const started = await initMatchScene();
      if (started) return;
    }
    requestAnimationFrame(ensureMatchScene);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureMatchScene);
  } else {
    ensureMatchScene();
  }
})();
