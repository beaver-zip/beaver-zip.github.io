(() => {
  'use strict';
  const data = JSON.parse(document.querySelector('#gallery-data').textContent);
  const projects = [...document.querySelectorAll('article.project')];
  const links = [...document.querySelectorAll('[data-project]')];
  const select = document.querySelector('#project-select');
  const previousProject = document.querySelector('.project-prev');
  const nextProject = document.querySelector('.project-next');
  const position = document.querySelector('.project-position');
  let activeIndex = 0;

  function showProject(index, {push = true, focus = false} = {}) {
    if (index < 0 || index >= projects.length) return;
    activeIndex = index;
    const current = projects[index];
    for (const article of projects) article.hidden = article !== current;
    for (const link of links) {
      if (link.dataset.project === current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    select.value = current.id;
    previousProject.disabled = index === 0;
    nextProject.disabled = index === projects.length - 1;
    position.textContent = `${String(index + 1).padStart(2, '0')} / ${projects.length}`;
    document.title = `${data[current.id].title} | 이한서 포트폴리오`;
    if (push && location.hash !== `#${current.id}`) history.pushState(null, '', `#${current.id}`);
    window.scrollTo({top: 0, behavior: 'instant'});
    if (focus) current.querySelector('h2').focus({preventScroll: true});
  }
  function fromHash() {
    const index = projects.findIndex(article => `#${article.id}` === location.hash);
    showProject(Math.max(0, index), {push: false});
  }
  for (const link of links) link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showProject(projects.findIndex(article => article.id === link.dataset.project), {focus: true});
  });
  select.addEventListener('change', () => showProject(projects.findIndex(article => article.id === select.value)));
  previousProject.addEventListener('click', () => showProject(activeIndex - 1, {focus: true}));
  nextProject.addEventListener('click', () => showProject(activeIndex + 1, {focus: true}));
  window.addEventListener('popstate', fromHash);
  window.addEventListener('hashchange', fromHash);
  document.querySelector('.name').addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();showProject(0);
  });
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    projects[activeIndex].querySelector('h2').focus({preventScroll: true});
  });
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return;
    if (document.querySelector('dialog[open]')) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return;
    const direction = {ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1}[event.key];
    if (!direction) return;
    event.preventDefault();
    showProject(activeIndex + direction, {focus: true});
  });
  document.body.classList.add('project-mode');
  fromHash();

  function prepareDialog(dialog, closeButton) {
    let trigger;
    let overflow;
    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = overflow;
      trigger?.focus({preventScroll: true});
    });
    return button => {
      trigger = button;
      overflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      closeButton.focus();
    };
  }

  const imageDialog = document.querySelector('#image-dialog');
  const openImageDialog = prepareDialog(imageDialog, imageDialog.querySelector('.dialog-close'));
  const photo = document.querySelector('#dialog-image');
  const title = document.querySelector('#dialog-title');
  const caption = document.querySelector('#dialog-caption');
  const counter = imageDialog.querySelector('.image-count');
  const original = imageDialog.querySelector('.original');
  const previousImage = imageDialog.querySelector('.prev');
  const nextImage = imageDialog.querySelector('.next');
  let currentGallery;
  let imageIndex = 0;
  function showImage(index) {
    const items = data[currentGallery].items;
    imageIndex = Math.max(0, Math.min(index, items.length - 1));
    const item = items[imageIndex];
    photo.src = item.src;photo.alt = item.caption;original.href = item.src;
    title.textContent = data[currentGallery].title;caption.textContent = item.caption;
    counter.textContent = `${imageIndex + 1} / ${items.length}`;
    previousImage.disabled = imageIndex === 0;
    nextImage.disabled = imageIndex === items.length - 1;
  }
  document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => {
    currentGallery = button.dataset.gallery;showImage(Number(button.dataset.image));openImageDialog(button);
  }));
  previousImage.addEventListener('click', () => showImage(imageIndex - 1));
  nextImage.addEventListener('click', () => showImage(imageIndex + 1));
  imageDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();showImage(imageIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });

  const detailDialog = document.querySelector('#detail-dialog');
  const openDetailDialog = prepareDialog(detailDialog, detailDialog.querySelector('.detail-modal-close'));
  const detailContent = detailDialog.querySelector('.detail-modal-content');
  document.querySelectorAll('[data-details]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.details;
    document.querySelector('#detail-modal-title').textContent = `${data[key].title} · 구현 과정`;
    detailContent.replaceChildren(document.querySelector(`#${key}-details`).content.cloneNode(true));
    openDetailDialog(button);detailContent.scrollTop = 0;
  }));
})();
