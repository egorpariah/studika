export default class LocationSelector {
  constructor(element) {
    this.element = element;
    this.isHidden = true;
    this.locationsSearch = element.querySelector(
      '[data-role="locations-search"]'
    );
    this.locationsList = element.querySelector(".location-selector__list");
    this.saveButton = element.querySelector(".location-selector__button");
    this.selectedLocations = element.querySelector(
      ".location-selector__selected"
    );

    this.locationsSearch.addEventListener("input", () => {
      this.locationsList.innerHTML = "";
      this.fillLocations(this.areas);
    });
    this.element.addEventListener("click", (e) => {
      this.toggleSelectedBadge(e);
    });
    this.saveButton.addEventListener("click", (e) => {
      e.preventDefault();

      if (!this.saveButton.classList.contains("button--disabled"))
        this.setCookies();
    });

    const observer = new MutationObserver(() => {
      this.changeSaveButton();
    });

    observer.observe(this.selectedLocations, {
      childList: true,
      subtree: true,
    });

    this.setLocationsFromCookies.call(this);
  }

  setLocationsFromCookies() {
    const cookies = this.getCookies();
    let selectedLocations = [];
    let selectedText = "Любой регион";

    if (cookies["selected_locations"])
      selectedLocations = JSON.parse(cookies["selected_locations"]);

    for (const item of selectedLocations) {
      selectedText === "Любой регион"
        ? (selectedText = item.name)
        : (selectedText += `, ${item.name}`);
    }

    document.querySelector(".city__name").textContent = selectedText;
  }

  enableSelectedFromCookies() {
    const cookies = this.getCookies();
    let selectedLocations = [];

    if (cookies["selected_locations"])
      selectedLocations = JSON.parse(cookies["selected_locations"]);

    for (const item of selectedLocations) {
      const selectedItem = this.locationsList.querySelector(
        `[data-type="${item.type}"][data-id="${item.id}"] button`
      );
      selectedItem.classList.add("location__item--active");

      const text = selectedItem.querySelector(".location__name").textContent;
      const div = document.createElement("div");
      div.classList.add("location-selector__badge", "badge");
      div.dataset.type = item.type;
      div.dataset.id = item.id;
      div.innerHTML = `
          ${text}
          <button class="badge__remove">
            <svg class="badge__icon">
              <use xlink:href="template/images/sprite.svg#close"></use>
            </svg>
          </button>`;

      this.selectedLocations.appendChild(div);
    }

    this.selectedLocations.classList.remove("hidden");
  }

  toggleSelectedBadge(e) {
    e.stopPropagation();

    const locationItem = e.target.closest(".location__item");
    const closeButton = e.target.closest(".badge__remove");
    let type, id;
    if (locationItem) {
      type = locationItem.parentElement.dataset.type;
      id = locationItem.parentElement.dataset.id;

      if (locationItem.classList.contains("location__item--active")) {
        locationItem.classList.remove("location__item--active");
        this.selectedLocations
          .querySelector(`[data-type="${type}"][data-id="${id}"]`)
          .remove();
        if (this.selectedLocations.children.length === 0)
          this.selectedLocations.classList.add("hidden");
      } else {
        locationItem.classList.add("location__item--active");
        this.selectedLocations.classList.remove("hidden");

        const text = locationItem.querySelector(".location__name").textContent;
        const div = document.createElement("div");
        div.classList.add("location-selector__badge", "badge");
        div.dataset.type = type;
        div.dataset.id = id;
        div.innerHTML = `
          ${text}
          <button class="badge__remove">
            <svg class="badge__icon">
              <use xlink:href="template/images/sprite.svg#close"></use>
            </svg>
          </button>`;
        this.selectedLocations.appendChild(div);
      }
    }

    if (closeButton) {
      type = closeButton.parentElement.dataset.type;
      id = closeButton.parentElement.dataset.id;

      const locationItemActive = this.locationsList.querySelector(
        `[data-type="${type}"][data-id="${id}"] button`
      );
      locationItemActive.classList.remove("location__item--active");
      closeButton.parentElement.remove();
      if (this.selectedLocations.children.length === 0)
        this.selectedLocations.classList.add("hidden");
    }
  }

  fillLocations(locations) {
    document.querySelector(".location-selector__preloader")?.remove();
    const fragment = this.generateList(locations);
    this.locationsList.appendChild(fragment);
  }

  generateItem(item, area) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    const spanName = document.createElement("span");
    li.classList.add("location-selector__item", "location");
    item.type ? (li.dataset.type = item.type) : (li.dataset.type = "city");
    li.dataset.id = item.id;

    button.classList.add("location__item");

    spanName.classList.add("location__name");
    spanName.innerHTML = this.coloringMatch(item.name);

    li.appendChild(button);
    button.appendChild(spanName);

    if (item["state_id"]) {
      const spanRegion = document.createElement("span");
      spanRegion.classList.add("location__region");
      spanRegion.textContent = area.name;
      button.appendChild(spanRegion);
    }

    return li;
  }

  generateList(locations) {
    const fragment = document.createDocumentFragment();

    for (const item of locations) {
      if (this.filter(item)) {
        fragment.appendChild(this.generateItem(item));
      }
      if (item.cities) {
        for (const city of item.cities) {
          if (this.filter(city)) {
            fragment.appendChild(this.generateItem(city, item));
          }
        }
      }
    }

    return fragment;
  }

  async getAreas() {
    const res = await fetch(`https://studika.ru/api/areas`, {
      method: "post",
    });
    this.areas = await res.json();
  }

  filter(item) {
    if (
      this.isMatching(item.name, this.locationsSearch.value) ||
      this.locationsSearch.value === ""
    ) {
      return true;
    }

    return false;
  }

  coloringMatch(string) {
    if (this.locationsSearch.value === "") return string;
    const re = new RegExp(this.locationsSearch.value, "gi");
    return string.replace(re, `<span class="location__coloring">$&</span>`);
  }

  isMatching(full, chunk) {
    full = full.toLowerCase();
    chunk = chunk.toLowerCase();

    return full.indexOf(chunk) < 0 ? false : true;
  }

  changeSaveButton() {
    const cookies = this.getCookies();
    let result = [];
    let cookiesLocations = [];

    if (cookies["selected_locations"]) {
      cookiesLocations = JSON.parse(cookies["selected_locations"]);

      for (let i = 0; i < cookiesLocations.length; i++) {
        let disabled = 0;
        for (let j = 0; j < this.selectedLocations.children.length; j++) {
          if (
            cookiesLocations[i].name ===
            this.selectedLocations.children[j].textContent.trim()
          ) {
            disabled = 1;
            break;
          } else {
            disabled = 0;
          }
        }

        result.push(disabled);
      }
    }

    if (this.selectedLocations.children.length > cookiesLocations.length) {
      result.push(0);
    }

    if (result.includes(0)) {
      this.saveButton.classList.remove("button--disabled");
    } else {
      this.saveButton.classList.add("button--disabled");
    }
  }

  setCookies() {
    const selectedData = [];
    let selectedText = "Любой регион";
    let date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    date = date.toUTCString();

    for (const child of this.selectedLocations.children) {
      const dataObject = {};

      dataObject.type = child.dataset.type;
      dataObject.id = child.dataset.id;
      dataObject.name = child.textContent.trim();

      selectedData.push(dataObject);

      selectedText === "Любой регион"
        ? (selectedText = child.textContent.trim())
        : (selectedText += `, ${child.textContent.trim()}`);
    }

    document.cookie = `selected_locations=${
      selectedData.length
        ? JSON.stringify(selectedData) + "; expires=" + date
        : "; max-age=0"
    }`;

    fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      body: JSON.stringify(selectedData),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((response) => response.json())
      .then((json) => console.log("Server response: ", json));

    this.saveButton.classList.add("button--disabled");
    document.querySelector(".city__name").textContent = selectedText;
  }

  getCookies() {
    return document.cookie.split("; ").reduce((prev, current) => {
      const [name, value] = current.split("=");
      prev[name] = value;
      return prev;
    }, {});
  }

  show() {
    this.element.classList.remove("hidden");
    this.isHidden = false;
  }

  hide() {
    this.element.classList.add("hidden");
    this.isHidden = true;
  }
}
