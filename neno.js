(function () {
  if (window.Neno) return;
  // The release build replaces this with the encoded GIFs.
  const sprites = null;
  const scriptURL = document.currentScript?.src || document.baseURI;
  const spriteURL = name => sprites ? sprites[name] : new URL('neno/' + name + '.gif', scriptURL).href;
  const placeholder = spriteURL('blank');
  const cats = new Map();
  const preloaded = new Map();
  const types = 'white black gray calico robot peach colourful earth air water fire spirit rainbow silversky orange ghetto neon pink ghost lucky moka usa rose blue silver kuramecha kina ace spooky holiday valentine marmalade royal mermaid socks dave jess mike lucy fancy'.split(' ');
  const imgID = 'neno';
  // Wait for DOM to load
  function start() {
    // Get all nenos
    const images = document.querySelectorAll("img." + imgID + ", img#" + imgID);
    images.forEach(img => {
      if (cats.has(img)) return;
      nenoController(img, spriteURL);
    });
  }
  window.Neno = {
    init: start,
    types: ['Neno', ...types],
    spawn(container = document.body, alt = 'Neno') {
      const img = document.createElement('img');
      img.className = 'neno';
      img.alt = alt;
      container.appendChild(img);
      nenoController(img, spriteURL);
      return img;
    },
    followAll() {
      for (const cat of cats.values()) cat.follow();
    },
    clear() {
      for (const cat of cats.values()) cat.remove();
    },
    get count() { return cats.size; }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

function nenoController(img, spriteURL) {
  const events = new AbortController();
  if (!img.hasAttribute('alt')) img.alt = 'Neno';
  img.src = placeholder;
  const type = img.alt.trim().toLowerCase();
  const remote = types.includes(type);
  if (remote) {
    spriteURL = name => `https://webneko.net/${type}/${name}.gif`;
    // Keep every frame loaded so switching poses cannot cancel a slow download.
    if (!preloaded.has(type)) preloaded.set(type, Object.fromEntries('still alert nrun1 nrun2 nerun1 nerun2 erun1 erun2 serun1 serun2 srun1 srun2 swrun1 swrun2 wrun1 wrun2 nwrun1 nwrun2 yawn sleep1 sleep2 itch1 itch2 nscratch1 nscratch2 escratch1 escratch2 sscratch1 sscratch2 wscratch1 wscratch2'.split(' ').map(name => {
      const image = new Image();
      image.src = spriteURL(name);
      return [name, image];
    })));
  }
  const glow = remote ? 'none' : 'drop-shadow(0 0 5px #00ee00)';
  // A small personal chase angle spreads paths without changing the speed.
  const turn = (Math.random() - .5) * .24;
  const chaseCos = Math.cos(turn), chaseSin = Math.sin(turn);
  let currentSprite;
  function setSprite(name) {
    if (remote && name === 'held') name = 'still';
    if (name === currentSprite) return;
    currentSprite = name;
    const frame = preloaded.get(type)?.[name];
    // Keep the last pose (or the placeholder) until this frame has loaded.
    if (!frame || (frame.complete && frame.naturalWidth)) img.src = spriteURL(name);
    else frame.addEventListener('load', () => {
      if (currentSprite === name) img.src = frame.src;
    }, { once: true, signal: events.signal });
  }
  // Remove default dragging functionality for neno
  img.addEventListener('dragstart', preventDrag, { signal: events.signal });
  function preventDrag(e) {
    e.preventDefault();
  };

  setSprite('still');

  const anchor = document.createElement('img');
  anchor.src = placeholder;
  anchor.alt = '';
  anchor.setAttribute('aria-hidden', 'true');
  anchor.style.visibility = 'hidden';
  const posImg = { width: 32, height: 32 };
  img.style.setProperty('width', '32px', 'important');
  img.style.setProperty('height', '32px', 'important');
  img.style.cursor = 'pointer';
  img.style.touchAction = 'none';
  img.style.userSelect = 'none';
  img.style.filter = glow;
  const homeStyle = img.style.cssText;
  img.removeAttribute('srcset');
  img.loading = 'eager';
  img.draggable = false;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let isIdle = true;
  let animation = false;
  let isDragging = false;
  let follow = "initial";
  let pagePosition = false;

  function positionOnPage(onPage) {
    if (pagePosition === onPage) return;
    const direction = onPage ? 1 : -1;
    currentX += direction * window.scrollX;
    currentY += direction * window.scrollY;
    pagePosition = onPage;
    img.style.setProperty('position', onPage ? 'absolute' : 'fixed', 'important');
  }

  function activate() {
    const rect = img.getBoundingClientRect();
    const style = window.getComputedStyle(img);
    // Hold the image's layout slot while it moves around the viewport.
    for (const property of ['display', 'position', 'float', 'vertical-align', 'margin', 'padding', 'border', 'box-sizing', 'top', 'right', 'bottom', 'left']) {
      anchor.style.setProperty(property, style.getPropertyValue(property));
    }
    if (style.display === 'inline') anchor.style.display = 'inline-block';
    anchor.style.width = style.width;
    anchor.style.height = style.height;
    img.replaceWith(anchor);
    document.documentElement.appendChild(img);
    img.style.cssText = `all: initial !important; display: block !important; position: fixed !important; inset: auto !important; width: 32px !important; height: 32px !important; z-index: 1000 !important; cursor: pointer !important; touch-action: none !important; user-select: none !important; filter: ${glow} !important;`;
    currentX = rect.left;
    currentY = rect.top;
    pagePosition = false;
    isIdle = false;
    renderPosition();
  }

  function returnHome() {
    img.style.cssText = homeStyle;
    anchor.replaceWith(img);
    isIdle = true;
    follow = 'initial';
    setSprite('still');
  }

  // Pointer coordinates stay relative to the viewport.
  function updateTarget(e) {
    if (!e.isPrimary) return;
    targetX = e.clientX;
    targetY = e.clientY;
  }
  document.addEventListener('pointermove', updateTarget);
  window.addEventListener('resize', renderPosition);
  window.visualViewport?.addEventListener('resize', renderPosition);
  window.visualViewport?.addEventListener('scroll', renderPosition);
  function renderPosition() {
    if (isIdle) return;
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0;
    const top = viewport?.offsetTop || 0;
    const width = viewport?.width || document.documentElement.clientWidth;
    const height = viewport?.height || document.documentElement.clientHeight;
    if (follow === 'mouse' || isDragging) {
      currentX = Math.max(left, Math.min(currentX, left + Math.max(0, width - 32)));
      currentY = Math.max(top, Math.min(currentY, top + Math.max(0, height - 32)));
    }
    img.style.setProperty('left', currentX + 'px', 'important');
    img.style.setProperty('top', currentY + 'px', 'important');
  }
  let cancelDrag;
  img.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !e.isPrimary || cancelDrag) return;
    e.preventDefault();
    updateTarget(e);
    if (isIdle) activate();
    positionOnPage(false);
    renderPosition();
    img.setPointerCapture(e.pointerId);
    isDragging = false;
    isIdle = false;
    animation = false;
    function onMouseMove(moveEvent) {
      // Drag
      if (moveEvent.pointerId !== e.pointerId) return;
      if (moveEvent.pointerType === 'mouse' && moveEvent.buttons === 0) {
        onMouseUp(moveEvent);
        return;
      }
      if (Math.hypot(moveEvent.clientX - e.clientX, moveEvent.clientY - e.clientY) > 3) {
        isDragging = true;
        updateTarget(moveEvent);
        currentX = targetX - posImg.width / 2;
        currentY = targetY + posImg.height / 20; // Hold Offset
        renderPosition();
        setSprite('held');
        img.style.setProperty('cursor', 'grabbing', 'important');
      }
    }

    function onMouseUp(upEvent) {
      if (upEvent.pointerId !== undefined && upEvent.pointerId !== e.pointerId) return;
      document.removeEventListener('pointermove', onMouseMove);
      document.removeEventListener('pointerup', onMouseUp);
      document.removeEventListener('pointercancel', onMouseUp);
      img.removeEventListener('lostpointercapture', onMouseUp);
      window.removeEventListener('blur', onMouseUp);
      cancelDrag = null;
      if (img.hasPointerCapture(e.pointerId)) img.releasePointerCapture(e.pointerId);

      // Click
      if (!isDragging && upEvent.type === 'pointerup') {
        follow = (follow == "mouse") ? "initial" : "mouse";
      // Drop
      } else if (isDragging) {
        currentX = targetX - posImg.width / 2;
        currentY = targetY + posImg.width / 4; // Drop Offset
        isDragging = false;
        follow = "mouse";

      }
      img.style.setProperty('cursor', 'pointer', 'important');
      setSprite('still');
      positionOnPage(follow === 'initial');
      renderPosition();
    }

    cancelDrag = () => onMouseUp({ type: 'cancel' });
    document.addEventListener('pointermove', onMouseMove);
    document.addEventListener('pointerup', onMouseUp);
    document.addEventListener('pointercancel', onMouseUp);
    img.addEventListener('lostpointercapture', onMouseUp);
    window.addEventListener('blur', onMouseUp);
  }, { signal: events.signal });

  let flip = 1;
  let lastTime = 0;
  let sinceNone = 0;
  let animationCount = 0;
  const loopEveryDefault = 250;
  let loopEvery = loopEveryDefault;
  let frame;
  function remove() {
    cancelDrag?.();
    events.abort();
    cancelAnimationFrame(frame);
    document.removeEventListener('pointermove', updateTarget);
    window.removeEventListener('resize', renderPosition);
    window.visualViewport?.removeEventListener('resize', renderPosition);
    window.visualViewport?.removeEventListener('scroll', renderPosition);
    img.remove();
    anchor.remove();
    cats.delete(img);
  }
  cats.set(img, { remove, follow() {
    if (cancelDrag) return;
    if (isIdle) activate();
    follow = 'mouse';
    positionOnPage(false);
    renderPosition();
  } });

  frame = requestAnimationFrame(loop); // Start loop

  // Animation loop to move the image smoothly
  function loop(currentTime) {
    if (!img.isConnected || (!isIdle && !anchor.isConnected)) { remove(); return; }
    // Only execute loop every 250ms
    if (!(currentTime - lastTime >= loopEvery) || cancelDrag || isIdle) {
      frame = requestAnimationFrame(loop);
      return;
    }
    else {
      loopEvery = loopEveryDefault;
    }
    lastTime = currentTime;

    const speed = 16; // pixels per running itteration
    const thresholdClose = speed + posImg.width / 2; // Stop moving when this close to mouse
    let dx, dy;
    if (follow == "mouse") {
      dx = targetX - currentX - posImg.width / 2;
      dy = targetY - currentY - posImg.height / 2;
    }
    else if (follow == "initial") {
      const home = anchor.getBoundingClientRect();
      dx = home.left + window.scrollX - currentX;
      dy = home.top + window.scrollY - currentY;
    }

    const distance = Math.hypot(dx, dy); //hypotenus

    // How far in each direction to split speed
    let nextX = distance ? (dx / distance) * speed : 0;
    let nextY = distance ? (dy / distance) * speed : 0;
    if (follow === 'mouse' && cats.size > 1) {
      // Only bend the chase; the return home keeps its original straight path.
      const x = nextX;
      nextX = x * chaseCos - nextY * chaseSin;
      nextY = x * chaseSin + nextY * chaseCos;
    }

    // Direction for animation
    let direction;
    const angleDegree = calcAngleDegrees(nextX, nextY);
    const directions = [ [0, "⬆️", "n"], [45, "↗️", "ne"], [90, "➡️", "e"], [135, "↘️", "se"], [180, "⬇️", "s"], [225, "↙️", "sw"], [270, "⬅️", "w"], [315, "↖️", "nw"], [360, "⬆️", "n"] ];
    direction = getClosest(angleDegree, directions)[2];

    // Stepping
    // Only use thresholdClose if following mouse
    if ((distance >= (follow == "mouse" ? thresholdClose : speed)) &&
        distance > 0) {
      currentX += nextX;
      currentY += nextY;

    }
    // Take final step towards initial position
    else if ((distance < speed) &&
        (follow == "initial")) {
      returnHome();
      frame = requestAnimationFrame(loop);
      return;
    }
    // Idling when waiting for mouse to move
    else {

      direction = "none";
    }

    // Alternates between 1 and 2 when stepping
    if (direction != "none")
      flip = (flip == 1) ? 2 : 1;

    // Set gif
    if (direction != "none" && sinceNone <= 1) {
      currentX -= nextX; currentY -= nextY; // Don't move
      if (sinceNone == 0) {
        setSprite('alert');
        // Vary only the alert pause; running keeps its regular pace.
        if (follow === 'mouse') loopEvery = 150 + Math.random() * 200;
      } else if (sinceNone == 1)
        setSprite('still');
      sinceNone++;
    }
    else if (direction == "none") {
      if (Math.floor(Math.random() * 4) == 0 || animation) {

        if (!animation || animation < 0) {
          // Negative means no animation, 1..3 means animation
          animation = Math.floor(Math.random() * 8) - 4; // (-5..3)
          animationCount = 0;
        }

        if (animation == 1)
          // Yawn
          if (animationCount <= 4) {
            setSprite('yawn');
          }
          else if (animationCount <= 10){
            setSprite('still');
          }
          else {
            setSprite('still');
            animation = 100;
          }
        // Sleep
        else if (animation == 100) {
          if ((animationCount % 6) < 3) {
            setSprite('sleep1');
          } else {
            setSprite('sleep2');
          }
        }
        // Itch
        else if (animation == 2) {
          loopEvery = 150;
          if (animationCount % 2 == 0)
            setSprite('itch1');
          else
            setSprite('itch2');
          if (animationCount >= 11)
            animation = false;
        }
        // Scratch
        else if (animation >= 3) {
          const alternating = animationCount % 2 + 1;
          if (animation == 3)
            animation = Math.floor(Math.random() * 4) + 4;

          if (animation == 4)
            setSprite('nscratch' + alternating);
          else if (animation == 5)
            setSprite('sscratch' + alternating);
          else if (animation == 6)
            setSprite('escratch' + alternating);
          else if (animation == 7)
            setSprite('wscratch' + alternating);
          if (animationCount >= 7)
            animation = false;
        }
        else {
          setSprite('still');
        }

        animationCount++;
      }
      else {
        setSprite('still');
      }
      sinceNone = 0;
    }
    else {
      animation = false;
      setSprite(direction + 'run' + flip);
    }

    // Actual movement
    renderPosition();

    frame = requestAnimationFrame(loop);
  }
  function calcAngleDegrees(x, y) {
    return Math.abs(Math.floor((Math.atan2(x, y) * 180 / Math.PI)) - 180);
  }
  function getClosest(number, array) {
    return array.reduce((a, b) => {
      return Math.abs(b[0] - number) < Math.abs(a[0] - number) ? b : a;
    });
  }
}
})();
