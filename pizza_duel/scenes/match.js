import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.159.0/examples/jsm/loaders/GLTFLoader.js';

(function () {
  const defaultPizzaCount = 3;

  function fingerUp(points, tip, pip) {
    return points[tip][1] < points[pip][1];
  }

  function recognizeGesture(points) {
    const index = fingerUp(points, 8, 6);
    const middle = fingerUp(points, 12, 10);
    const ring = fingerUp(points, 16, 14);
    const pinky = fingerUp(points, 20, 18);

    if (index && !middle && !ring && !pinky) {
      return '1';
    }

    if (index && middle && !ring && !pinky) {
      return '2';
    }

    return '未知';
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const initMatchScene = async () => {
    const canvas = document.getElementById('match-3d-canvas');
    const exitButton = document.getElementById('match-exit-btn');
    const video = document.getElementById('match-camera-video');
    const overlayCanvas = document.getElementById('match-camera-overlay');
    const pizzaCountEl = document.getElementById('match-pizza-count');

    if (!canvas || !video) return false;

    const pizzaState = {
      remaining: defaultPizzaCount,
      lastGesture: null,
      lastGestureAt: 0,
    };

    const updatePizzaState = (change) => {
      pizzaState.remaining = Math.max(0, pizzaState.remaining - change);
      if (pizzaCountEl) {
        pizzaCountEl.textContent = String(pizzaState.remaining);
      }
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14141e);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color(0x14141e), 1);

    const threeCamera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight || 1, 0.1, 100);
    threeCamera.position.set(0, 1.4, 7.2);
    threeCamera.lookAt(0, 0.8, 0);

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
      alpaca: new URL('../assets/models/Alpaca.glb', import.meta.url).href,
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
      loadedModels.pizza.userData.baseScale = 0.8;
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
      threeCamera.aspect = clientWidth / clientHeight;
      threeCamera.updateProjectionMatrix();
    };

    const setPizzaScaleForRemaining = () => {
      if (!loadedModels.pizza) return;
      const rate = Math.max(0.3, pizzaState.remaining / defaultPizzaCount);
      loadedModels.pizza.scale.setScalar(loadedModels.pizza.userData.baseScale * rate);
    };

    const onGesture = (gesture) => {
      if (gesture === '未知') return;
      const now = performance.now();
      if (pizzaState.lastGesture === gesture && now - pizzaState.lastGestureAt < 600) {
        return;
      }
      pizzaState.lastGesture = gesture;
      pizzaState.lastGestureAt = now;

      if (gesture === '1') {
        updatePizzaState(1);
      } else if (gesture === '2') {
        updatePizzaState(2);
      }

      setPizzaScaleForRemaining();
    };

    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
    } catch (error) {
      console.warn('MediaPipe load failed, continuing with camera placeholder only:', error);
      return true;
    }

    if (!window.Hands || !window.Camera) {
      console.warn('MediaPipe camera helpers not ready');
      return true;
    }

    const overlayCtx = overlayCanvas?.getContext('2d');
    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      const canvasWidth = video.videoWidth || 640;
      const canvasHeight = video.videoHeight || 480;

      if (overlayCanvas) {
        overlayCanvas.width = canvasWidth;
        overlayCanvas.height = canvasHeight;
      }

      if (!overlayCtx) return;
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const points = results.multiHandLandmarks[0].map((landmark) => [landmark.x, landmark.y, landmark.z]);
        const gesture = recognizeGesture(points);
        onGesture(gesture);

        overlayCtx.strokeStyle = '#00ff99';
        overlayCtx.lineWidth = 4;

        for (const line of [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [5, 9], [9, 10], [10, 11], [11, 12],
          [9, 13], [13, 14], [14, 15], [15, 16],
          [13, 17], [17, 18], [18, 19], [19, 20],
          [0, 17]
        ]) {
          const [a, b] = line;
          const p1 = results.multiHandLandmarks[0][a];
          const p2 = results.multiHandLandmarks[0][b];
          overlayCtx.beginPath();
          overlayCtx.moveTo(p1.x * overlayCanvas.width, p1.y * overlayCanvas.height);
          overlayCtx.lineTo(p2.x * overlayCanvas.width, p2.y * overlayCanvas.height);
          overlayCtx.stroke();
        }
      }
    });

    const webcamCamera = new window.Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 640,
      height: 480,
    });

    try {
      await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      webcamCamera.start();
    } catch (error) {
      console.warn('Camera access not available:', error);
      video.poster = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
          <rect width="100%" height="100%" fill="#d0d0d0"/>
          <circle cx="320" cy="220" r="90" fill="#9a9a9a"/>
          <circle cx="320" cy="150" r="42" fill="#f0f0f0"/>
        </svg>
      `);
      video.style.objectFit = 'cover';
      return true;
    }

    resizeRenderer();
    window.addEventListener('resize', resizeRenderer);

    if (exitButton) {
      exitButton.addEventListener('click', () => {
        if (window.sceneManager && typeof window.sceneManager.show === 'function') {
          window.sceneManager.show('title');
        }
      });
    }

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

      renderer.render(scene, threeCamera);
      requestAnimationFrame(animate);
    };

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
