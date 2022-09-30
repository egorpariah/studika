import Header from "./modules/header.js";
import SimpleBar from "simplebar";

new Header(document.querySelector(".header"));
new SimpleBar(document.querySelector(".location-selector__locations"), {
  autoHide: false,
  scrollbarMinSize: 40,
});

const menuItems = document.querySelectorAll(".menu__item");

for (const item of menuItems) {
  item.addEventListener("mouseover", () => {
    const [dropdown] = item.getElementsByClassName("dropdown");

    if (dropdown) {
      dropdown.style.left = `${item.offsetLeft}px`;
      dropdown.style.top = `${item.offsetTop + 32}px`;
    }
  });
}
