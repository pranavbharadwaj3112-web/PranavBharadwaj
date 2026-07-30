/**
 * CYBERROBOTICS HARDWARE SHOWCASE - FRONTEND SCRIPT
 * Dynamically connects to the Express RESTful API (/api/projects),
 * handles loading/error states, client-side filtering, modal inspection, and project submissions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  let allProjects = [];
  let currentCategory = 'All';
  let searchQuery = '';
  let activeSort = 'stars';
  let activeProject = null;

  // DOM Elements
  const projectGrid = document.getElementById('projectGrid');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filterBar = document.getElementById('filterBar');
  const sortSelect = document.getElementById('sortSelect');
  const resultsCount = document.getElementById('resultsCount');
  const emptyState = document.getElementById('emptyState');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  // Stats Elements
  const statProjectsCount = document.getElementById('statProjectsCount');
  const statCategoriesCount = document.getElementById('statCategoriesCount');
  const statTotalStars = document.getElementById('statTotalStars');

  // Modal Elements
  const projectModal = document.getElementById('projectModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalCloseAction = document.getElementById('modalCloseAction');
  const modalHeader = document.getElementById('modalHeader');
  const modalBody = document.getElementById('modalBody');
  const modalStarBtn = document.getElementById('modalStarBtn');
  const modalStarCount = document.getElementById('modalStarCount');

  // Submit Modal Elements
  const submitModal = document.getElementById('submitModal');
  const openSubmitModal = document.getElementById('openSubmitModal');
  const closeSubmitModalBtn = document.getElementById('closeSubmitModalBtn');
  const submitProjectForm = document.getElementById('submitProjectForm');

  // --- 1. RESTFUL API FETCH & LOADING / ERROR STATES ---

  function renderSkeletons() {
    projectGrid.innerHTML = `
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    `;
  }

  function renderError(message) {
    emptyState.classList.add('hidden');
    projectGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid rgba(255,82,82,0.4);">
        <div style="font-size: 3rem; color: #ff5252; margin-bottom: 1rem;"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">API Error Encountered</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">${escapeHTML(message)}</p>
        <button class="btn-primary" id="retryFetchBtn">
          <i class="fa-solid fa-rotate-right"></i> Retry Connection
        </button>
      </div>
    `;

    const retryBtn = document.getElementById('retryFetchBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', fetchProjects);
    }
  }

  async function fetchProjects() {
    renderSkeletons();

    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to retrieve project list.');
      }

      allProjects = data.projects || [];
      updateStats();
      applyFiltersAndRender();
    } catch (error) {
      console.error('REST API Error:', error);
      renderError(error.message || 'Could not connect to the robotics API backend server.');
    }
  }

  // Update top hero statistics
  function updateStats() {
    statProjectsCount.textContent = allProjects.length;
    
    const categories = new Set(allProjects.map(p => p.category));
    statCategoriesCount.textContent = categories.size;

    const totalStars = allProjects.reduce((sum, p) => sum + (p.stars || 0), 0);
    statTotalStars.textContent = totalStars.toLocaleString();
  }

  // --- 2. FILTERING, SEARCHING & SORTING LOGIC ---

  function applyFiltersAndRender() {
    let filtered = [...allProjects];

    // Category Filter
    if (currentCategory !== 'All') {
      filtered = filtered.filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());
    }

    // Search Query Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.components.some(c => c.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (activeSort === 'stars') {
      filtered.sort((a, b) => b.stars - a.stars);
    } else if (activeSort === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (activeSort === 'difficulty') {
      const rank = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 };
      filtered.sort((a, b) => (rank[b.difficulty] || 0) - (rank[a.difficulty] || 0));
    }

    resultsCount.textContent = filtered.length;

    if (filtered.length === 0) {
      projectGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      renderProjectCards(filtered);
    }
  }

  // --- 3. RENDER PROJECT CARDS TO DOM ---

  function renderProjectCards(projects) {
    projectGrid.innerHTML = '';

    projects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.style.setProperty('--card-gradient', project.gradient || 'var(--primary-cyan)');
      
      const difficultyClass = project.difficulty ? project.difficulty.toLowerCase() : 'beginner';

      card.innerHTML = `
        <div>
          <div class="card-header">
            <div class="card-icon">
              <i class="fa-solid ${project.icon || 'fa-microchip'}"></i>
            </div>
            <div class="card-badges">
              <span class="badge-difficulty ${difficultyClass}">${project.difficulty || 'Build'}</span>
            </div>
          </div>
          <div class="card-body">
            <h3 class="card-title">${escapeHTML(project.title)}</h3>
            <p class="card-summary">${escapeHTML(project.summary)}</p>
            <div class="card-tags">
              ${project.tags.slice(0, 4).map(tag => `<span class="tag-pill">${escapeHTML(tag)}</span>`).join('')}
              ${project.tags.length > 4 ? `<span class="tag-pill">+${project.tags.length - 4}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="card-footer">
          <div class="star-count" data-id="${project.id}" title="Star this project">
            <i class="fa-solid fa-star"></i>
            <span>${project.stars}</span>
          </div>
          <span class="btn-inspect">
            Blueprint <i class="fa-solid fa-arrow-right"></i>
          </span>
        </div>
      `;

      // Event listener for opening modal or starring
      card.addEventListener('click', (e) => {
        const starBtn = e.target.closest('.star-count');
        if (starBtn) {
          e.stopPropagation();
          handleStarIncrement(project.id);
        } else {
          openProjectModal(project.id);
        }
      });

      projectGrid.appendChild(card);
    });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // --- 4. STAR / LIKE API INTERACTION ---

  async function handleStarIncrement(projectId) {
    try {
      const res = await fetch(`/api/projects/${projectId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('Could not register star');
      
      const data = await res.json();
      const proj = allProjects.find(p => p.id === projectId);
      if (proj) {
        proj.stars = data.stars;
        updateStats();
        applyFiltersAndRender();
        showToast(`Starred "${proj.title}" (+1 Star)`);
        
        if (activeProject && activeProject.id === projectId) {
          modalStarCount.textContent = proj.stars;
        }
      }
    } catch (err) {
      showToast('Error registering star.', 'warning');
    }
  }

  // --- 5. MODAL BLUEPRINT INSPECTOR (GET /api/projects/:id) ---

  async function openProjectModal(projectId) {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to load project details');
      const data = await res.json();

      const project = data.project;
      activeProject = project;
      const difficultyClass = project.difficulty ? project.difficulty.toLowerCase() : 'beginner';

      modalHeader.innerHTML = `
        <div class="modal-icon-badge">
          <i class="fa-solid ${project.icon || 'fa-microchip'}"></i>
        </div>
        <div class="modal-title-row">
          <h2>${escapeHTML(project.title)}</h2>
          <span class="badge-difficulty ${difficultyClass}">${project.difficulty}</span>
        </div>
        <p style="color: var(--primary-cyan); font-family: var(--font-code); font-size: 0.8rem;">
          <i class="fa-solid fa-circle-check"></i> Status: ${escapeHTML(project.status || 'Active')}
        </p>
      `;

      let specsHTML = '';
      if (project.specs) {
        specsHTML = `
          <div class="specs-section-title"><i class="fa-solid fa-sliders"></i> Hardware Performance Specs</div>
          <div class="specs-grid">
            ${Object.entries(project.specs).map(([key, val]) => `
              <div class="spec-box">
                <span class="spec-key">${escapeHTML(key)}</span>
                <span class="spec-val">${escapeHTML(val)}</span>
              </div>
            `).join('')}
          </div>
        `;
      }

      let componentsHTML = '';
      if (project.components && project.components.length > 0) {
        componentsHTML = `
          <div class="specs-section-title"><i class="fa-solid fa-list-check"></i> Bill of Materials (BOM)</div>
          <ul class="components-list">
            ${project.components.map(comp => `
              <li><i class="fa-solid fa-angle-right"></i> ${escapeHTML(comp)}</li>
            `).join('')}
          </ul>
        `;
      }

      modalBody.innerHTML = `
        <p class="modal-description">${escapeHTML(project.description)}</p>
        ${specsHTML}
        ${componentsHTML}
        <div class="specs-section-title"><i class="fa-solid fa-tags"></i> Stack & Frameworks</div>
        <div class="card-tags" style="margin-bottom: 1rem;">
          ${project.tags.map(t => `<span class="tag-pill">${escapeHTML(t)}</span>`).join('')}
        </div>
      `;

      modalStarCount.textContent = project.stars;
      projectModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    } catch (err) {
      showToast('Could not fetch project blueprint details.', 'warning');
    }
  }

  function closeModal() {
    projectModal.classList.add('hidden');
    document.body.style.overflow = '';
    activeProject = null;
  }

  closeModalBtn.addEventListener('click', closeModal);
  modalCloseAction.addEventListener('click', closeModal);
  projectModal.addEventListener('click', (e) => {
    if (e.target === projectModal) closeModal();
  });

  modalStarBtn.addEventListener('click', () => {
    if (activeProject) {
      handleStarIncrement(activeProject.id);
    }
  });

  // --- 6. SUBMIT NEW PROJECT BLUEPRINT FORM (POST /api/projects) ---

  openSubmitModal.addEventListener('click', () => {
    submitModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });

  closeSubmitModalBtn.addEventListener('click', () => {
    submitModal.classList.add('hidden');
    document.body.style.overflow = '';
  });

  submitModal.addEventListener('click', (e) => {
    if (e.target === submitModal) {
      submitModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });

  submitProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('pTitle').value.trim();
    const category = document.getElementById('pCategory').value;
    const difficulty = document.getElementById('pDifficulty').value;
    const summary = document.getElementById('pSummary').value.trim();
    const tagsStr = document.getElementById('pTags').value.trim();
    const compStr = document.getElementById('pComponents').value.trim();

    const tags = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
    const components = compStr.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      title,
      category,
      difficulty,
      summary,
      description: summary + ' Engineered with open hardware principles and high performance modular architecture.',
      tags: tags.length ? tags : ['Hardware', 'Open-Source'],
      components: components.length ? components : ['Custom Microcontroller']
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Validation failed or server error');
      }

      allProjects.unshift(data.project);
      updateStats();
      applyFiltersAndRender();

      submitProjectForm.reset();
      submitModal.classList.add('hidden');
      document.body.style.overflow = '';

      showToast(`Published "${data.project.title}" to API backend!`);
    } catch (err) {
      showToast(err.message || 'Failed to publish project', 'warning');
    }
  });

  // --- 7. EVENT LISTENERS & SEARCH INPUT ---

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (searchQuery.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    applyFiltersAndRender();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    applyFiltersAndRender();
    searchInput.focus();
  });

  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;

    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    currentCategory = chip.dataset.category;
    applyFiltersAndRender();
  });

  sortSelect.addEventListener('change', (e) => {
    activeSort = e.target.value;
    applyFiltersAndRender();
  });

  resetFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    
    currentCategory = 'All';
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.filter-chip[data-category="All"]').classList.add('active');

    activeSort = 'stars';
    sortSelect.value = 'stars';

    applyFiltersAndRender();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      submitModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });

  // --- 8. TOAST NOTIFICATIONS ---

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = type === 'info' ? 'fa-circle-check' : 'fa-triangle-exclamation';
    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- 9. HERO CANVAS PARTICLES ANIMATION ---

  function initTechCanvas() {
    const canvas = document.getElementById('techCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    });

    const numNodes = 35;
    const nodes = [];

    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1.5
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0, 242, 254, ${1 - dist / 130})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00f2fe';
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  // INITIALIZE
  fetchProjects();
  initTechCanvas();
});
