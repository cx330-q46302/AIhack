import os
from ursina import Ursina, window

# Ensure working directory is repo root so asset-relative paths in scenes resolve correctly
_here = os.path.dirname(__file__)
repo_root = os.path.abspath(os.path.join(_here, '..'))
os.chdir(repo_root)

from scenes.title_scene import create_title_scene


def start_game():
    print('直接開始 pressed - TODO: switch to match scene')


def open_tutorial():
    print('教學 pressed - TODO: load tutorial scene')


if __name__ == '__main__':
    app = Ursina()
    window.title = '最後一個 Pizza'

    # create and attach the title scene UI
    title = create_title_scene(on_start=start_game, on_tutorial=open_tutorial)

    app.run()
