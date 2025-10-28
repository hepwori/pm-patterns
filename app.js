document.addEventListener('DOMContentLoaded', () => {
  const contentEl = document.getElementById('content');
  const navLinksEl = document.getElementById('nav-links');
  const patternMap = new Map();
  let patternsData = null;

  const renderTableOfContents = () => {
    let html = '<h1>Table of Contents</h1>';
    patternsData.groups.forEach(group => {
      html += `<h2>${group.name}</h2>`;
      html += '<ul>';
      group.patterns.forEach(pattern => {
        html += `<li><a href="#${pattern.file}"><strong>${pattern.name}</strong></a>: ${pattern.summary}</li>`;
      });
      html += '</ul>';
    });
    contentEl.innerHTML = html;
  };

  const renderMarkdown = async (file) => {
    const response = await fetch(file);
    if (response.ok) {
      let text = await response.text();
      // Handle cross-links
      text = text.replace(/\[\[(.*?)\]\]/g, (match, patternFile) => {
        const patternName = patternMap.get(`patterns/${patternFile}`) || patternFile.replace('.md', '');
        return `<a href="#patterns/${patternFile}">${patternName}</a>`;
      });
      contentEl.innerHTML = marked.parse(text);
    } else {
      contentEl.innerHTML = `<p>Error loading content.</p>`;
    }
  };

  const loadContent = () => {
    const hash = window.location.hash.substring(1);
    if (!hash || hash === '#') {
      renderMarkdown(patternsData.home);
    } else if (hash === 'contents') {
      renderTableOfContents();
    } else {
      renderMarkdown(hash);
    }
  };

  fetch('patterns.json')
    .then(response => response.json())
    .then(data => {
      patternsData = data;

      // Home link
      const homeLink = document.createElement('a');
      homeLink.href = `#`;
      homeLink.textContent = 'Home';
      navLinksEl.appendChild(homeLink);

      // Contents link
      const contentsLink = document.createElement('a');
      contentsLink.href = `#contents`;
      contentsLink.textContent = 'Contents';
      navLinksEl.appendChild(contentsLink);

      if (data.about) {
        const aboutLink = document.createElement('a');
        aboutLink.href = `#${data.about}`;
        aboutLink.textContent = 'About';
        navLinksEl.appendChild(aboutLink);
      }

      data.groups.forEach(group => {
        const groupEl = document.createElement('div');
        const groupTitle = document.createElement('h2');
        groupTitle.textContent = group.name;
        groupEl.appendChild(groupTitle);

        const patternList = document.createElement('ul');
        group.patterns.forEach(pattern => {
          patternMap.set(pattern.file, pattern.name);
          const patternItem = document.createElement('li');
          const patternLink = document.createElement('a');
          patternLink.href = `#${pattern.file}`;
          patternLink.textContent = pattern.name;
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