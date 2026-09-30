/**
 * Tap-to-zoom for inline diagram SVGs (figure.astro). Opens a native modal
 * <dialog> and MOVES the live <svg> node into it — not a clone: each
 * illustration carries id'd <title>/<marker> elements, and a clone would put
 * duplicate ids in the document. The node goes back to its host on close
 * (Esc or the close button). Native showModal() handles
 * focus trapping and returns focus to the trigger on close.
 */
export function attachFigureZoom(root: HTMLElement): () => void {
  const trigger = root.querySelector<HTMLButtonElement>('[data-figure-zoom]');
  const host = root.querySelector<HTMLElement>('[data-figure-svg-host]');
  const dialog = root.querySelector<HTMLDialogElement>('[data-figure-dialog]');
  const body = root.querySelector<HTMLElement>('[data-figure-dialog-body]');
  const closeButton = root.querySelector<HTMLButtonElement>('[data-figure-close]');
  if (!trigger || !host || !dialog || !body || !closeButton || typeof dialog.showModal !== 'function') {
    return () => {};
  }

  const open = () => {
    const svg = host.querySelector('svg');
    if (!svg) return;
    body.append(svg);
    dialog.showModal();
  };

  const restore = () => {
    const svg = body.querySelector('svg');
    if (svg) host.append(svg);
  };

  const close = () => dialog.close();

  // Tap-anywhere on the diagram for pointer users; keyboard/AT users get the
  // labelled trigger button, so the host itself stays a plain image.
  trigger.addEventListener('click', open);
  host.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  dialog.addEventListener('close', restore);

  return () => {
    if (dialog.open) dialog.close();
    restore();
    trigger.removeEventListener('click', open);
    host.removeEventListener('click', open);
    closeButton.removeEventListener('click', close);
    dialog.removeEventListener('close', restore);
  };
}
