/**
 * SearchableSelect Component
 */

import { renderInitialHtml, renderOptionItemHtml } from './searchable-select/searchable-renderer.js';
import { bindSearchableEvents } from './searchable-select/searchable-events.js';

export class SearchableSelect {
  constructor({ containerId, placeholder = 'Select Option', onSelect = null, emptyMessage = 'No items found' }) {
    this.wrapper = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.placeholder = placeholder;
    this.onSelectCallback = onSelect;
    this.emptyMessage = emptyMessage;
    
    this.items = [];
    this.filteredItems = [];
    this.selectedValue = '';
    this.selectedItem = null;
    this.disabled = true;
    this.isOpen = false;
    this.activeIndex = -1;

    this.render();
    bindSearchableEvents(this);
  }

  render() {
    this.wrapper.innerHTML = renderInitialHtml(this.placeholder, this.emptyMessage);
    this.triggerBtn = this.wrapper.querySelector('.searchable-trigger');
    this.triggerText = this.wrapper.querySelector('.searchable-trigger-text');
    this.triggerBadge = this.wrapper.querySelector('.searchable-trigger-badge');
    this.chevron = this.wrapper.querySelector('.searchable-chevron');
    this.dropdown = this.wrapper.querySelector('.searchable-dropdown');
    this.searchInput = this.wrapper.querySelector('.searchable-input');
    this.clearBtn = this.wrapper.querySelector('.searchable-clear-btn');
    this.countEl = this.wrapper.querySelector('.searchable-count');
    this.optionsList = this.wrapper.querySelector('.searchable-options-list');
    this.emptyState = this.wrapper.querySelector('.searchable-empty-state');
  }

  setItems(items, autoSelectFirst = false) {
    this.items = items || [];
    this.filteredItems = [...this.items];
    this.searchInput.value = '';
    this.clearBtn.classList.add('hidden');
    this.renderOptionsList();

    if (autoSelectFirst && this.items.length === 1) {
      this.select(this.items[0]);
    }
  }

  filter(query) {
    const q = query.trim().toLowerCase();
    this.filteredItems = !q ? [...this.items] : this.items.filter(item => {
      const name = (item.name || item.text || '').toLowerCase();
      const id = String(item.id || item.value || '').toLowerCase();
      const publicId = (item.publicId || '').toLowerCase();
      return name.includes(q) || id.includes(q) || publicId.includes(q);
    });
    this.activeIndex = -1;
    this.renderOptionsList(query);
  }

  renderOptionsList(query = '') {
    this.countEl.textContent = `${this.filteredItems.length} of ${this.items.length} items`;
    const isEmpty = this.filteredItems.length === 0;
    this.emptyState.classList.toggle('hidden', !isEmpty);
    
    if (isEmpty) {
      this.optionsList.innerHTML = '';
      return;
    }

    this.optionsList.innerHTML = this.filteredItems.map((item, idx) =>
      renderOptionItemHtml(item, query, item.value === this.selectedValue, idx === this.activeIndex)
    ).join('');

    this.optionsList.querySelectorAll('.searchable-option-item').forEach((el, index) => {
      el.addEventListener('click', () => this.select(this.filteredItems[index]));
    });
  }

  navigateOptions(dir) {
    if (this.filteredItems.length === 0) return;
    this.activeIndex = (this.activeIndex + dir + this.filteredItems.length) % this.filteredItems.length;
    this.renderOptionsList(this.searchInput.value);
  }

  select(item, triggerCallback = true) {
    if (!item) return;
    this.selectedValue = item.value || item.id;
    this.selectedItem = item;
    this.triggerText.textContent = item.name || item.text;
    this.triggerBtn.classList.add('has-selection');

    if (item.publicId) {
      this.triggerBadge.textContent = item.publicId;
      this.triggerBadge.className = 'searchable-trigger-badge searchable-badge badge-public';
    } else if (item.id) {
      this.triggerBadge.textContent = `ID: ${item.id}`;
      this.triggerBadge.className = 'searchable-trigger-badge searchable-badge badge-id';
    } else {
      this.triggerBadge.classList.add('hidden');
    }

    this.close();
    if (triggerCallback && this.onSelectCallback) this.onSelectCallback(item);
  }

  getValue() {
    return this.selectedValue;
  }

  setLoading(msg = 'Loading...') {
    this.triggerText.textContent = msg;
    this.setDisabled(true);
  }

  reset(newPlaceholder = null) {
    this.items = [];
    this.filteredItems = [];
    this.selectedValue = '';
    this.selectedItem = null;
    this.activeIndex = -1;
    if (newPlaceholder) this.placeholder = newPlaceholder;
    this.triggerText.textContent = this.placeholder;
    this.triggerBadge.classList.add('hidden');
    this.triggerBtn.classList.remove('has-selection');
    this.setDisabled(true);
    this.close();
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    this.triggerBtn.disabled = disabled;
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (this.disabled) return;
    this.isOpen = true;
    this.dropdown.classList.remove('hidden');
    this.triggerBtn.classList.add('open');
    this.chevron.style.transform = 'rotate(180deg)';
    this.searchInput.focus();
    this.renderOptionsList(this.searchInput.value);
  }

  close() {
    this.isOpen = false;
    this.dropdown.classList.add('hidden');
    this.triggerBtn.classList.remove('open');
    this.chevron.style.transform = 'rotate(0deg)';
    this.activeIndex = -1;
  }
}
