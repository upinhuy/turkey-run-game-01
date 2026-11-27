// input.js — keyboard and mouse input, kept apart from the game logic.
// The game reads a fresh snapshot each frame: which keys are held, which
// were just pressed, and where the mouse clicked.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let mouse = { x: 0, y: 0, clicked: false, justClicked: false };

  function onKeyDown(e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code);
  }

  function onKeyUp(e) {
    keys.delete(e.code);
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  }

  function onMouseDown(e) {
    onMouseMove(e);
    mouse.clicked = true;
    mouse.justClicked = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    held(code) {
      return keys.has(code);
    },
    // True only on the frame the key went down.
    justPressed(code) {
      return pressed.has(code);
    },
    jumpPressed() {
      return pressed.has('Space') || pressed.has('ArrowUp') || pressed.has('KeyW');
    },
    hideHeld() {
      return keys.has('ArrowDown') || keys.has('KeyS');
    },
    dashHeld() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight');
    },
    leftHeld() {
      return keys.has('ArrowLeft') || keys.has('KeyA');
    },
    rightHeld() {
      return keys.has('ArrowRight') || keys.has('KeyD');
    },
    click() {
      return mouse.justClicked;
    },
    mousePos() {
      return { x: mouse.x, y: mouse.y };
    },
    // Call at the end of every frame so just-pressed keys and clicks fire once.
    endFrame() {
      pressed.clear();
      mouse.justClicked = false;
    },
  };
}
