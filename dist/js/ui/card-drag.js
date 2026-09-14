// Pointer dragging shares the same play action and energy validation as clicks.
export function installCardDrag({ root, canPlay, play }) {
  let drag = null,
    suppressClickUntil = 0;
  const inside = (event, zone) => {
    if (!zone) return false;
    const r = zone.getBoundingClientRect();
    return (
      event.clientX >= r.left &&
      event.clientX <= r.right &&
      event.clientY >= r.top &&
      event.clientY <= r.bottom
    );
  };
  function cancel() {
    if (!drag) return;
    const pointer = drag.pointer;
    if (drag.ghost) suppressClickUntil = Date.now() + 450;
    drag.ghost?.remove();
    drag.card.classList.remove('card-being-dragged');
    root.classList.remove('dragging-card', 'over-play-zone');
    drag = null;
    if (root.hasPointerCapture(pointer)) root.releasePointerCapture(pointer);
  }
  root.addEventListener('pointerdown', (event) => {
    const card = event.target.closest('.hand [data-action="play"]');
    if (event.button !== 0 || !event.isPrimary || !card || !canPlay(card.dataset.uid)) return;
    cancel();
    drag = {
      card,
      uid: card.dataset.uid,
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  });
  window.addEventListener(
    'pointermove',
    (event) => {
      if (!drag || drag.pointer !== event.pointerId) return;
      if (!drag.ghost && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 9) return;
      event.preventDefault();
      if (!drag.ghost) {
        const rect = drag.card.getBoundingClientRect();
        drag.ghost = drag.card.cloneNode(true);
        drag.ghost.removeAttribute('data-action');
        drag.ghost.removeAttribute('style');
        drag.ghost.setAttribute('aria-hidden', 'true');
        drag.ghost.tabIndex = -1;
        drag.ghost.classList.add('card-drag-ghost');
        drag.ghost.style.width = `${rect.width}px`;
        document.body.append(drag.ghost);
        root.setPointerCapture(event.pointerId);
        drag.card.classList.add('card-being-dragged');
        root.classList.add('dragging-card');
      }
      drag.ghost.style.left = `${event.clientX}px`;
      drag.ghost.style.top = `${event.clientY}px`;
      root.classList.toggle(
        'over-play-zone',
        inside(event, root.querySelector('.card-play-zone')) && canPlay(drag.uid),
      );
    },
    { passive: false },
  );
  window.addEventListener('pointerup', (event) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    const uid = drag.uid,
      valid = drag.ghost && inside(event, root.querySelector('.card-play-zone')) && canPlay(uid);
    cancel();
    if (valid) {
      event.preventDefault();
      play(uid);
    }
  });
  window.addEventListener('pointercancel', cancel);
  root.addEventListener('lostpointercapture', cancel);
  window.addEventListener('blur', cancel);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cancel();
  });
  document.addEventListener(
    'click',
    (event) => {
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
  return {
    cancel,
    get active() {
      return !!drag?.ghost;
    },
  };
}
