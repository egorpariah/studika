import CityButton from "./cityButton.js";
import LocationSelector from "./locationSelector.js";

export default class Header {
  constructor(element) {
    this.element = element;
    this.locationSelector = new LocationSelector(
      document.querySelector(".location-selector")
    );
    this.cityButton = new CityButton(
      document.querySelector(".city__button"),
      this.onClick.bind(this)
    );
    this.onDocumentClick = this.onDocumentClick.bind(this);
  }

  async onClick(e) {
    e.stopPropagation();

    if (this.locationSelector.isHidden) {
      this.locationSelector.show();
      if (!this.locationSelector.areas) {
        await this.locationSelector.getAreas();
        this.locationSelector.fillLocations(this.locationSelector.areas);
        this.locationSelector.enableSelectedFromCookies();
      }
      document.body.addEventListener("click", this.onDocumentClick);
    } else {
      this.locationSelector.hide();
      document.body.removeEventListener("click", this.onDocumentClick);
    }
  }

  onDocumentClick(e) {
    if (!this.locationSelector.isHidden) {
      this.locationSelector.hide();
      document.body.removeEventListener("click", this.onDocumentClick);
    }
  }
}
