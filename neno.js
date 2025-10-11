/* TODO: Add idle animations such as sleep, scratch and yawn
 * TODO: Allow for more than one cat on a page
 * TODO: Add alert animation when starting to move
 * DONE: Make it so neno does't stop under the mouse cursor
      (thresholdClose is calculated using width and speed)
 * DONE: If you click on him he goes back to initial position
      (placing an anchor div under him to save location on resize)
 * TODO: Somehow allow user to specify speed (1-4) in html tag
 * TODO: Allow for sourcing cats by name from webneko.net
 * DONE: Make neno draggable
 * TODO: Make hanging from mouse animation when dragged
 */

(async function () {
const catName = 'neno';
  // Check if neno element exists 
  let img = document.getElementById(catName);
  if(!img) {console.log("Could not find neno tag"); return; };
  if(img.tagName !== 'IMG') {console.log("Neno tag was not an img tag"); return; };

  // Remove default dragging functionality from neno
  img.addEventListener('dragstart', preventDrag);
  function preventDrag(e) {
    e.preventDefault();
  };

  img.src = catName + '/still.gif';

  // img.style.visibility = "hidden";
  if (catName == 'neno') img.style.filter = 'drop-shadow(0 0 5px #00ee00)'; // neno glows

  // Waits for click and uses mouse to get initial location
  waitForLoad();
  async function waitForLoad() {
  // Wait for the window load event
    await new Promise((resolve) => {
      window.addEventListener('load', resolve); // Resolve once everything is loaded
    });
  }

  const anchor = wrapImageWithContainer(img);
  const posImg = img.getBoundingClientRect();
  const initialStyleImg = window.getComputedStyle(img);
  let posAnchor = anchor.getBoundingClientRect();

  // Debugging visuals for anchor
  // anchor.style.position = 'static';
  // anchor.style.backgroundColor = 'rgba(255, 0, 0, 0.3)'; // semi-transparent red
  // anchor.style.visibility = 'visible'; // 'visible'

  // Prevent jump if margins or padding are set
  img.style.padding = '0px 0px';
  img.style.margin = '0px 0px';
  img.style.zIndex = '1000'; // Visible above most elements
  img.style.width = '32px'; // Change size as needed
  img.style.position = 'absolute';

  // Refresh posAnchor of anchor on window change
  window.addEventListener('scroll', posAnchorRefresh);
  window.addEventListener('resize', posAnchorRefresh);
  function posAnchorRefresh() {
    posAnchor = anchor.getBoundingClientRect();
    console.log("resized");
  };

  const initialX = posAnchor.left + window.scrollX;
  const initialY = posAnchor.top + window.scrollY;
  let targetX = initialX;
  let targetY = initialY;
  let currentX = targetX;
  let currentY = targetY;

  // Get mouse coordinates
  document.addEventListener('mousemove', function (e) {
    targetX = e.pageX;
    targetY = e.pageY;
  });

  let isDragging = false;
  let isIdle = true;
  let follow = "initial";
  img.addEventListener('mousedown', (e) => {
    isDragging = false;
    isIdle = false;
    function onMouseMove(moveEvent) {
      // Drag
      if (moveEvent.clientX - e.pageX != 0 || moveEvent.clientY - e.pageY != 0) {
        // console.log('Drag started');
        isDragging = true;

        img.style.position = 'absolute';
        img.style.padding = '0px 0px';
        img.style.margin = '0px 0px';

        currentX = targetX - posImg.width / 2;
        currentY = targetY; // Drop Offset
        img.style.left = currentX + 'px';
        img.style.top = currentY + 'px';
        img.src = catName + '/held1.gif';

        // Change cursur and make nothing interactable
        document.documentElement.style.pointerEvents = 'none';
        document.documentElement.style.cursor = 'grabbing';
      }
    }

    function onMouseUp(upEvent) {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // Click
      if (!isDragging) {
        // console.log('Click detected');
        follow = (follow == "mouse") ? "initial" : "mouse";
      // Drop
      } else {
        // console.log('Drag ended');

        isDragging = false;
        follow = "mouse";

        // Reset cursur and restore interactability
        document.documentElement.style.pointerEvents = 'auto';
        document.documentElement.style.cursor = 'default';
      }
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  let flip = 1;
  let lastTime = 0;

  requestAnimationFrame(loop); // Start loop

  // Animation loop to move the image smoothly
  function loop(currentTime) {
    if (isIdle) {
      currentX = posAnchor.left + window.scrollX;
      currentY = posAnchor.top + window.scrollY;
      img.src = catName + '/alert.gif';
    }
    // Only execute loop every 250ms
    if (!(currentTime - lastTime >= 250) || isDragging || isIdle) {
      requestAnimationFrame(loop);
      return;
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
      console.log(posAnchor.top, currentY);
      dx = posAnchor.left - currentX + window.scrollX;
      dy = posAnchor.top - currentY + window.scrollY;
    }

    const distance = Math.hypot(dx, dy); //hypotenus

    const directions = [
      [0, "⬆️", "n"],
      [45, "↗️", "ne"],
      [90, "➡️", "e"],
      [135, "↘️", "se"],
      [180, "⬇️", "s"],
      [225, "↙️", "sw"],
      [270, "⬅️", "w"],
      [315, "↖️", "nw"],
      [360, "⬆️", "n"]
    ];     

    // How far in each direction to split speed
    let nextX = (dx / distance) * speed;
    let nextY = (dy / distance) * speed;

    // Prevent stepping out of frame
    const currentBorderX = window.scrollX + window.innerWidth - posImg.width;
    const currentBorderY = window.scrollY + window.innerHeight - posImg.height;
    const toRightBorder = currentBorderX - currentX;
    const toLeftBorder =  window.scrollX - currentX;
    const toBottomBorder = currentBorderY - currentY;
    const toTopBorder = window.scrollY - currentY;

    // const snapBack = false;
    // if (follow != "initial") { // Go outside of border if needed when going to initial
    //   // Check if next step goes beyond frame and neno is not outside of frame
    //   // If so take a step only to the frame edge
    //   if (nextX > toRightBorder && (!(currentX > currentBorderX) || snapBack)) // Right border
    //     nextX = toRightBorder;  
    //   else if (nextX < toLeftBorder && (!(currentX < window.scrollX) || snapBack)) // Left border
    //       nextX = toLeftBorder;
    //   if (nextY > toBottomBorder && (!(currentY > currentBorderY) || snapBack)) // Bottom border
    //     nextY = toBottomBorder;
    //   else if (nextY < toTopBorder && (!(currentY < window.scrollY) || snapBack)) // Top border
    //       nextY = toTopBorder;
    // }

    let directon;
    // Direction for animation
    const angleDegree = calcAngleDegrees(dx, dy);
    direction = getClosest(angleDegree, directions)[2];

    // Stepping
    // Only use thresholdClose if following mouse
    if ((distance >= (follow == "mouse" ? thresholdClose : speed)) &&
        (dx + dy != 0)) {
      currentX += nextX;
      currentY += nextY;
      img.style.position = 'absolute';
      img.style.padding = '0px';
      img.style.margin = '0px';

    }
    // Take final step towards initial position
    else if ((distance < speed) &&
        (dx + dy != 0) &&
        (follow == "initial")) {

      isIdle = true;
      currentX = posAnchor.left;
      currentY = posAnchor.top;
      img.style.position = '';
      copyMarginPadding(initialStyleImg, img);
      direction = "none"; // Snaps more into place with this
    }
    // Idling
    else {
      direction = "none";
    }

    img.style.left = currentX + 'px';
    img.style.top = currentY + 'px';

    // Alternates between 1 and 2 when stepping
    if (direction != "none")
      flip = (flip == 1) ? 2 : 1;

    // Set gif
    if (direction == "none") {
       img.src = catName + '/still.gif';
    }
    else {
       img.src = catName + '/' + direction + 'run' + flip + '.gif';
    }

    requestAnimationFrame(loop);
  }
  function calcAngleDegrees(x, y) {
    return Math.abs(Math.floor((Math.atan2(x, y) * 180 / Math.PI)) - 180);
  }
  function getClosest(number, array) {
    return array.reduce((a, b) => {
      return Math.abs(b[0] - number) < Math.abs(a[0] - number) ? b : a;
    });
  }
  function wrapImageWithContainer(element) {
    const container = document.createElement('div');
    const style = window.getComputedStyle(element);

    // Copy display and sizing
    container.style.display = style.display;
    container.style.width = style.width;
    container.style.height = style.height;

    // Copy margin and padding to avoid layout shifts
    copyMarginPadding(style, container);

    // Copy float and vertical-align (important for inline or floated images)
    container.style.cssFloat = style.cssFloat;
    container.style.verticalAlign = style.verticalAlign;

    // Copy position
    container.style.position = style.position;

    // Insert container before img and move img inside container
    element.parentNode.insertBefore(container, element);
    container.appendChild(element);

    return container;
  }
  function copyMarginPadding(style, element) {
    element.style.marginTop = parseFloat(style.paddingTop) + parseFloat(style.marginTop) + 'px';
    element.style.marginRight = parseFloat(style.paddingRight) + parseFloat(style.marginRight) + 'px';
    element.style.marginBottom = parseFloat(style.paddingBottom) + parseFloat(style.marginBottom) + 'px';
    element.style.marginLeft = parseFloat(style.paddingLeft) + parseFloat(style.marginLeft) + 'px';
  }
  async function waitForClick(element) {
    return new Promise(resolve => {
      const handler = () => {
        element.removeEventListener('click', handler); // Clean up
        resolve();
      };
      element.addEventListener('click', handler);
    });
  }
})();
