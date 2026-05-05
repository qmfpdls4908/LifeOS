import { Component } from '../core/Component.js';

export class RouteView extends Component {
  #service;
  
  constructor(routeService) {
    super();
    this.#service = routeService;
  }

  render() {
    const dests = this.#service.getAllDestinations();
    return `
      <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
        <button id="btn-show-add-dest" class="btn-primary" style="align-self: flex-start; padding: 0.6rem 1.5rem;">+ 새로운 목적지</button>
        <div id="add-dest-form" style="display: none; background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 12px; border: 1px solid var(--glass-border);">
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <input type="text" id="new-dest-name" class="glass-input" placeholder="목적지 이름 (예: 부산역, 학원)" style="flex: 1;">
            <button id="btn-save-dest" class="btn-primary" style="padding: 0.5rem 1rem;">추가</button>
            <button id="btn-cancel-dest" style="background: transparent; border: 1px solid var(--text-secondary); color: var(--text-secondary); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">취소</button>
          </div>
        </div>
        <div id="dest-list" style="display: flex; flex-direction: column; gap: 2rem;">
          ${dests.length === 0 ? '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">등록된 목적지가 없습니다.</p>' : dests.map(d => this.#renderDestination(d)).join('')}
        </div>
      </div>
    `;
  }

  #renderDestination(dest) {
    return `
      <div class="glass-card dest-card" data-dest-id="${dest.id}" style="position: relative;">
        <div class="dest-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="color: var(--accent-blue); margin: 0;">${this.#escapeHtml(dest.name)}</h3>
          <div style="display: flex; gap: 0.4rem;">
            <button data-action="edit-dest" data-dest-id="${dest.id}" style="background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.4); color: var(--accent-blue); padding: 0.3rem 0.7rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">✏️ 수정</button>
            <button data-action="delete-dest" data-dest-id="${dest.id}" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); color: var(--danger); padding: 0.3rem 0.7rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">🗑️ 삭제</button>
          </div>
        </div>

        <div class="edit-dest-form" data-dest-id="${dest.id}" style="display: none; margin-bottom: 1rem;">
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" class="glass-input edit-dest-name" value="${this.#escapeAttr(dest.name)}" style="flex: 1;">
            <button data-action="save-dest-edit" data-dest-id="${dest.id}" class="btn-primary" style="padding: 0.5rem 1rem;">저장</button>
            <button data-action="cancel-dest-edit" data-dest-id="${dest.id}" style="background: transparent; border: 1px solid var(--text-secondary); color: var(--text-secondary); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">취소</button>
          </div>
        </div>

        <div class="routes-grid" style="display: grid; gap: 0.8rem; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
          ${dest.routes.length === 0 ? '<p style="color: var(--text-secondary); font-size: 0.85rem;">등록된 경로가 없습니다.</p>' : dest.routes.map(r => this.#renderRoute(dest.id, r)).join('')}
        </div>

        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
          <button data-action="show-add-route" data-dest-id="${dest.id}" style="background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: var(--accent-purple); padding: 0.4rem 1rem; border-radius: 20px; cursor: pointer; font-size: 0.85rem;">+ 경로 추가</button>
          <div class="add-route-form" data-dest-id="${dest.id}" style="display: none; margin-top: 0.8rem;">
            ${this.#renderRouteForm(dest.id, 'add')}
          </div>
        </div>
      </div>
    `;
  }

  #renderRoute(destId, route) {
    return `
      <div class="route-card" data-route-id="${route.id}" style="background: rgba(255,255,255,0.04); padding: 0.8rem; border-radius: 8px; position: relative;">
        <div class="route-display">
          <div style="font-weight: 600; margin-bottom: 0.3rem; color: var(--text-primary); font-size: 0.9rem;">${this.#escapeHtml(route.method)}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.15rem;">
            <span>📍 ${this.#escapeHtml(route.from)} ➔ ${this.#escapeHtml(route.to)}</span>
            <span>⏱ ${this.#escapeHtml(route.duration)}</span>
            <span>💰 ${this.#escapeHtml(route.cost)}</span>
            ${route.time ? '<span>⏰ ' + this.#escapeHtml(route.time) + '</span>' : ''}
            ${route.details ? '<span style="font-size: 0.75rem; opacity: 0.8;">' + this.#escapeHtml(route.details) + '</span>' : ''}
             ${route.images && route.images.length > 0 ? `
               <div style="display: flex; gap: 0.3rem; margin-top: 0.3rem;">
                 ${route.images.map(img => '<img src="' + this.#escapeAttr(img) + '" data-action="view-image" data-src="' + this.#escapeAttr(img) + '" style="height: 60px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); object-fit: contain; cursor: pointer;" title="클릭하여 확대">').join('')}
               </div>
            ` : ''}
          </div>
          <div style="margin-top: 0.5rem; display: flex; gap: 0.3rem;">
            <button data-action="edit-route" data-dest-id="${destId}" data-route-id="${route.id}" style="background: transparent; border: 1px solid var(--text-secondary); color: var(--text-secondary); padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">✏️</button>
            <button data-action="delete-route" data-dest-id="${destId}" data-route-id="${route.id}" style="background: transparent; border: 1px solid var(--danger); color: var(--danger); padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">🗑️</button>
          </div>
        </div>
        <div class="edit-route-form" data-route-id="${route.id}" style="display: none;">
          ${this.#renderRouteForm(destId, 'edit', route)}
        </div>
      </div>
    `;
  }

  #renderRouteForm(destId, mode, route) {
    const data = route || {};
    const prefix = mode === 'add' ? 'add' : 'edit-' + data.id;
    return `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
          <div class="input-group" style="margin: 0;">
            <label style="font-size: 0.75rem;">교통편</label>
            <input type="text" class="glass-input route-${prefix}-method" value="${this.#escapeAttr(data.method || '')}" placeholder="예: KTX, 버스" style="padding: 0.4rem;">
          </div>
          <div class="input-group" style="margin: 0;">
            <label style="font-size: 0.75rem;">출발 시각 (선택)</label>
            <input type="text" class="glass-input route-${prefix}-time" value="${this.#escapeAttr(data.time || '')}" placeholder="예: 07:25 탑승" style="padding: 0.4rem;">
          </div>
          <div class="input-group" style="margin: 0;">
            <label style="font-size: 0.75rem;">출발지</label>
            <input type="text" class="glass-input route-${prefix}-from" value="${this.#escapeAttr(data.from || '')}" placeholder="예: 부산역" style="padding: 0.4rem;">
          </div>
          <div class="input-group" style="margin: 0;">
            <label style="font-size: 0.75rem;">도착지</label>
            <input type="text" class="glass-input route-${prefix}-to" value="${this.#escapeAttr(data.to || '')}" placeholder="예: 울산역" style="padding: 0.4rem;">
          </div>
          <div class="input-group" style="margin: 0;">
            <label style="font-size: 0.75rem;">소요 시간</label>
            <input type="text" class="glass-input route-${prefix}-duration" value="${this.#escapeAttr(data.duration || '')}" placeholder="예: 약 20분" style="padding: 0.4rem;">
          </div>
          <div class="input-group" style="margin: 0;">
            <label style="font-size: 0.75rem;">비용</label>
            <input type="text" class="glass-input route-${prefix}-cost" value="${this.#escapeAttr(data.cost || '')}" placeholder="예: ₩8,400" style="padding: 0.4rem;">
          </div>
        </div>
        <div class="input-group" style="margin: 0;">
          <label style="font-size: 0.75rem;">추가 정보 (선택)</label>
          <input type="text" class="glass-input route-${prefix}-details" value="${this.#escapeAttr(data.details || '')}" placeholder="예: 탑승 장소 안내" style="padding: 0.4rem;">
        </div>
        <div class="input-group" style="margin: 0;">
          <label style="font-size: 0.75rem;">📷 탑승 정보 이미지 (선택)</label>
          <div class="image-thumbs image-thumbs-${prefix}" style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.3rem; min-height: 64px;">
            ${(data.images || []).map((img, i) => `
              <div class="thumb-item" style="position: relative; width: 80px; height: 60px; border-radius: 6px; overflow: hidden; border: 1px solid var(--glass-border); flex-shrink: 0;">
                <img src="${this.#escapeAttr(img)}" data-action="view-image" data-src="${this.#escapeAttr(img)}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" alt="탑승정보" title="클릭하여 확대">
                <button data-action="remove-image" data-prefix="${prefix}" data-index="${i}" style="position: absolute; top: 2px; right: 2px; background: rgba(239,68,68,0.85); border: none; color: white; width: 18px; height: 18px; border-radius: 50%; cursor: pointer; font-size: 10px; line-height: 1; display: flex; align-items: center; justify-content: center;">✕</button>
              </div>
            `).join('')}
          </div>
          <button data-action="add-image" data-prefix="${prefix}" style="margin-top: 0.3rem; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: var(--accent-purple); padding: 0.3rem 0.8rem; border-radius: 20px; cursor: pointer; font-size: 0.8rem;">➕ 이미지 추가</button>
          <input type="file" class="hidden-file-input hidden-file-input-${prefix}" data-prefix="${prefix}" accept="image/*" style="display: none;">
          <input type="hidden" class="route-${prefix}-images" value="${this.#escapeAttr(JSON.stringify(data.images || []))}">
        </div>
        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button data-action="${mode === 'add' ? 'save-new-route' : 'save-route-edit'}" data-dest-id="${destId}" data-route-id="${data.id || ''}" class="btn-primary" style="padding: 0.4rem 1rem; font-size: 0.85rem;">저장</button>
          <button data-action="${mode === 'add' ? 'cancel-add-route' : 'cancel-route-edit'}" data-dest-id="${destId}" data-route-id="${data.id || ''}" style="background: transparent; border: 1px solid var(--text-secondary); color: var(--text-secondary); padding: 0.4rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">취소</button>
        </div>
      </div>
    `;
  }

  #escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  #escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  setupEvents() {
    // Re-render helper
    const rerender = () => {
      this.element.innerHTML = this.render();
      this.setupEvents();
    };

    // ── Destination: show add form ──
    this.element.querySelector('#btn-show-add-dest')?.addEventListener('click', () => {
      this.element.querySelector('#add-dest-form').style.display = 'block';
      this.element.querySelector('#btn-show-add-dest').style.display = 'none';
      this.element.querySelector('#new-dest-name').focus();
    });

    this.element.querySelector('#btn-cancel-dest')?.addEventListener('click', () => {
      this.element.querySelector('#add-dest-form').style.display = 'none';
      this.element.querySelector('#btn-show-add-dest').style.display = 'inline-block';
    });

    // ── Destination: save ──
    this.element.querySelector('#btn-save-dest')?.addEventListener('click', () => {
      const input = this.element.querySelector('#new-dest-name');
      const name = input.value.trim();
      if (name) {
        this.#service.addDestination(name);
        rerender();
      }
    });

    // ── Destination: edit ──
    this.element.querySelectorAll('[data-action="edit-dest"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const destCard = btn.closest('.dest-card');
        destCard.querySelector('.dest-header').style.display = 'none';
        destCard.querySelector('.edit-dest-form').style.display = 'block';
        destCard.querySelector('.edit-dest-name').focus();
      });
    });

    this.element.querySelectorAll('[data-action="save-dest-edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const destId = btn.dataset.destId;
        const form = btn.closest('.edit-dest-form');
        const input = form.querySelector('.edit-dest-name');
        const name = input.value.trim();
        if (name) {
          this.#service.updateDestination(destId, name);
          rerender();
        }
      });
    });

    this.element.querySelectorAll('[data-action="cancel-dest-edit"]').forEach(btn => {
      btn.addEventListener('click', () => rerender());
    });

    // ── Destination: delete ──
    this.element.querySelectorAll('[data-action="delete-dest"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const destId = btn.dataset.destId;
        const dest = this.#service.getDestinationById(destId);
        if (dest && confirm('"' + dest.name + '" 목적지를 삭제할까요? 등록된 경로도 모두 삭제됩니다.')) {
          this.#service.deleteDestination(destId);
          rerender();
        }
      });
    });

    // ── Route: show add form ──
    this.element.querySelectorAll('[data-action="show-add-route"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const destId = btn.dataset.destId;
        btn.style.display = 'none';
        const form = this.element.querySelector('.add-route-form[data-dest-id="' + destId + '"]');
        form.style.display = 'block';
        form.querySelector('input').focus();
      });
    });

    // ── Route: save new ──
    this.element.querySelectorAll('[data-action="save-new-route"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const destId = btn.dataset.destId;
        const form = btn.closest('.add-route-form');
        const data = this.#collectRouteFormData(form, 'add');
        if (this.#validateRouteData(data)) {
          this.#service.addRoute(destId, data);
          rerender();
        }
      });
    });

    // ── Route: cancel add ──
    this.element.querySelectorAll('[data-action="cancel-add-route"]').forEach(btn => {
      btn.addEventListener('click', () => rerender());
    });

    // ── Route: edit ──
    this.element.querySelectorAll('[data-action="edit-route"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const routeId = btn.dataset.routeId;
        const routeCard = this.element.querySelector('.route-card[data-route-id="' + routeId + '"]');
        routeCard.querySelector('.route-display').style.display = 'none';
        routeCard.querySelector('.edit-route-form').style.display = 'block';
        routeCard.querySelector('input').focus();
      });
    });

    // ── Route: save edit ──
    this.element.querySelectorAll('[data-action="save-route-edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const destId = btn.dataset.destId;
        const routeId = btn.dataset.routeId;
        const form = btn.closest('.edit-route-form');
        const data = this.#collectRouteFormData(form, 'edit-' + routeId);
        if (this.#validateRouteData(data)) {
          this.#service.updateRoute(destId, routeId, data);
          rerender();
        }
      });
    });

    // ── Route: cancel edit ──
    this.element.querySelectorAll('[data-action="cancel-route-edit"]').forEach(btn => {
      btn.addEventListener('click', () => rerender());
    });

    // ── Route: delete ──
    this.element.querySelectorAll('[data-action="delete-route"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const destId = btn.dataset.destId;
        const routeId = btn.dataset.routeId;
        if (confirm('이 경로를 삭제할까요?')) {
          this.#service.deleteRoute(destId, routeId);
          rerender();
        }
      });
    });

    // ── Image: add (trigger file input) ──
    this.element.querySelectorAll('[data-action="add-image"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prefix = btn.dataset.prefix;
        const container = btn.closest('.add-route-form, .edit-route-form');
        const fileInput = container.querySelector('.hidden-file-input-' + prefix);
        if (fileInput) fileInput.click();
      });
    });

    // ── Image: file selected ──
    this.element.querySelectorAll('.hidden-file-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const prefix = e.target.dataset.prefix;
        const container = e.target.closest('.add-route-form, .edit-route-form');
        this.#processImage(file, container, prefix);
        e.target.value = ''; // Reset so same file can be re-selected
      });
    });

    // ── Image: remove (initial renders only — dynamically added ones bind in #addThumbnail) ──
    this.element.querySelectorAll('[data-action="remove-image"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prefix = btn.dataset.prefix;
        const index = parseInt(btn.dataset.index);
        const container = btn.closest('.add-route-form, .edit-route-form');
        this.#removeImage(container, prefix, index);
      });
    });

    // ── Image: view (lightbox) ──
    this.element.querySelectorAll('[data-action="view-image"]').forEach(img => {
      img.addEventListener('click', () => this.#showLightbox(img.dataset.src));
    });
  }

  #collectRouteFormData(container, prefix) {
    const imagesJson = container.querySelector('.route-' + prefix + '-images')?.value || '[]';
    let images = [];
    try { images = JSON.parse(imagesJson); } catch (e) {}
    return {
      method: container.querySelector('.route-' + prefix + '-method')?.value || '',
      from: container.querySelector('.route-' + prefix + '-from')?.value || '',
      to: container.querySelector('.route-' + prefix + '-to')?.value || '',
      duration: container.querySelector('.route-' + prefix + '-duration')?.value || '',
      cost: container.querySelector('.route-' + prefix + '-cost')?.value || '',
      time: container.querySelector('.route-' + prefix + '-time')?.value || '',
      details: container.querySelector('.route-' + prefix + '-details')?.value || '',
      images: images
    };
  }

  #validateRouteData(data) {
    if (!data.method.trim()) { alert('교통편을 입력해주세요.'); return false; }
    if (!data.from.trim()) { alert('출발지를 입력해주세요.'); return false; }
    if (!data.to.trim()) { alert('도착지를 입력해주세요.'); return false; }
    if (!data.duration.trim()) { alert('소요 시간을 입력해주세요.'); return false; }
    if (!data.cost.trim()) { alert('비용을 입력해주세요.'); return false; }
    return true;
  }

  // ── image handling ──

  #processImage(file, container, prefix) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 1400;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        this.#addThumbnail(container, prefix, dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  #addThumbnail(container, prefix, dataUrl) {
    // Update hidden images field
    const hidden = container.querySelector('.route-' + prefix + '-images');
    let images = [];
    try { images = JSON.parse(hidden.value); } catch (e) {}
    images.push(dataUrl);
    hidden.value = JSON.stringify(images);

    // Add thumbnail to DOM
    const thumbsContainer = container.querySelector('.image-thumbs-' + prefix);
    const idx = images.length - 1;
    const thumb = document.createElement('div');
    thumb.className = 'thumb-item';
    thumb.style.cssText = 'position: relative; width: 80px; height: 60px; border-radius: 6px; overflow: hidden; border: 1px solid var(--glass-border); flex-shrink: 0;';
    thumb.innerHTML = '<img src="' + dataUrl + '" data-action="view-image" data-src="' + dataUrl + '" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" alt="탑승정보" title="클릭하여 확대">' +
      '<button data-action="remove-image" data-prefix="' + prefix + '" data-index="' + idx + '" style="position: absolute; top: 2px; right: 2px; background: rgba(239,68,68,0.85); border: none; color: white; width: 18px; height: 18px; border-radius: 50%; cursor: pointer; font-size: 10px; line-height: 1; display: flex; align-items: center; justify-content: center;">✕</button>';
    thumbsContainer.appendChild(thumb);

    // Bind handlers
    thumb.querySelector('img').addEventListener('click', () => this.#showLightbox(dataUrl));
    thumb.querySelector('button').addEventListener('click', () => {
      this.#removeImage(container, prefix, idx);
    });
  }

  #removeImage(container, prefix, index) {
    const hidden = container.querySelector('.route-' + prefix + '-images');
    let images = [];
    try { images = JSON.parse(hidden.value); } catch (e) {}
    images.splice(index, 1);
    hidden.value = JSON.stringify(images);
    this.#refreshThumbnails(container, prefix, images);
  }

  #refreshThumbnails(container, prefix, images) {
    const thumbsContainer = container.querySelector('.image-thumbs-' + prefix);
    thumbsContainer.innerHTML = images.map((img, i) =>
      '<div class="thumb-item" style="position: relative; width: 80px; height: 60px; border-radius: 6px; overflow: hidden; border: 1px solid var(--glass-border); flex-shrink: 0;">' +
        '<img src="' + this.#escapeAttr(img) + '" data-action="view-image" data-src="' + this.#escapeAttr(img) + '" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" alt="탑승정보" title="클릭하여 확대">' +
        '<button data-action="remove-image" data-prefix="' + prefix + '" data-index="' + i + '" style="position: absolute; top: 2px; right: 2px; background: rgba(239,68,68,0.85); border: none; color: white; width: 18px; height: 18px; border-radius: 50%; cursor: pointer; font-size: 10px; line-height: 1; display: flex; align-items: center; justify-content: center;">✕</button>' +
      '</div>'
    ).join('');
    // Re-bind handlers
    thumbsContainer.querySelectorAll('img[data-action="view-image"]').forEach(img => {
      img.addEventListener('click', () => this.#showLightbox(img.dataset.src));
    });
    thumbsContainer.querySelectorAll('[data-action="remove-image"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.#removeImage(container, prefix, parseInt(btn.dataset.index));
      });
    });
  }

  #showLightbox(src) {
    // Remove existing lightbox if any
    const existing = document.getElementById('image-lightbox');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'image-lightbox';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    overlay.innerHTML = '<img src="' + src + '" style="max-width: 90vw; max-height: 90vh; border-radius: 8px; box-shadow: 0 8px 40px rgba(0,0,0,0.5); object-fit: contain;">' +
      '<span style="position: absolute; top: 20px; right: 30px; color: white; font-size: 2rem; opacity: 0.7; cursor: pointer;">✕</span>';
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  }

  onMounted() {
    document.getElementById('topbar-title').textContent = 'Routes';
  }
}