export default class CityButton {
  constructor(element, onClick) {
    this.element = element;
    this.onClick = onClick;

    this.element.addEventListener("click", (e) => {
      this.onClick(e);
    });
  }
}
