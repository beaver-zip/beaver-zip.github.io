(() => {
  'use strict';
  const data = JSON.parse(document.querySelector('#gallery-data').textContent);
  const dialog = document.querySelector('#image-dialog');
  const photo = document.querySelector('#dialog-image');
  const title = document.querySelector('#dialog-title');
  const caption = document.querySelector('#dialog-caption');
  const counter = dialog.querySelector('.image-count');
  const original = dialog.querySelector('.original');
  const previous = dialog.querySelector('.prev');
  const next = dialog.querySelector('.next');
  let currentGallery;
  let currentIndex = 0;
  let trigger;
  let savedOverflow = '';

  function showImage(index) {
    const items = data[currentGallery].items;
    currentIndex = Math.max(0, Math.min(index, items.length - 1));
    const item = items[currentIndex];
    photo.src = item.src;
    photo.alt = item.caption;
    original.href = item.src;
    title.textContent = data[currentGallery].title;
    caption.textContent = item.caption;
    counter.textContent = `${currentIndex + 1} / ${items.length}`;
    previous.disabled = currentIndex === 0;
    next.disabled = currentIndex === items.length - 1;
  }

  document.querySelectorAll('[data-gallery]').forEach(button => {
    button.addEventListener('click', () => {
      trigger = button;
      currentGallery = button.dataset.gallery;
      showImage(Number(button.dataset.image));
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      dialog.querySelector('.dialog-close').focus();
    });
  });
  previous.addEventListener('click', () => showImage(currentIndex - 1));
  next.addEventListener('click', () => showImage(currentIndex + 1));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = savedOverflow;
    trigger?.focus({preventScroll:true});
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {event.preventDefault();showImage(currentIndex - 1);}
    if (event.key === 'ArrowRight') {event.preventDefault();showImage(currentIndex + 1);}
  });

  const select = document.querySelector('#project-select');
  const articles = [...document.querySelectorAll('.project')];
  const navLinks = [...document.querySelectorAll('[data-project]')];
  let scheduled = false;
  function updatePosition() {
    const marker = window.innerWidth <= 800 ? 160 : 140;
    let active = articles[0].id;
    for (const article of articles) {
      if (article.getBoundingClientRect().top <= marker) active = article.id;
      else break;
    }
    for (const link of navLinks) {
      if (link.dataset.project === active) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
    if (document.activeElement !== select) select.value = active;
    scheduled = false;
  }
  function scheduleUpdate() {
    if (!scheduled) {scheduled = true;requestAnimationFrame(updatePosition);}
  }
  select.addEventListener('change', () => {
    if (select.value) location.hash = select.value;
    select.blur();
  });
  window.addEventListener('scroll',scheduleUpdate,{passive:true});
  window.addEventListener('resize',scheduleUpdate,{passive:true});
  window.addEventListener('hashchange',scheduleUpdate);
  document.querySelectorAll('details').forEach(item => item.addEventListener('toggle',scheduleUpdate));
  updatePosition();
})();
