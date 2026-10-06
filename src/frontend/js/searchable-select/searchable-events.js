/**
 * Event binding and key navigation for SearchableSelect
 */

export function bindSearchableEvents(instance) {
  instance.triggerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!instance.disabled) instance.toggle();
  });

  instance.searchInput.addEventListener('input', (e) => {
    const q = e.target.value;
    instance.clearBtn.classList.toggle('hidden', !q.trim());
    instance.filter(q);
  });

  instance.clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    instance.searchInput.value = '';
    instance.clearBtn.classList.add('hidden');
    instance.filter('');
    instance.searchInput.focus();
  });

  instance.dropdown.addEventListener('click', (e) => e.stopPropagation());

  instance.searchInput.addEventListener('keydown', (e) => handleSearchableKeydown(instance, e));

  document.addEventListener('click', (e) => {
    if (instance.isOpen && !instance.wrapper.contains(e.target)) instance.close();
  });
}

export function handleSearchableKeydown(instance, e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    instance.navigateOptions(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    instance.navigateOptions(-1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (instance.activeIndex >= 0 && instance.activeIndex < instance.filteredItems.length) {
      instance.select(instance.filteredItems[instance.activeIndex]);
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    instance.close();
  }
}
