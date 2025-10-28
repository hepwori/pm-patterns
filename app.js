document.addEventListener('DOMContentLoaded', () => {
  const contentEl = document.getElementById('content');
  const navLinksEl = document.getElementById('nav-links');
  const patternMeta = new Map();
  const navLinkMap = new Map();
  let patternsData = null;

  const setBodyClass = (pageType) => {
    document.body.classList.remove('page-home', 'page-pattern', 'page-contents', 'page-about');
    document.body.classList.add(`page-${pageType}`);
  };

  const enhanceBlockquotes = () => {
    const calloutConfig = {
      tip: { label: 'Tip', tone: 'callout-tip' },
      note: { label: 'Note', tone: 'callout-note' },
      info: { label: 'Info', tone: 'callout-info' },
      warning: { label: 'Warning', tone: 'callout-warning' },
      caution: { label: 'Caution', tone: 'callout-warning' }
    };

    contentEl.querySelectorAll('blockquote').forEach(blockquote => {
      const firstChild = blockquote.firstElementChild;
      if (!firstChild) {
        blockquote.setAttribute('data-callout', 'Note');
        return;
      }

      const text = firstChild.textContent.trim();
      const match = text.match(/^\[!(tip|note|info|warning|caution)\]\s*(.*)$/i);

      if (match) {
        const [, type, remainder] = match;
        const normalizedType = type.toLowerCase();
        const config = calloutConfig[normalizedType] || calloutConfig.info;
        blockquote.setAttribute('data-callout', config.label);
        blockquote.classList.add('callout', config.tone);
        if (remainder) {
          firstChild.textContent = remainder.trim();
        } else {
          firstChild.remove();
        }
      } else {
        blockquote.setAttribute('data-callout', 'Note');
        blockquote.classList.add('callout');
      }
    });
  };

  const enhanceCodeBlocks = () => {
    contentEl.querySelectorAll('pre > code').forEach(codeEl => {
      const languageClass = Array.from(codeEl.classList).find(cls => cls.startsWith('language-'));
      if (languageClass) {
        const language = languageClass.replace('language-', '').toUpperCase();
        codeEl.parentElement.setAttribute('data-language', language);
      }
    });
  };

  const insertPatternMeta = (file) => {
    const meta = patternMeta.get(file);
    if (!meta) return;

    const metaHtml = `
      <section class="pattern-meta" aria-label="Pattern details">
        <span class="pattern-meta__badge">${meta.group}</span>
        <p class="pattern-meta__summary"><strong>${meta.name}</strong> — ${meta.summary}</p>
      </section>
    `;

    contentEl.insertAdjacentHTML('afterbegin', metaHtml);
  };

  const applyContentEnhancements = (file) => {
    insertPatternMeta(file);
    enhanceBlockquotes();
    enhanceCodeBlocks();
  };

  const updateContent = (html, file) => {
    contentEl.innerHTML = html;
    applyContentEnhancements(file);
    try {
      contentEl.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      contentEl.scrollTop = 0;
    }
    requestAnimationFrame(() => {
      contentEl.classList.add('is-visible');
    });
  };

  const updateActiveLink = (target) => {
    navLinkMap.forEach((link, key) => {
      link.classList.toggle('is-active', key === target);
    });
  };

  const renderTableOfContents = () => {
    contentEl.classList.remove('is-visible');
    setBodyClass('contents');
    let html = '<h1>Table of Contents</h1>';
    patternsData.groups.forEach(group => {
      html += `<h2>${group.name}</h2>`;
      html += '<ul>';
      group.patterns.forEach(pattern => {
        html += `<li><a href="#${pattern.file}"><strong>${pattern.name}</strong></a>: ${pattern.summary}</li>`;
      });
      html += '</ul>';
    });
    updateContent(html, 'contents');
    updateActiveLink('contents');
  };

  const renderMarkdown = async (file) => {
    contentEl.classList.remove('is-visible');

    if (file === patternsData.home) {
      setBodyClass('home');
    } else if (file === patternsData.about) {
      setBodyClass('about');
    } else {
      setBodyClass('pattern');
    }

    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error('Failed to load content');
      let text = await response.text();

      text = text.replace(/\[\[(.*?)\]\]/g, (match, patternFile) => {
        const meta = patternMeta.get(`patterns/${patternFile}`);
        const patternName = meta ? meta.name : patternFile.replace('.md', '');
        return `<a href="#patterns/${patternFile}">${patternName}</a>`;
      });

      const parsed = marked.parse(text);
      updateContent(parsed, file);
      updateActiveLink(file);
    } catch (err) {
      updateContent('<p>Error loading content.</p>', file);
    }
  };

  const loadContent = () => {
    const rawHash = window.location.hash.substring(1);
    const target = rawHash && rawHash !== '#' ? rawHash : patternsData.home;

    if (target === 'contents') {
      renderTableOfContents();
    } else {
      renderMarkdown(target);
    }
  };

  const registerNavLink = (link, target) => {
    link.dataset.target = target;
    navLinkMap.set(target, link);
  };

  navLinksEl.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-target]');
    if (!link) return;
    contentEl.classList.remove('is-visible');
  });

  fetch('patterns.json')
    .then(response => response.json())
    .then(data => {
      patternsData = data;

      const homeLink = document.createElement('a');
      homeLink.href = '#';
      homeLink.textContent = 'Home';
      registerNavLink(homeLink, data.home);
      navLinksEl.appendChild(homeLink);

      const contentsLink = document.createElement('a');
      contentsLink.href = '#contents';
      contentsLink.textContent = 'Contents';
      registerNavLink(contentsLink, 'contents');
      navLinksEl.appendChild(contentsLink);

      if (data.about) {
        const aboutLink = document.createElement('a');
        aboutLink.href = `#${data.about}`;
        aboutLink.textContent = 'About';
        registerNavLink(aboutLink, data.about);
        navLinksEl.appendChild(aboutLink);
      }

      data.groups.forEach(group => {
        const groupEl = document.createElement('section');
        const groupTitle = document.createElement('h2');
        groupTitle.textContent = group.name;
        groupEl.appendChild(groupTitle);

        const patternList = document.createElement('ul');
        group.patterns.forEach(pattern => {
          patternMeta.set(pattern.file, {
            name: pattern.name,
            summary: pattern.summary,
            group: group.name
          });

          const patternItem = document.createElement('li');
          const patternLink = document.createElement('a');
          patternLink.href = `#${pattern.file}`;
          patternLink.textContent = pattern.name;
          registerNavLink(patternLink, pattern.file);
          patternItem.appendChild(patternLink);
          patternList.appendChild(patternItem);
        });

        groupEl.appendChild(patternList);
        navLinksEl.appendChild(groupEl);
      });

      loadContent();
    });

  window.addEventListener('hashchange', loadContent);
});
