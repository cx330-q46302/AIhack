(function () {
  const initTutorialScene = () => {
    const backButton = document.getElementById('tutorial-back-btn');
    const startButton = document.getElementById('tutorial-start-btn');

    if (!backButton || !startButton) {
      return false;
    }

    const showScene = (sceneName) => {
      if (window.sceneManager && typeof window.sceneManager.show === 'function') {
        window.sceneManager.show(sceneName);
        return;
      }

      console.log('scene switch requested:', sceneName);
    };

    backButton.addEventListener('click', () => showScene('title'));
    startButton.addEventListener('click', () => showScene('match'));
    return true;
  };

  const ensureTutorialScene = () => {
    if (initTutorialScene()) {
      return;
    }
    requestAnimationFrame(ensureTutorialScene);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureTutorialScene);
  } else {
    ensureTutorialScene();
  }
})();
