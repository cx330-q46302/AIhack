from ursina import *
from ursina.prefabs.button import Button
from ursina.prefabs.text import Text

# Title scene: stylized title + Start button that reveals two options with animation

def create_title_scene(on_start=None, on_tutorial=None):
    """Return an Ursina Entity that represents the title scene.

    Callbacks:
    - on_start(): called when "直接開始" is pressed
    - on_tutorial(): called when "教學" is pressed
    """

    root = Entity(name='title_scene')

    # Background
    camera.background_color = color.rgb(20, 20, 30)

    # Optional pizza model (3D garnish). Attempt to load if available.
    pizza_model_path = 'pizza_duel/assets/models/3dart/Pizza.gld'
    try:
        pizza = Entity(model=pizza_model_path, scale=0.7, position=(0, -0.6, 0.4), rotation=(30, 45, 0), parent=root)
    except Exception:
        pizza = None

    # Stylized title: two lines with spacing for old-game feel
    title_top = Text(" 🍕  最   後   一   個   P I Z Z A   🍕 ",
                     origin=(0, 0),
                     size=2.2,
                     color=color.from_hex('#FFD27F'),
                     x=0, y=0.35,
                     family='VeraMono',
                     parent=root)

    title_sub = Text("  T  h  e   L  a  s  t   P  i  z  z  a",
                     origin=(0, 0),
                     size=0.6,
                     color=color.rgb(200, 200, 220),
                     x=0, y=0.16,
                     family='VeraMono',
                     parent=root)

    # Big circular Start button
    start_btn = Button(text='Start', color=color.red, scale=0.18, radius=0.9)
    start_btn.collider = 'box'
    start_btn.x = 0
    start_btn.y = -0.05
    start_btn.world_parent = root
    start_btn.text_entity.color = color.white
    start_btn.text_entity.font_size = 40
    start_btn._orig_scale = start_btn.scale

    # Two hidden rectangular option buttons
    option_container = Entity(parent=root, y=-0.5)

    btn_start_now = Button(text='直接開始', color=color.azure, scale=(0.5, 0.12), enabled=False, parent=option_container)
    btn_tutorial = Button(text='教學', color=color.yellow, scale=(0.5, 0.12), enabled=False, parent=option_container)

    # Position them off-screen / hidden initially
    btn_start_now.x = -0.4
    btn_tutorial.x = 0.4
    btn_start_now.y = -0.2
    btn_tutorial.y = -0.2
    btn_start_now.alpha = 0
    btn_tutorial.alpha = 0

    # Animation parameters
    anim_duration = 0.35

    def reveal_options():
        # Disable start button to avoid re-trigger
        start_btn.disable()
        # simple scale/pop animation for start button
        start_btn.animate_scale(start_btn._orig_scale * 0.9, duration=0.08, curve=curve.out_exponential)
        invoke(start_btn.animate_scale, start_btn._orig_scale, delay=0.08)

        # animate options to fade/slide in
        btn_start_now.enabled = True
        btn_tutorial.enabled = True

        btn_start_now.animate('y', -0.5, duration=anim_duration, curve=curve.out_expo)
        btn_tutorial.animate('y', -0.5, duration=anim_duration, curve=curve.out_expo)
        btn_start_now.animate('alpha', 1, duration=anim_duration)
        btn_tutorial.animate('alpha', 1, duration=anim_duration)

        # subtle bounce
        btn_start_now.animate('y', -0.45, duration=0.08, delay=anim_duration, curve=curve.out_bounce)
        btn_tutorial.animate('y', -0.45, duration=0.08, delay=anim_duration, curve=curve.out_bounce)

    # Hook start button click
    start_btn.on_click = reveal_options

    # Wire option callbacks
    def _start_now():
        if on_start:
            on_start()

    def _tutorial():
        if on_tutorial:
            on_tutorial()

    btn_start_now.on_click = _start_now
    btn_tutorial.on_click = _tutorial

    # Simple title entrance animation
    for i, ent in enumerate((title_top, title_sub)):
        ent.color = ent.color
        ent.scale = 0.001
        ent.animate_scale(1, duration=0.4, delay=0.05 * i, curve=curve.out_elastic)

    return root


# If run standalone for quick preview
if __name__ == '__main__':
    app = Ursina()

    def on_start_cb():
        print('直接開始 pressed')

    def on_tutorial_cb():
        print('教學 pressed')

    create_title_scene(on_start=on_start_cb, on_tutorial=on_tutorial_cb)
    app.run()
