(() => {
  'use strict';
  const data = JSON.parse(document.querySelector('#gallery-data').textContent);
  const projects = [...document.querySelectorAll('article.project')];
  const links = [...document.querySelectorAll('[data-project]')];
  const select = document.querySelector('#project-select');
  // 두 화면(위: 대표 화면, 아래: 설명) 배치를 쓰는 폭. portfolio.css의 860px 구간과 맞춘다.
  const desktop = matchMedia('(min-width: 861px)');
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
    // 목차의 현재 위치 표시를 이 프로젝트의 바탕색으로
    document.documentElement.style.setProperty('--marker', getComputedStyle(current).getPropertyValue('--stage'));
    if (push && location.hash !== `#${current.id}`) history.pushState(null, '', `#${current.id}`);
    fitText();
    window.scrollTo({top: 0, behavior: 'instant'});
    if (focus) current.querySelector('h2').focus({preventScroll: true});
  }
  // 제목은 한 줄에, 설명 화면은 창 높이 안에 들어오도록 글자 크기를 조금씩 줄인다.
  function fitText() {
    const bottom = projects[activeIndex].querySelector('.panel-bottom');
    const title = projects[activeIndex].querySelector('h2');
    let fit = 1;
    bottom.style.setProperty('--fit', fit);
    title.style.fontSize = '';
    if (!desktop.matches) return;
    // 긴 제목은 한 줄에 들어올 때까지 글자를 줄인다(CSS에서 줄바꿈을 막아 둠). 32px 아래로는 줄이지 않음.
    for (let size = parseFloat(getComputedStyle(title).fontSize); title.scrollWidth > title.clientWidth && size > 32;) {
      title.style.fontSize = `${(size -= 2)}px`;
    }
    // shortcut: 0.7배(약 12px)까지만 줄임. 그래도 넘치는 낮은 창에서는 설명 안에서 스크롤. 더 줄여야 하면 내용을 줄일 것.
    while (bottom.scrollHeight > innerHeight + 1 && fit > 0.7) {
      fit = Math.round((fit - 0.02) * 100) / 100;
      bottom.style.setProperty('--fit', fit);
    }
  }
  function fromHash() {
    const index = projects.findIndex(article => `#${article.id}` === location.hash);
    showProject(Math.max(0, index), {push: false});
  }
  for (const link of links)
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      showProject(
        projects.findIndex(article => article.id === link.dataset.project),
        {focus: true},
      );
    });
  select.addEventListener('change', () => showProject(projects.findIndex(article => article.id === select.value)));
  window.addEventListener('resize', fitText);
  document.fonts.ready.then(fitText);
  window.addEventListener('popstate', fromHash);
  window.addEventListener('hashchange', fromHash);
  document.querySelector('.name').addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showProject(0);
  });
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    projects[activeIndex].querySelector('h2').focus({preventScroll: true});
  });
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat)
      return;
    if (document.querySelector('dialog[open]')) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return;
    // 좌우: 프로젝트 이동
    const direction = {ArrowLeft: -1, ArrowRight: 1}[event.key];
    if (direction) {
      event.preventDefault();
      showProject(activeIndex + direction, {focus: true});
      return;
    }
    // 상하: 한 프로젝트 안에서 화면 ↔ 설명. 모바일 폭에서는 평소처럼 스크롤.
    if (!desktop.matches) return;
    const bottom = projects[activeIndex].querySelector('.panel-bottom');
    const bottomTop = Math.round(bottom.getBoundingClientRect().top + scrollY);
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    // 설명이 창보다 길면 그 안에서는 평소처럼 스크롤되도록, 경계에서만 가로챔
    if (event.key === 'ArrowDown' && scrollY < bottomTop - 1) {
      event.preventDefault();
      scrollTo({top: bottomTop, behavior});
    } else if (event.key === 'ArrowUp' && scrollY > 0 && scrollY <= bottomTop + 1) {
      event.preventDefault();
      scrollTo({top: 0, behavior});
    }
  });
  fromHash();

  function prepareDialog(dialog, closeButton) {
    let trigger;
    let overflow;
    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
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
    photo.src = item.src;
    photo.alt = item.caption;
    original.href = item.src;
    title.textContent = data[currentGallery].title;
    caption.textContent = item.caption;
    counter.textContent = `${imageIndex + 1} / ${items.length}`;
    previousImage.disabled = imageIndex === 0;
    nextImage.disabled = imageIndex === items.length - 1;
  }
  document.querySelectorAll('[data-gallery]').forEach(button =>
    button.addEventListener('click', () => {
      currentGallery = button.dataset.gallery;
      showImage(Number(button.dataset.image));
      openImageDialog(button);
    }),
  );
  previousImage.addEventListener('click', () => showImage(imageIndex - 1));
  nextImage.addEventListener('click', () => showImage(imageIndex + 1));
  imageDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showImage(imageIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });

  const detailDialog = document.querySelector('#detail-dialog');
  const openDetailDialog = prepareDialog(detailDialog, detailDialog.querySelector('.detail-modal-close'));
  const detailContent = detailDialog.querySelector('.detail-modal-content');
  document.querySelectorAll('[data-details]').forEach(button =>
    button.addEventListener('click', () => {
      const key = button.dataset.details;
      document.querySelector('#detail-modal-title').textContent = `${data[key].title} · 구현 과정`;
      detailContent.replaceChildren(document.querySelector(`#${key}-details`).content.cloneNode(true));
      openDetailDialog(button);
      detailContent.scrollTop = 0;
    }),
  );
})();
