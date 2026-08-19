(function () {
  const initTitleScene = () => {
    const startButton = document.getElementById('title-start-btn');
    const optionGroup = document.getElementById('title-options');
    const startAction = document.getElementById('title-start-action');
    const tutorialAction = document.getElementById('title-tutorial-action');

    if (!startButton || !optionGroup || !startAction || !tutorialAction) {
      return false;
    }

    const revealOptions = () => {
      startButton.disabled = true;
      startButton.classList.add('is-clicked');
      optionGroup.classList.add('is-open');
      optionGroup.setAttribute('aria-hidden', 'false');
    };

    const showScene = (sceneName) => {
      if (window.sceneManager && typeof window.sceneManager.show === 'function') {
        window.sceneManager.show(sceneName);
        return;
      }

      console.log('scene switch requested:', sceneName);
    };

    startButton.addEventListener('click', revealOptions);
    startAction.addEventListener('click', () => showScene('match'));
    tutorialAction.addEventListener('click', () => showScene('tutorial'));
    return true;
  };

  const ensureTitleScene = () => {
    if (initTitleScene()) {
      return;
    }
    requestAnimationFrame(ensureTitleScene);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureTitleScene);
  } else {
    ensureTitleScene();
  }
})();
