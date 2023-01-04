'use strict';
import { JsonApiRegistry } from 'https://unpkg.com/api-registry/index.js?module';

(function() {
  class EditableList extends HTMLElement {
    constructor() {
      // establish prototype chain
      super();

      // attaches shadow tree and returns shadow root reference
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
      const shadow = this.attachShadow({ mode: 'open' });

      // creating a container for the editable-list component
      const editableListContainer = document.createElement('div');
      // adding a class to our container for the sake of clarity
      editableListContainer.classList.add('editable-list');

      // binding methods
      this.addListItem = this.addListItem.bind(this);
      this.handleRemoveItemListeners = this.handleRemoveItemListeners.bind(this);
      this.removeListItem = this.removeListItem.bind(this);
      this.reload = this.reload.bind(this);

      // appending the container to the shadow DOM
      shadow.appendChild(editableListContainer);

      // build API
      const api = JsonApiRegistry.api('todos-api');
      this.api = {
        getTodos: api.endpoint('{?limit,skip}').receives().withTTL(2000).buildWithParse(),
        addTodo: api.endpoint('/add', 'post').receives().buildWithParse(),
        deleteTodo: api.endpoint('/{id}', 'delete').receives().build()
      };
    }

    // add items to the list
    addListItem(e) {
      const textInput = this.shadowRoot.querySelector('.add-new-list-item-input');

      if (textInput.value) {
        this.api.addTodo({
          todo: 'Use DummyJSON in the project',
          completed: false,
          userId: 1
        })
        .then(() => {
          const li = document.createElement('li');
          const button = document.createElement('button');
          const childrenLength = this.itemList.children.length;

          li.textContent = textInput.value;
          button.classList.add('editable-list-remove-item', 'icon');
          button.innerHTML = '&ominus;';

          this.itemList.appendChild(li);
          this.itemList.children[childrenLength].appendChild(button);

          this.handleRemoveItemListeners([button]);

          textInput.value = '';
        });
      }
    }

    // reload the list
    reload() {
      this.connectedCallback();
    }

    // fires after the element has been attached to the DOM
    connectedCallback() {      
      this.loadItems().then(() => {
        const removeElementButtons = [...this.shadowRoot.querySelectorAll('.editable-list-remove-item')];
        const addElementButton = this.shadowRoot.querySelector('.editable-list-add-item');
        const reloadButton = this.shadowRoot.querySelector('.editable-list-reload');

        this.itemList = this.shadowRoot.querySelector('.item-list');

        this.handleRemoveItemListeners(removeElementButtons);
        addElementButton.addEventListener('click', this.addListItem, false);
        reloadButton.addEventListener('click', this.reload, false);
      });
    }

    // gathering data from element attributes
    get title() {
      return this.getAttribute('title') || '';
    }

    loadItems() {
      return this.api.getTodos({ limit: 5, skip: 0 }).then((todosData) => {
        const todos = todosData.todos.map((todo) => todo.todo);

        // creating the inner HTML of the editable list element
        const editableListContainer = this.shadowRoot.querySelector('.editable-list');
        editableListContainer.innerHTML = `
          <style>
            li, div > div {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }

            .icon {
              background-color: #fff;
              border: none;
              cursor: pointer;
              float: right;
              font-size: 1.8rem;
            }

            .editable-list-reload {
              margin-top: -5px;
            }
          </style>
          <h3>${this.title}<button class="editable-list-reload icon" title="Reload">&orarr;</button></h3>
          <ul class="item-list">
            ${todos.map(item => `
              <li>${item}
                <button class="editable-list-remove-item icon">&ominus;</button>
              </li>
            `).join('')}
          </ul>
          <div>
            <label>${this.addItemText}</label>
            <input class="add-new-list-item-input" type="text"></input>
            <button class="editable-list-add-item icon">&oplus;</button>
          </div>
        `;
      });
    }

    get addItemText() {
      return this.getAttribute('add-item-text') || '';
    }

    handleRemoveItemListeners(arrayOfElements) {
      arrayOfElements.forEach(element => {
        element.addEventListener('click', this.removeListItem, false);
      });
    }

    removeListItem(e) {
      const item = e.target.parentNode;
      this.api.deleteTodo({ id: 1 }).then(() => item.remove());
    }
  }

  // let the browser know about the custom element
  customElements.define('editable-list', EditableList);
})();
